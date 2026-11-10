// Aquí están TODAS las conversaciones con la base de datos sobre clientes.
// Las pantallas no hablan con Supabase directamente: llaman a estas funciones.
import { supabase } from "@/api/supabaseClient";
import { computeClientStats } from "@/lib/credit";

function check(error) {
  if (error) throw new Error(error.message);
}

// Lista de clientes (sin archivados) con su saldo, estado y compras ya calculados.
export async function fetchClients() {
  const [clientsRes, entriesRes] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, phone, credit_limit, created_at")
      .eq("archived", false)
      .order("name"),
    supabase.from("credit_entries").select("id, client_id, kind, amount, due_date, created_at"),
  ]);
  check(clientsRes.error);
  check(entriesRes.error);

  const byClient = new Map();
  for (const e of entriesRes.data) {
    if (!byClient.has(e.client_id)) byClient.set(e.client_id, []);
    byClient.get(e.client_id).push(e);
  }
  return clientsRes.data.map((c) => ({
    ...c,
    ...computeClientStats(byClient.get(c.id) || []),
  }));
}

const cleanLimit = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

export async function addClient({ name, phone, credit_limit }) {
  const { error } = await supabase.from("clients").insert({
    name: name.trim(),
    phone: phone?.trim() || null,
    credit_limit: cleanLimit(credit_limit),
  });
  check(error);
}

export async function editClient(id, { name, phone, credit_limit }) {
  const { error } = await supabase
    .from("clients")
    .update({
      name: name.trim(),
      phone: phone?.trim() || null,
      credit_limit: cleanLimit(credit_limit),
    })
    .eq("id", id);
  check(error);
}

// Un cliente con historial no se borra: se archiva (deja de salir en la lista).
export async function archiveClient(id) {
  const { error } = await supabase.from("clients").update({ archived: true }).eq("id", id);
  check(error);
}

// Anota que se mandó un recordatorio (para no repetirlo seguido).
export async function logReminder({ client_id, message }) {
  const { error } = await supabase.from("reminders").insert({ client_id, message, channel: "whatsapp" });
  check(error);
}