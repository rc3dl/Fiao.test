-- 003 - Upgrade transaccional de la sincronización y de las reglas de seguridad.
-- Se puede aplicar sobre el esquema base de FIA'O. No modifica filas económicas existentes.
-- Reinstala la firma segura de ventas (también si una versión anterior de 001 ya se ejecutó),
-- crea el historial offline si todavía no existe y añade las protecciones concurrentes.
--
-- Aplicar una vez después de revisar el esquema existente. No ejecutar sobre otro proyecto.

begin;

-- Preparación para sincronización central: columnas de versión e historial por operación.
alter table public.clients
  add column if not exists updated_at timestamptz not null default now();
alter table public.products
  add column if not exists updated_at timestamptz not null default now();

-- Keep optimistic concurrency timestamps current on every edit.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists clients_touch_updated_at on public.clients;
create trigger clients_touch_updated_at
  before update on public.clients
  for each row execute function public.touch_updated_at();

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();


create table if not exists public.audit_log (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  table_name text not null,
  record_id uuid,
  operation text not null check (operation in ('create', 'update', 'delete')),
  op_type text not null,
  old_values jsonb,
  new_values jsonb,
  device_id text,
  occurred_at timestamptz not null,
  synced_at timestamptz not null default now(),
  status text not null check (status in ('applied', 'conflict', 'rejected')),
  message text
);

create index if not exists audit_log_owner_time_idx
  on public.audit_log (owner_id, occurred_at desc);
create index if not exists audit_log_record_idx
  on public.audit_log (owner_id, record_id);

alter table public.audit_log enable row level security;
drop policy if exists audit_log_select_own on public.audit_log;
create policy audit_log_select_own on public.audit_log
  for select to authenticated using (owner_id = auth.uid());
drop policy if exists audit_log_insert_own on public.audit_log;
create policy audit_log_insert_own on public.audit_log
  for insert to authenticated with check (owner_id = auth.uid());
grant select, insert on public.audit_log to authenticated;

-- Restricción compatible con productos existentes que tengan cantidades fraccionarias heredadas.
alter table public.products
  drop constraint if exists products_whole_units_chk;

create or replace function public.enforce_whole_product_units()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' then
    if new.unit not in ('lb', 'kg', 'liter')
       and (new.stock <> trunc(new.stock) or new.min_stock <> trunc(new.min_stock)) then
      raise exception 'Stock and minimum stock must be whole numbers for unit %.', new.unit;
    end if;
    return new;
  end if;

  if new.unit not in ('lb', 'kg', 'liter') then
    if new.unit is distinct from old.unit
       and (new.stock <> trunc(new.stock) or new.min_stock <> trunc(new.min_stock)) then
      raise exception 'Correct stock and minimum stock before changing to whole units.';
    end if;
    if new.stock is distinct from old.stock and new.stock <> trunc(new.stock) then
      raise exception 'Stock must be a whole number for unit %.', new.unit;
    end if;
    if new.min_stock is distinct from old.min_stock and new.min_stock <> trunc(new.min_stock) then
      raise exception 'Minimum stock must be a whole number for unit %.', new.unit;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_whole_units_guard on public.products;
create trigger products_whole_units_guard
  before insert or update of unit, stock, min_stock on public.products
  for each row execute function public.enforce_whole_product_units();


-- Las tablas base, políticas RLS, vista y trigger de alta ya pertenecen a schema.sql.
-- Esta migración solo actualiza los componentes necesarios para el nuevo sync.

-- Reinstalar la función de venta con clave obligatoria y bloqueo por propietario + request_id.
drop function if exists public.register_fiado_sale(uuid, jsonb, date, text);

create or replace function public.register_fiado_sale(
  p_client_id uuid,
  p_items jsonb,
  p_due_date date default null,
  p_note text default null,
  p_request_id uuid default null,
  p_occurred_at timestamptz default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_row record;
  v_prod record;
  v_total numeric(12,2) := 0;
  v_summary text := '';
  v_entry_id uuid;
  v_when timestamptz := least(coalesce(p_occurred_at, now()), now());
  v_due date := p_due_date;
begin
  if v_owner is null then
    raise exception 'Not authenticated.';
  end if;

  -- Toda venta debe llevar una clave. El bloqueo por dueño + clave serializa los reintentos.
  if p_request_id is null then
    raise exception 'An idempotency key is required to register a credit sale.';
  end if;
  perform pg_advisory_xact_lock(hashtext(v_owner::text), hashtext('fiado_sale:' || p_request_id::text));
  select e.id into v_entry_id
    from public.credit_entries e
   where e.id = p_request_id and e.owner_id = v_owner;
  if found then
    return v_entry_id;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one product.';
  end if;
  if not exists (
    select 1 from public.clients c
     where c.id = p_client_id and c.owner_id = v_owner and not c.archived
  ) then
    raise exception 'Customer not found.';
  end if;

  for v_row in
    select (x ->> 'product_id')::uuid as pid, sum((x ->> 'quantity')::numeric) as qty
      from jsonb_array_elements(p_items) as x
     group by 1
     order by 1
  loop
    if v_row.qty is null or v_row.qty <= 0 then
      raise exception 'Quantities must be greater than 0.';
    end if;

    select p.* into v_prod
      from public.products p
     where p.id = v_row.pid and p.owner_id = v_owner and not p.archived
       for update;
    if not found then
      raise exception 'Product not found.';
    end if;
    if v_prod.stock < v_row.qty then
      raise exception 'Not enough stock of %: only % available.', v_prod.name, trim_scale(v_prod.stock);
    end if;

    v_total := v_total + round(v_prod.price * v_row.qty, 2);
    v_summary := v_summary
      || case when v_summary = '' then '' else ', ' end
      || v_prod.name || ' x' || trim_scale(v_row.qty)::text;
  end loop;

  if v_total <= 0 then
    raise exception 'The total must be greater than 0.';
  end if;

  if v_due is null then
    v_due := (v_when at time zone 'America/Panama')::date
      + coalesce((select p.default_due_days from public.profiles p where p.id = v_owner), 15);
  end if;

  insert into public.credit_entries (id, client_id, kind, amount, description, due_date, created_at)
  values (coalesce(p_request_id, gen_random_uuid()), p_client_id, 'fiado', v_total,
          coalesce(nullif(trim(p_note), ''), v_summary), v_due, v_when)
  returning id into v_entry_id;

  for v_row in
    select (x ->> 'product_id')::uuid as pid, sum((x ->> 'quantity')::numeric) as qty
      from jsonb_array_elements(p_items) as x
     group by 1
     order by 1
  loop
    select p.* into v_prod
      from public.products p
     where p.id = v_row.pid and p.owner_id = v_owner;

    insert into public.credit_entry_items (entry_id, product_id, product_name, quantity, unit_price)
    values (v_entry_id, v_prod.id, v_prod.name, v_row.qty, v_prod.price);

    update public.products
       set stock = stock - v_row.qty
     where id = v_prod.id and owner_id = v_owner;
  end loop;

  return v_entry_id;
end;
$$;

revoke all on function public.register_fiado_sale(uuid, jsonb, date, text, uuid, timestamptz) from public, anon;
grant execute on function public.register_fiado_sale(uuid, jsonb, date, text, uuid, timestamptz) to authenticated;

-- Toda entrada debe corresponder a un cliente activo. Comparte el lock con el guard de archivo.
create or replace function public.check_credit_entry()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_fiado numeric(12,2);
  v_pago numeric(12,2);
  v_balance numeric(12,2);
  v_limit numeric(12,2);
  v_auto_block boolean;
  v_days integer;
  v_default_limit numeric(12,2);
  v_archived boolean;
begin
  -- Lock the client row first. The archive trigger also runs while holding this row,
  -- so a concurrent archive and credit cannot pass each other's balance checks.
  select c.archived into v_archived
    from public.clients c
   where c.id = new.client_id
     and c.owner_id = new.owner_id
   for update;

  if not found or coalesce(v_archived, true) then
    raise exception 'Customer not found or already archived.';
  end if;

  -- Then serialize all credit/payment balance calculations for this customer.
  perform pg_advisory_xact_lock(hashtext(new.client_id::text));

  -- Current balance of the customer, not counting this entry
  select coalesce(sum(case when kind = 'fiado' then amount end), 0),
         coalesce(sum(case when kind = 'pago' then amount end), 0)
    into v_fiado, v_pago
    from public.credit_entries
   where client_id = new.client_id and owner_id = new.owner_id;
  v_balance := v_fiado - v_pago;

  if new.kind = 'pago' then
    if new.amount > v_balance then
      raise exception 'The payment (B/. %) is higher than the debt (B/. %).',
        to_char(new.amount, 'FM999990.00'), to_char(v_balance, 'FM999990.00');
    end if;
    return new;
  end if;

  -- It is a credit: merchant settings
  select p.auto_block, p.default_due_days, p.default_credit_limit
    into v_auto_block, v_days, v_default_limit
    from public.profiles p
   where p.id = new.owner_id;
  v_auto_block := coalesce(v_auto_block, true);
  v_days := coalesce(v_days, 15);
  v_default_limit := coalesce(v_default_limit, 100);

  -- Default due date
  if new.due_date is null then
    new.due_date := (now() at time zone 'America/Panama')::date + v_days;
  end if;

  -- Customer limit (or the merchant default if the customer has none)
  select coalesce(c.credit_limit, v_default_limit)
    into v_limit
    from public.clients c
   where c.id = new.client_id and c.owner_id = new.owner_id;

  if v_auto_block and v_balance + new.amount > v_limit then
    raise exception 'Blocked: debt (B/. %) plus this credit (B/. %) is over the limit (B/. %).',
      to_char(v_balance, 'FM999990.00'), to_char(new.amount, 'FM999990.00'), to_char(v_limit, 'FM999990.00');
  end if;

  return new;
end;
$$;

drop trigger if exists credit_entry_rules on public.credit_entries;
create trigger credit_entry_rules
  before insert on public.credit_entries
  for each row execute function public.check_credit_entry();

create or replace function public.prevent_client_archive_with_balance()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_balance numeric(12,2);
begin
  if new.archived and not old.archived then
    -- Explicitly hold the client row before the shared balance lock.
    perform 1
      from public.clients c
     where c.id = new.id and c.owner_id = new.owner_id
       for update;
    if not found then
      raise exception 'Customer not found.';
    end if;

    perform pg_advisory_xact_lock(hashtext(new.id::text));

    select coalesce(sum(case when e.kind = 'fiado' then e.amount else -e.amount end), 0)
      into v_balance
      from public.credit_entries e
     where e.client_id = new.id
       and e.owner_id = new.owner_id;

    if v_balance > 0 then
      raise exception 'Cannot archive a customer with an outstanding balance.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists clients_prevent_archive_with_balance on public.clients;
create trigger clients_prevent_archive_with_balance
  before update of archived on public.clients
  for each row execute function public.prevent_client_archive_with_balance();


-- Serializa idempotency check + aplicación + auditoría para que dos reintentos simultáneos
-- con el mismo operation id no puedan ejecutar la operación económica dos veces.
create or replace function public.apply_sync_op(p_op jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_owner  uuid := auth.uid();
  v_id     uuid := nullif(p_op ->> 'id', '')::uuid;
  v_type   text := p_op ->> 'type';
  v_rid    uuid := nullif(p_op ->> 'record_id', '')::uuid;
  v_pay    jsonb := coalesce(p_op -> 'payload', '{}'::jsonb);
  v_base   timestamptz := nullif(p_op ->> 'base_version', '')::timestamptz;
  v_force  boolean := coalesce((p_op ->> 'force')::boolean, false);
  v_when   timestamptz := least(coalesce(nullif(p_op ->> 'occurred_at', '')::timestamptz, now()), now());
  v_table  text;
  v_oper   text;
  v_status text := 'applied';
  v_msg    text;
  v_old    jsonb;
  v_new    jsonb;
  v_prev   record;
begin
  if v_owner is null then
    raise exception 'Not authenticated.';
  end if;
  if v_id is null or v_type is null then
    raise exception 'Invalid operation.';
  end if;

  -- Serialize the idempotency check, the write and its audit row as one unit.
  perform pg_advisory_xact_lock(hashtext(v_owner::text), hashtext(v_id::text));

  -- Already received? (a retry after a lost answer)
  select a.status, a.message into v_prev
    from public.audit_log a
   where a.id = v_id and a.owner_id = v_owner;
  if found then
    return jsonb_build_object(
      'status', case when v_prev.status = 'applied' then 'duplicate' else v_prev.status end,
      'message', v_prev.message
    );
  end if;

  v_table := case split_part(v_type, '.', 1)
    when 'client'   then 'clients'
    when 'product'  then 'products'
    when 'credit'   then 'credit_entries'
    when 'sale'     then 'credit_entries'
    when 'reminder' then 'reminders'
    when 'profile'  then 'profiles'
  end;
  if v_table is null then
    raise exception 'Unknown operation type.';
  end if;
  v_oper := case when v_type like '%.archive' then 'delete'
                 when v_type like '%.update'  then 'update'
                 else 'create' end;

  -- Everything inside this block is undone if a rule rejects the change
  begin
    if v_type = 'client.create' then
      insert into public.clients (id, name, phone, credit_limit)
      values (coalesce(v_rid, gen_random_uuid()), v_pay ->> 'name', nullif(v_pay ->> 'phone', ''), nullif(v_pay ->> 'credit_limit', '')::numeric)
      returning to_jsonb(clients) into v_new;

    elsif v_type in ('client.update', 'client.archive') then
      select to_jsonb(c) into v_old from public.clients c where c.id = v_rid;
      if v_old is null then
        raise exception 'Customer not found.';
      end if;
      if v_type = 'client.update' and not v_force and v_base is not null
         and (v_old ->> 'updated_at')::timestamptz <> v_base then
        v_status := 'conflict';
        v_msg := 'The customer was changed on another device.';
        v_new := v_old;
      elsif v_type = 'client.archive' then
        update public.clients set archived = true where id = v_rid returning to_jsonb(clients) into v_new;
      else
        update public.clients set
          name         = case when v_pay ? 'name' then v_pay ->> 'name' else name end,
          phone        = case when v_pay ? 'phone' then nullif(v_pay ->> 'phone', '') else phone end,
          credit_limit = case when v_pay ? 'credit_limit' then nullif(v_pay ->> 'credit_limit', '')::numeric else credit_limit end
        where id = v_rid
        returning to_jsonb(clients) into v_new;
      end if;

    elsif v_type = 'product.create' then
      insert into public.products (id, name, category, price, stock, unit, min_stock, image_url)
      values (
        coalesce(v_rid, gen_random_uuid()),
        v_pay ->> 'name',
        nullif(v_pay ->> 'category', ''),
        coalesce(nullif(v_pay ->> 'price', '')::numeric, 0),
        coalesce(nullif(v_pay ->> 'stock', '')::numeric, 0),
        coalesce(nullif(v_pay ->> 'unit', ''), 'unit'),
        coalesce(nullif(v_pay ->> 'min_stock', '')::numeric, 0),
        nullif(v_pay ->> 'image_url', '')
      )
      returning to_jsonb(products) into v_new;

    elsif v_type in ('product.update', 'product.archive') then
      select to_jsonb(p) into v_old from public.products p where p.id = v_rid;
      if v_old is null then
        raise exception 'Product not found.';
      end if;
      if v_type = 'product.update' and not v_force and v_base is not null
         and (v_old ->> 'updated_at')::timestamptz <> v_base then
        v_status := 'conflict';
        v_msg := 'The product was changed on another device.';
        v_new := v_old;
      elsif v_type = 'product.archive' then
        update public.products set archived = true where id = v_rid returning to_jsonb(products) into v_new;
      else
        update public.products set
          name      = case when v_pay ? 'name' then v_pay ->> 'name' else name end,
          category  = case when v_pay ? 'category' then nullif(v_pay ->> 'category', '') else category end,
          price     = case when v_pay ? 'price' then (v_pay ->> 'price')::numeric else price end,
          stock     = case when v_pay ? 'stock' then (v_pay ->> 'stock')::numeric else stock end,
          unit      = case when v_pay ? 'unit' then coalesce(nullif(v_pay ->> 'unit', ''), unit) else unit end,
          min_stock = case when v_pay ? 'min_stock' then (v_pay ->> 'min_stock')::numeric else min_stock end,
          image_url = case when v_pay ? 'image_url' then nullif(v_pay ->> 'image_url', '') else image_url end
        where id = v_rid
        returning to_jsonb(products) into v_new;
      end if;

    elsif v_type in ('credit.fiado', 'credit.pago') then
      -- The date of the sale is when it happened on the device (it may have been offline)
      insert into public.credit_entries (id, client_id, kind, amount, description, due_date, created_at)
      values (
        coalesce(v_rid, gen_random_uuid()),
        (v_pay ->> 'client_id')::uuid,
        case when v_type = 'credit.fiado' then 'fiado' else 'pago' end,
        (v_pay ->> 'amount')::numeric,
        nullif(v_pay ->> 'description', ''),
        case
          when nullif(v_pay ->> 'due_date', '') is not null then (v_pay ->> 'due_date')::date
          when v_type = 'credit.fiado' then
            (v_when at time zone 'America/Panama')::date
            + coalesce((select p.default_due_days from public.profiles p where p.id = v_owner), 15)
        end,
        v_when
      )
      returning to_jsonb(credit_entries) into v_new;

    elsif v_type = 'sale.fiado' then
      v_rid := public.register_fiado_sale(
        (v_pay ->> 'client_id')::uuid,
        v_pay -> 'items',
        nullif(v_pay ->> 'due_date', '')::date,
        nullif(v_pay ->> 'note', ''),
        v_rid,    -- clave de idempotencia = id de la operación
        v_when    -- fecha original de la venta
      );
      select to_jsonb(e) into v_new from public.credit_entries e where e.id = v_rid;

    elsif v_type = 'reminder.log' then
      insert into public.reminders (id, client_id, channel, message, sent_at)
      values (coalesce(v_rid, gen_random_uuid()), (v_pay ->> 'client_id')::uuid, 'whatsapp', nullif(v_pay ->> 'message', ''), v_when)
      returning to_jsonb(reminders) into v_new;

    elsif v_type = 'profile.update' then
      insert into public.profiles (id) values (v_owner) on conflict (id) do nothing;
      select to_jsonb(p) into v_old from public.profiles p where p.id = v_owner;
      update public.profiles set
        full_name             = case when v_pay ? 'full_name' then v_pay ->> 'full_name' else full_name end,
        store_name            = case when v_pay ? 'store_name' then v_pay ->> 'store_name' else store_name end,
        phone                 = case when v_pay ? 'phone' then v_pay ->> 'phone' else phone end,
        address               = case when v_pay ? 'address' then v_pay ->> 'address' else address end,
        ruc                   = case when v_pay ? 'ruc' then v_pay ->> 'ruc' else ruc end,
        default_credit_limit  = case when v_pay ? 'default_credit_limit' then (v_pay ->> 'default_credit_limit')::numeric else default_credit_limit end,
        default_due_days      = case when v_pay ? 'default_due_days' then (v_pay ->> 'default_due_days')::integer else default_due_days end,
        auto_block            = case when v_pay ? 'auto_block' then (v_pay ->> 'auto_block')::boolean else auto_block end,
        notifications_enabled = case when v_pay ? 'notifications_enabled' then (v_pay ->> 'notifications_enabled')::boolean else notifications_enabled end,
        language              = case when v_pay ? 'language' then v_pay ->> 'language' else language end,
        updated_at            = now()
      where id = v_owner
      returning to_jsonb(profiles) into v_new;
    end if;

    if v_type in ('client.create', 'product.create', 'credit.fiado', 'credit.pago', 'sale.fiado', 'reminder.log') then
      v_rid := coalesce(v_rid, (v_new ->> 'id')::uuid);
    end if;
  exception when others then
    v_status := 'rejected';
    v_msg := sqlerrm;
    v_new := null;
  end;

  insert into public.audit_log
    (id, owner_id, table_name, record_id, operation, op_type, old_values, new_values, device_id, occurred_at, status, message)
  values
    (v_id, v_owner, v_table, v_rid, v_oper, v_type, v_old,
     case when v_status = 'applied' then v_new else v_pay end,
     p_op ->> 'device_id', v_when, v_status, v_msg);

  return jsonb_build_object(
    'status', v_status,
    'message', v_msg,
    'row', case when v_status = 'conflict' then v_new else null end,
    'version', case when v_status = 'applied' then v_new ->> 'updated_at' else null end
  );
end;
$$;

revoke all on function public.apply_sync_op(jsonb) from public;
grant execute on function public.apply_sync_op(jsonb) to authenticated;

commit;
