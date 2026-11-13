// Todo lo que necesita el Dashboard en una sola carga.
import { supabase } from "@/api/supabaseClient";
import { fetchLedger } from "@/api/creditApi";
import { isLowStock } from "@/lib/credit";
import { readOrLocal } from "@/offline";

async function fetchDashboardRemote() {
  const [ledger, productsRes] = await Promise.all([
    fetchLedger(), // clientes con saldo, movimientos, nombres y ajustes
    supabase.from("products").select("id, name, stock, min_stock, unit").eq("archived", false),
  ]);
  if (productsRes.error) throw new Error(productsRes.error.message);
  return { ...ledger, lowStock: productsRes.data.filter(isLowStock) };
}

export function fetchDashboard() {
  return readOrLocal(fetchDashboardRemote, async (local) => {
    const lowStock = local.products
      .filter((p) => !p.archived)
      .map((p) => ({ ...p, stock: Number(p.stock), min_stock: Number(p.min_stock) }))
      .filter(isLowStock);
    return { ...(await fetchLedger()), lowStock };
  });
}
