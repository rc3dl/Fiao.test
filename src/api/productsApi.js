// Conversaciones con la base de datos sobre productos y ventas fiadas.
import { supabase } from "@/api/supabaseClient";
import { mutate, newId, readOrLocal } from "@/offline";
import { fetchAllPages } from "@/lib/supabasePagination";

function check(error) {
  if (error) throw new Error(error.message);
}

// Cuando cambia el inventario hay que refrescar estas pantallas.
export const PRODUCT_KEYS = [["products"], ["dashboard"]];

// Productos activos (los archivados no salen).
const withNumbers = (p) => ({ ...p, price: Number(p.price), stock: Number(p.stock), min_stock: Number(p.min_stock) });

async function fetchProductsRemote() {
  const data = await fetchAllPages((from, to) =>
    supabase.from("products").select("id, name, category, price, stock, unit, min_stock, image_url")
      .eq("archived", false).order("name").order("id").range(from, to)
  );
  return data.map(withNumbers);
}

export function fetchProducts() {
  return readOrLocal(fetchProductsRemote, (local) =>
    local.products
      .filter((p) => !p.archived)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
      .map(withNumbers)
  );
}

export async function addProduct(values) {
  const id = newId();
  return mutate({ type: "product.create", table: "products", record_id: id, group: `products:${id}`, payload: values }, async () => {
    const { error } = await supabase.from("products").insert(values);
    check(error);
  });
}

export async function editProduct(id, values) {
  return mutate({ type: "product.update", table: "products", record_id: id, group: `products:${id}`, payload: values }, async () => {
    const { error } = await supabase.from("products").update(values).eq("id", id);
    check(error);
  });
}

// Un producto que ya se vendió no se borra: se archiva (las ventas pasadas conservan su historial).
export async function archiveProduct(id) {
  return mutate({ type: "product.archive", table: "products", record_id: id, group: `products:${id}`, payload: {} }, async () => {
    const { error } = await supabase.from("products").update({ archived: true }).eq("id", id);
    check(error);
  });
}

// Registra una venta fiada completa en un solo paso: el fiado, sus productos y el descuento de stock.
// Si algo falla (poco stock, límite excedido), no se guarda NADA.
// items = [{ product_id, quantity }]
// request_id: clave de idempotencia. El servidor guarda la venta con ese id; repetirla no duplica el fiado ni el descuento de stock.
// La pantalla debe generarla una vez por venta y reutilizarla si el usuario reintenta.
export async function registerFiadoSale({ client_id, items, due_date, note, request_id }) {
  const requestId = request_id || newId();
  return mutate(
    {
      type: "sale.fiado",
      table: "credit_entries",
      record_id: requestId,
      group: `clients:${client_id}`,
      payload: { client_id, items, due_date: due_date || null, note: note?.trim() || null },
    },
    async () => {
      const args = { p_client_id: client_id, p_items: items, p_due_date: due_date || null, p_note: note?.trim() || null };
      const { error } = await supabase.rpc("register_fiado_sale", { ...args, p_request_id: requestId });
      if (error && /could not find the function|pgrst202|42883|schema cache/i.test(`${error.code} ${error.message}`)) {
        throw new Error("La base de datos aún no tiene la versión segura de ventas. Hay que aplicar la migración 001 antes de registrar ventas fiadas.");
      }
      check(error);
    }
  );
}