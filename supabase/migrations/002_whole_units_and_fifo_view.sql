-- 002 - Protección de unidades enteras sin bloquear la edición de productos heredados.
-- No modifica ni redondea stocks existentes.
--
-- Inspección previa recomendada:
--   select id, name, unit, stock, min_stock from public.products
--    where unit not in ('lb','kg','liter')
--      and (stock <> trunc(stock) or min_stock <> trunc(min_stock));
--
-- La protección valida INSERT y cambios en unit/stock/min_stock. Un producto heredado
-- con decimales todavía puede editarse en otros campos y corregirse por partes.
-- No se cambia la vista client_balances porque su definición actual debe revisarse
-- contra la base real antes de reemplazarla.

begin;

-- El CHECK anterior evaluaba también filas heredadas al actualizar cualquier columna.
-- Se elimina de forma segura si alguien llegó a aplicar una versión previa de esta migración.
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

commit;
