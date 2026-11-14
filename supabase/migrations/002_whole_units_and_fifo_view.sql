-- 002 - NO APLICADA. Revisar antes de ejecutar.
-- (a) Unidades no fraccionables: la regla ya se valida en la app (src/lib/products.js); aquí se refuerza en la base.
--     La restricción se crea NOT VALID: no revisa filas existentes ni las bloquea, pero sí valida inserciones y
--     actualizaciones nuevas. Antes de VALIDATE, consultar si hay productos que la incumplen:
--       select id, name, unit, stock, min_stock from public.products
--        where unit not in ('lb','kg','liter') and (stock <> trunc(stock) or min_stock <> trunc(min_stock));
-- Impacto: un UPDATE a un producto existente que siga incumpliendo (p. ej. editar su nombre con stock 2.5 'unit')
--          será rechazado hasta corregir el stock.
alter table public.products
  add constraint products_whole_units_chk
  check (unit in ('lb','kg','liter') or (stock = trunc(stock) and min_stock = trunc(min_stock)))
  not valid;

-- (b) Vista client_balances con asignación FIFO real (igual que src/lib/credit.js):
--     los pagos cubren primero los fiados más antiguos; el vencido es lo que queda sin pagar de los fiados vencidos.
--     Se mantienen las columnas existentes; revisar `select * from public.client_balances` antes y después.
-- Ver la definición actual con:  select pg_get_viewdef('public.client_balances'::regclass, true);
-- La migración de abajo conserva la forma canónica de seis columnas definida en schema.sql.
-- Solo aplicar después de comparar la definición REAL de producción con pg_get_viewdef y verificar dependencias.

create or replace view public.client_balances with (security_invoker = true) as
with payments as (
  select e.client_id, e.owner_id, sum(e.amount) as total_pagado
  from public.credit_entries e
  where e.kind = 'pago'
  group by e.client_id, e.owner_id
),
fiados_ordered as (
  select
    e.client_id,
    e.owner_id,
    e.amount,
    e.due_date,
    coalesce(
      sum(e.amount) over (
        partition by e.client_id, e.owner_id
        order by e.created_at, e.id
        rows between unbounded preceding and 1 preceding
      ),
      0
    ) as previous_fiados,
    coalesce(p.total_pagado, 0) as total_pagado
  from public.credit_entries e
  left join payments p
    on p.client_id = e.client_id and p.owner_id = e.owner_id
  where e.kind = 'fiado'
),
allocated as (
  select
    client_id,
    owner_id,
    amount,
    due_date,
    greatest(
      0,
      amount - greatest(0, least(amount, total_pagado - previous_fiados))
    ) as remaining
  from fiados_ordered
),
client_totals as (
  select
    f.client_id,
    f.owner_id,
    sum(f.amount) as total_fiado,
    sum(f.remaining) as balance,
    sum(
      case
        when f.due_date < (now() at time zone 'America/Panama')::date then f.remaining
        else 0
      end
    ) as overdue_balance
  from allocated f
  group by f.client_id, f.owner_id
)
select
  c.id as client_id,
  c.owner_id,
  coalesce(t.total_fiado, 0) as total_fiado,
  coalesce(p.total_pagado, 0) as total_pagado,
  coalesce(t.balance, 0) as balance,
  coalesce(t.overdue_balance, 0) as overdue_balance
from public.clients c
left join client_totals t
  on t.client_id = c.id and t.owner_id = c.owner_id
left join payments p
  on p.client_id = c.id and p.owner_id = c.owner_id;
