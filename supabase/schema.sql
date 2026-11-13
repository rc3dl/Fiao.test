-- =============================================================================
-- FIA'O - database schema for Supabase (PostgreSQL)
--
-- How to use it (new project):
--   Supabase Dashboard > SQL Editor > New query > paste this whole file > Run.
--
-- It is written to be safe to run more than once (IF NOT EXISTS, DROP ... IF
-- EXISTS, CREATE OR REPLACE). If you already have a database created by hand,
-- you do not need to run it again.
--
-- Security model: every table has Row Level Security (RLS). Each merchant can
-- only see and change their own rows (owner_id = auth.uid()).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. PROFILES - one row per merchant (store data + credit rules + preferences)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  store_name text,
  phone text,
  address text,
  ruc text,
  default_credit_limit numeric(10,2) not null default 100,
  default_due_days integer not null default 15,
  auto_block boolean not null default true,
  notifications_enabled boolean not null default true,
  language text not null default 'es',
  updated_at timestamptz default now()
);

-- For databases created before these columns existed (no effect on a new one)
alter table public.profiles add column if not exists default_credit_limit numeric(10,2) not null default 100;
alter table public.profiles add column if not exists default_due_days integer not null default 15;
alter table public.profiles add column if not exists auto_block boolean not null default true;
alter table public.profiles add column if not exists notifications_enabled boolean not null default true;
alter table public.profiles add column if not exists language text not null default 'es';

alter table public.profiles drop constraint if exists profiles_default_limit_check;
alter table public.profiles drop constraint if exists profiles_default_days_check;
alter table public.profiles add constraint profiles_default_limit_check check (default_credit_limit >= 0);
alter table public.profiles add constraint profiles_default_days_check check (default_due_days between 1 and 365);


-- -----------------------------------------------------------------------------
-- 2. CLIENTS - the merchant's customers
-- -----------------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  phone text,
  credit_limit numeric(10,2) check (credit_limit is null or credit_limit >= 0),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, owner_id)
);


-- -----------------------------------------------------------------------------
-- 3. PRODUCTS - inventory
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  category text,
  price numeric(10,2) not null default 0 check (price >= 0),
  stock numeric(10,2) not null default 0 check (stock >= 0),
  unit text not null default 'unit',
  min_stock numeric(10,2) not null default 0 check (min_stock >= 0),
  image_url text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, owner_id)
);


-- -----------------------------------------------------------------------------
-- 4. CREDIT ENTRIES - every credit ("fiado") and every payment ("pago").
--    A customer's debt is NEVER stored: it is always calculated as
--    sum(fiado) - sum(pago). Entries cannot be edited or deleted (see policies).
-- -----------------------------------------------------------------------------
create table if not exists public.credit_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null,
  kind text not null check (kind in ('fiado', 'pago')),
  amount numeric(10,2) not null check (amount > 0),
  description text,
  due_date date,
  created_at timestamptz not null default now(),
  unique (id, owner_id),
  check (kind = 'fiado' or due_date is null),
  foreign key (client_id, owner_id) references public.clients (id, owner_id)
);

-- Products taken in each credit sale (price is saved as it was at that moment)
create table if not exists public.credit_entry_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_id uuid not null,
  product_id uuid,
  product_name text not null,
  quantity numeric(10,2) not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  foreign key (entry_id, owner_id) references public.credit_entries (id, owner_id) on delete cascade,
  foreign key (product_id, owner_id) references public.products (id, owner_id)
);


-- -----------------------------------------------------------------------------
-- 5. REMINDERS - log of payment reminders sent to customers
-- -----------------------------------------------------------------------------
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null,
  channel text not null default 'whatsapp',
  message text,
  sent_at timestamptz not null default now(),
  foreign key (client_id, owner_id) references public.clients (id, owner_id)
);


-- -----------------------------------------------------------------------------
-- 6. CONTACT MESSAGES - messages sent from the Contact page
-- -----------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages drop constraint if exists contact_messages_name_len;
alter table public.contact_messages drop constraint if exists contact_messages_email_len;
alter table public.contact_messages drop constraint if exists contact_messages_message_len;
alter table public.contact_messages add constraint contact_messages_name_len check (char_length(trim(name)) between 1 and 100);
alter table public.contact_messages add constraint contact_messages_email_len check (char_length(trim(email)) between 3 and 200);
alter table public.contact_messages add constraint contact_messages_message_len check (char_length(trim(message)) between 10 and 2000);


-- -----------------------------------------------------------------------------
-- 7. INDEXES
-- -----------------------------------------------------------------------------
create index if not exists clients_owner_idx on public.clients (owner_id);
create index if not exists products_owner_idx on public.products (owner_id);
create index if not exists credit_entries_owner_created_idx on public.credit_entries (owner_id, created_at desc);
create index if not exists credit_entries_client_created_idx on public.credit_entries (client_id, created_at desc);


-- -----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY - each merchant only sees their own data
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.credit_entries enable row level security;
alter table public.credit_entry_items enable row level security;
alter table public.reminders enable row level security;
alter table public.contact_messages enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- clients, products, reminders: full access to your own rows
drop policy if exists "clients_own" on public.clients;
drop policy if exists "products_own" on public.products;
drop policy if exists "reminders_own" on public.reminders;
create policy "clients_own" on public.clients for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "products_own" on public.products for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "reminders_own" on public.reminders for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- credit entries and their items: you can read and add, but NOT edit or delete.
-- (A mistake is fixed with a new entry, so the history stays trustworthy.)
drop policy if exists "credit_entries_select_own" on public.credit_entries;
drop policy if exists "credit_entries_insert_own" on public.credit_entries;
drop policy if exists "credit_entry_items_select_own" on public.credit_entry_items;
drop policy if exists "credit_entry_items_insert_own" on public.credit_entry_items;
create policy "credit_entries_select_own" on public.credit_entries for select using (owner_id = auth.uid());
create policy "credit_entries_insert_own" on public.credit_entries for insert with check (owner_id = auth.uid());
create policy "credit_entry_items_select_own" on public.credit_entry_items for select using (owner_id = auth.uid());
create policy "credit_entry_items_insert_own" on public.credit_entry_items for insert with check (owner_id = auth.uid());

-- contact messages: signed-in users can send and read their own
drop policy if exists "contact_messages_insert_own" on public.contact_messages;
drop policy if exists "contact_messages_select_own" on public.contact_messages;
create policy "contact_messages_insert_own" on public.contact_messages for insert to authenticated with check (user_id = auth.uid());
create policy "contact_messages_select_own" on public.contact_messages for select to authenticated using (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 9. VIEW - balance and overdue amount per customer (handy for SQL reports;
--    the app calculates the same numbers in src/lib/credit.js)
-- -----------------------------------------------------------------------------
create or replace view public.client_balances with (security_invoker = true) as
select
  c.id as client_id,
  c.owner_id,
  coalesce(sum(case when e.kind = 'fiado' then e.amount end), 0) as total_fiado,
  coalesce(sum(case when e.kind = 'pago' then e.amount end), 0) as total_pagado,
  coalesce(sum(case when e.kind = 'fiado' then e.amount else -e.amount end), 0) as balance,
  greatest(
    coalesce(sum(case when e.kind = 'fiado'
               and e.due_date < (now() at time zone 'America/Panama')::date
               then e.amount end), 0)
    - coalesce(sum(case when e.kind = 'pago' then e.amount end), 0),
    0
  ) as overdue_balance
from public.clients c
left join public.credit_entries e on e.client_id = c.id
group by c.id, c.owner_id;


-- -----------------------------------------------------------------------------
-- 10. AUTOMATIC PROFILE - create the profile row when someone signs up
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- -----------------------------------------------------------------------------
-- 11. CREDIT RULES - enforced in the database, not only on screen
--     * a payment can never be higher than the current debt
--     * with automatic blocking ON, a credit cannot take a customer over their limit
--     * a credit without due date gets "today + default_due_days" (Panama time)
-- -----------------------------------------------------------------------------
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
begin
  -- One entry at a time per customer (two simultaneous entries cannot skip the limit)
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


-- -----------------------------------------------------------------------------
-- 12. CREDIT SALE FROM THE INVENTORY - one atomic step:
--     checks stock, uses the prices stored in the database, creates the credit,
--     saves the products taken and lowers the stock. If anything fails (not
--     enough stock, limit exceeded...) NOTHING is saved.
--     items = [{ "product_id": "<uuid>", "quantity": 2 }, ...]
-- -----------------------------------------------------------------------------
create or replace function public.register_fiado_sale(
  p_client_id uuid,
  p_items jsonb,
  p_due_date date default null,
  p_note text default null
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
begin
  if v_owner is null then
    raise exception 'Not authenticated.';
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

  -- 1) Check products and stock, and calculate the total with the DATABASE prices
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

  -- 2) Register the credit (the trigger above checks the limit and sets the due date)
  insert into public.credit_entries (client_id, kind, amount, description, due_date)
  values (p_client_id, 'fiado', v_total, coalesce(nullif(trim(p_note), ''), v_summary), p_due_date)
  returning id into v_entry_id;

  -- 3) Save which products were taken and lower the stock
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


-- -----------------------------------------------------------------------------
-- 13. CONTACT ANTI-SPAM - one message per minute per user
-- -----------------------------------------------------------------------------
create or replace function public.limit_contact_messages()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.contact_messages m
     where m.user_id = new.user_id
       and m.created_at > now() - interval '1 minute'
  ) then
    raise exception 'Please wait a minute before sending another message.';
  end if;
  return new;
end;
$$;

drop trigger if exists contact_rate_limit on public.contact_messages;
create trigger contact_rate_limit
  before insert on public.contact_messages
  for each row execute function public.limit_contact_messages();


-- =============================================================================
-- 14. OFFLINE SYNC (Android app): versions, history and one function that applies
--     a change safely. Run it from the SQL Editor like the rest of this file.
--     It does not touch existing rows. The app also works WITHOUT this section
--     (it falls back to direct writes), only without central history or
--     conflict detection.
-- =============================================================================

-- 14.1 A version stamp on editable records, to notice when two devices changed the same one
alter table public.clients  add column if not exists updated_at timestamptz not null default now();
alter table public.products add column if not exists updated_at timestamptz not null default now();

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


-- 14.2 AUDIT LOG - who did what, when, from which device, old and new values.
--      The id is the id of the operation, generated by the app: the same operation can never be applied twice.
--      There are no UPDATE or DELETE policies: the history cannot be edited or erased from the app.
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

create index if not exists audit_log_owner_time_idx on public.audit_log (owner_id, occurred_at desc);
create index if not exists audit_log_record_idx on public.audit_log (owner_id, record_id);

alter table public.audit_log enable row level security;

drop policy if exists audit_log_select_own on public.audit_log;
create policy audit_log_select_own on public.audit_log
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists audit_log_insert_own on public.audit_log;
create policy audit_log_insert_own on public.audit_log
  for insert to authenticated with check (owner_id = auth.uid());


-- 14.3 APPLY ONE CHANGE (used by the Android app for every write)
--      * already received -> answers "duplicate" and applies nothing (safe retries)
--      * the record changed on another device since the user saw it -> "conflict" (nothing is overwritten)
--      * a credit rule says no (limit, payment too high, stock...) -> "rejected" with the reason
--      * otherwise it is applied. In every case the result is written to the audit log.
--      It runs with the caller's permissions, so Row Level Security and the credit rules still apply.
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
        nullif(v_pay ->> 'note', '')
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


-- -----------------------------------------------------------------------------
-- 15. APP RELEASES (Android updates) - the app asks which is the latest version.
--     Anyone can READ published releases; only you (SQL Editor or the server key
--     of the Vercel API) can create them. version_code must grow with every
--     release (it is calculated from package.json: 1.2.3 -> 10203).
-- -----------------------------------------------------------------------------
create table if not exists public.app_releases (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'android' check (platform in ('android')),
  version_name text not null,
  version_code integer not null check (version_code > 0),
  apk_url text not null,
  notes_es text,
  notes_en text,
  mandatory boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  unique (platform, version_code)
);

alter table public.app_releases enable row level security;

drop policy if exists app_releases_read on public.app_releases;
create policy app_releases_read on public.app_releases
  for select to anon, authenticated using (published);

-- Public storage bucket for the APK files (upload them from Supabase > Storage)
insert into storage.buckets (id, name, public)
values ('app-releases', 'app-releases', true)
on conflict (id) do nothing;
