// Todo lo que necesita el Dashboard en una sola carga.
import { supabase } from "@/api/supabaseClient";
import { fetchLedger } from "@/api/creditApi";
import { isLowStock } from "@/lib/credit";
import { readOrLocal } from "@/offline";
import { fetchAllPages } from "@/lib/supabasePagination";

async function fetchDashboardRemote() {
  const [ledger, productsRes] = await Promise.all([
    fetchLedger(), // clientes con saldo, movimientos, nombres y ajustes
    fetchAllPages((from, to) =>
      supabase.from("products").select("id, name, stock, min_stock, unit")
        .eq("archived", false).order("id").range(from, to)
    ),
  ]);
  return { ...ledger, lowStock: productsRes.filter(isLowStock) };
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
