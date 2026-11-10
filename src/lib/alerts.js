// Avisos de la campana: qué cuentas están vencidas y qué productos se están acabando.
import { money } from "@/lib/credit";
import { stockLabel, formatQty } from "@/lib/products";

// clients = clientes con sus saldos ya calculados | lowStock = productos con poco stock
export function buildAlerts({ clients = [], lowStock = [] }, language = "en") {
  const overdue = clients
    .filter((c) => c.overdue > 0)
    .sort((a, b) => b.overdue - a.overdue)
    .map((c) => ({
      id: `overdue-${c.id}`,
      type: "overdue",
      title: language === "es" ? `${c.name} tiene un pago vencido` : `${c.name} is overdue`,
      detail: language === "es" ? `${money(c.overdue)} vencido desde la fecha de pago` : `${money(c.overdue)} past the due date`,
      to: "/clients",
    }));

  const stock = [...lowStock]
    .sort((a, b) => Number(a.stock) - Number(b.stock))
    .map((p) => {
      const out = Number(p.stock) <= 0;
      const quantity = Number(p.stock);
      const spanishUnit = {
        unit: quantity === 1 ? "unidad" : "unidades",
        lb: "lb",
        kg: "kg",
        bottle: quantity === 1 ? "botella" : "botellas",
        pack: quantity === 1 ? "paquete" : "paquetes",
        box: quantity === 1 ? "caja" : "cajas",
        bag: quantity === 1 ? "bolsa" : "bolsas",
        liter: quantity === 1 ? "litro" : "litros",
      }[p.unit] || p.unit;
      return {
        id: `stock-${p.id}`,
        type: "stock",
        title: language === "es"
          ? (out ? `${p.name} está agotado` : `${p.name} tiene pocas existencias`)
          : (out ? `${p.name} is out of stock` : `${p.name} is running low`),
        detail: language === "es"
          ? (out ? "Repón existencias para seguir vendiendo." : `${formatQty(p.stock)} ${spanishUnit} disponibles (alerta en ${formatQty(p.min_stock)})`)
          : (out ? "Restock it to keep selling." : `${stockLabel(p)} left (alert at ${formatQty(p.min_stock)})`),
        to: "/products",
      };
    });

  return [...overdue, ...stock];
}

// Lo que se escribe en el círculo: 3, 9+ ...
export function badgeText(count) {
  return count > 9 ? "9+" : String(count);
}