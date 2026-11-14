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
-- La nueva definición debe escribirse contra esa salida (no se incluye a ciegas para no alterar columnas que
-- la app o consultas externas ya usen). Pendiente de aprobación.
