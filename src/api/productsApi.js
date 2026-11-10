// Conversaciones con la base de datos sobre productos y ventas fiadas.
import { supabase } from "@/api/supabaseClient";

function check(error) {
  if (error) throw new Error(error.message);
}

// Cuando cambia el inventario hay que refrescar estas pantallas.
export const PRODUCT_KEYS = [["products"], ["dashboard"]];

// Productos activos (los archivados no salen).
export async function fetchProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, category, price, stock, unit, min_stock, image_url")
    .eq("archived", false)
    .order("name");
  check(error);
  return data.map((p) => ({
    ...p,
    price: Number(p.price),
    stock: Number(p.stock),
    min_stock: Number(p.min_stock),
  }));
}

export async function addProduct(values) {
  const { error } = await supabase.from("products").insert(values);
  check(error);
}

export async function editProduct(id, values) {
  const { error } = await supabase.from("products").update(values).eq("id", id);
  check(error);
}

// Un producto que ya se vendió no se borra: se archiva (las ventas pasadas conservan su historial).
export async function archiveProduct(id) {
  const { error } = await supabase.from("products").update({ archived: true }).eq("id", id);
  check(error);
}

// Registra una venta fiada completa en un solo paso: el fiado, sus productos y el descuento de stock.
// Si algo falla (poco stock, límite excedido), no se guarda NADA.
// items = [{ product_id, quantity }]
export async function registerFiadoSale({ client_id, items, due_date, note }) {
  const { error } = await supabase.rpc("register_fiado_sale", {
    p_client_id: client_id,
    p_items: items,
    p_due_date: due_date || null,
    p_note: note?.trim() || null,
  });
  check(error);
}