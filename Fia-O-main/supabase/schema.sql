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
