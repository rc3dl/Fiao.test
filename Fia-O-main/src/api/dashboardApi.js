// Todo lo que necesita el Dashboard en una sola carga.
import { supabase } from "@/api/supabaseClient";
import { fetchLedger } from "@/api/creditApi";
import { isLowStock } from "@/lib/credit";

export async function fetchDashboard() {
  const [ledger, productsRes] = await Promise.all([
    fetchLedger(), // clientes con saldo, movimientos, nombres y ajustes
    supabase.from("products").select("id, name, stock, min_stock, unit").eq("archived", false),
  ]);
  if (productsRes.error) throw new Error(productsRes.error.message);
  return { ...ledger, lowStock: productsRes.data.filter(isLowStock) };
}