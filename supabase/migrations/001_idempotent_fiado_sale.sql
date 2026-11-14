-- 001 - Idempotencia de register_fiado_sale + fecha original de la venta
-- NO APLICADA. Revisar y aprobar antes de ejecutar en la base real.
--
-- Qué hace:
--   * Añade p_request_id: se usa como credit_entries.id. Repetir la misma clave devuelve
--     la venta ya guardada SIN volver a descontar stock ni duplicar el fiado.
--   * Añade p_occurred_at: fecha/hora real de la venta (ventas hechas sin conexión).
--   * Calcula el vencimiento por defecto con la fecha de Panamá de esa fecha.
-- Impacto en datos existentes: ninguno (no toca filas). Reemplaza solo la función.
-- La firma antigua (4 args) se elimina para impedir ventas sin clave de idempotencia.
-- Después de esta migración, aplica también 003_sync_and_archive_guards.sql para actualizar
-- apply_sync_op y proteger los archivos de clientes con deuda. No se usa fallback inseguro.

begin;

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

-- Mismos permisos que antes: solo usuarios autenticados.
revoke all on function public.register_fiado_sale(uuid, jsonb, date, text, uuid, timestamptz) from public, anon;
grant execute on function public.register_fiado_sale(uuid, jsonb, date, text, uuid, timestamptz) to authenticated;

commit;
