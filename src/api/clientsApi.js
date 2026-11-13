// Aquí están TODAS las conversaciones con la base de datos sobre clientes.
// Las pantallas no hablan con Supabase directamente: llaman a estas funciones.
import { supabase } from "@/api/supabaseClient";
import { computeClientStats } from "@/lib/credit";
import { mutate, newId, readOrLocal } from "@/offline";

function check(error) {
  if (error) throw new Error(error.message);
}

// Une cada cliente con su saldo, estado y compras (sirve igual para datos del servidor o locales).
function buildClients(clientRows, entryRows) {
  const byClient = new Map();
  for (const e of entryRows) {
    if (!byClient.has(e.client_id)) byClient.set(e.client_id, []);
    byClient.get(e.client_id).push(e);
  }
  return clientRows.map((c) => ({
    ...c,
    ...computeClientStats(byClient.get(c.id) || []),
  }));
}

async function fetchClientsRemote() {
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
  return buildClients(clientsRes.data, entriesRes.data);
}

// Lista de clientes (sin archivados) con su saldo, estado y compras ya calculados.
export function fetchClients() {
  return readOrLocal(fetchClientsRemote, (local) =>
    buildClients(
      local.clients.filter((c) => !c.archived).sort((a, b) => String(a.name).localeCompare(String(b.name))),
      local.entries
    )
  );
}

const cleanLimit = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

export async function addClient({ name, phone, credit_limit }) {
  const values = { name: name.trim(), phone: phone?.trim() || null, credit_limit: cleanLimit(credit_limit) };
  const id = newId();
  return mutate({ type: "client.create", table: "clients", record_id: id, group: `clients:${id}`, payload: values }, async () => {
    const { error } = await supabase.from("clients").insert(values);
    check(error);
  });
}

export async function editClient(id, { name, phone, credit_limit }) {
  const values = { name: name.trim(), phone: phone?.trim() || null, credit_limit: cleanLimit(credit_limit) };
  return mutate({ type: "client.update", table: "clients", record_id: id, group: `clients:${id}`, payload: values }, async () => {
    const { error } = await supabase.from("clients").update(values).eq("id", id);
    check(error);
  });
}

// Un cliente con historial no se borra: se archiva (deja de salir en la lista).
export async function archiveClient(id) {
  return mutate({ type: "client.archive", table: "clients", record_id: id, group: `clients:${id}`, payload: {} }, async () => {
    const { error } = await supabase.from("clients").update({ archived: true }).eq("id", id);
    check(error);
  });
}

// Anota que se mandó un recordatorio (para no repetirlo seguido).
export async function logReminder({ client_id, message }) {
  return mutate(
    { type: "reminder.log", table: "reminders", record_id: newId(), group: `clients:${client_id}`, payload: { client_id, message } },
    async () => {
      const { error } = await supabase.from("reminders").insert({ client_id, message, channel: "whatsapp" });
      check(error);
    }
  );
}