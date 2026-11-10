// Conversaciones con la base de datos para la pantalla Credit (fiados, pagos y ajustes).
import { supabase } from "@/api/supabaseClient";
import { computeClientStats } from "@/lib/credit";

function check(error) {
  if (error) throw new Error(error.message);
}

// Cuando se registra un fiado o un pago hay que refrescar todas estas pantallas.
export const LEDGER_KEYS = [["credit"], ["clients"], ["dashboard"], ["reports"]];

   const DEFAULT_SETTINGS = { default_credit_limit: 100, default_due_days: 15, auto_block: true, notifications_enabled: true };

// Ajustes del negocio (límite por defecto, plazo y bloqueo automático).
export async function fetchSettings() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return DEFAULT_SETTINGS;
  const { data, error } = await supabase
    .from("profiles")
      .select("default_credit_limit, default_due_days, auto_block, notifications_enabled")
    .eq("id", auth.user.id)
    .maybeSingle();
  check(error);
  return {
    default_credit_limit: Number(data?.default_credit_limit ?? DEFAULT_SETTINGS.default_credit_limit),
    default_due_days: Number(data?.default_due_days ?? DEFAULT_SETTINGS.default_due_days),
       auto_block: data?.auto_block ?? DEFAULT_SETTINGS.auto_block,
   notifications_enabled: data?.notifications_enabled ?? DEFAULT_SETTINGS.notifications_enabled,
  };
}

// Todo lo que necesita la pantalla Credit en una sola carga.
export async function fetchLedger() {
  const [clientsRes, entriesRes, settings] = await Promise.all([
   supabase.from("clients").select("id, name, phone, credit_limit, archived, created_at").order("name"),
    supabase
      .from("credit_entries")
      .select("id, client_id, kind, amount, description, due_date, created_at")
      .order("created_at", { ascending: false }),
    fetchSettings(),
  ]);
  check(clientsRes.error);
  check(entriesRes.error);

  const byClient = new Map();
  for (const e of entriesRes.data) {
    if (!byClient.has(e.client_id)) byClient.set(e.client_id, []);
    byClient.get(e.client_id).push(e);
  }
  const names = {};
  const clients = [];
  for (const c of clientsRes.data) {
    names[c.id] = c.name;
    if (!c.archived) clients.push({ ...c, ...computeClientStats(byClient.get(c.id) || []) });
  }
  return { clients, entries: entriesRes.data, names, settings };
}

// Registrar un fiado. La base de datos vuelve a comprobar el límite y pone la fecha límite si falta.
export async function addFiado({ client_id, amount, description, due_date }) {
  const { error } = await supabase.from("credit_entries").insert({
    client_id,
    kind: "fiado",
    amount,
    description: description?.trim() || null,
    due_date: due_date || null,
  });
  check(error);
}

// Registrar un pago. La base de datos comprueba que no sea mayor que la deuda.
export async function addPayment({ client_id, amount, description }) {
  const { error } = await supabase.from("credit_entries").insert({
    client_id,
    kind: "pago",
    amount,
    description: description?.trim() || null,
  });
  check(error);
}

// Guardar el interruptor de "Automatic Blocking" (es un ajuste del negocio).
export async function saveAutoBlock(value) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new Error("Not authenticated");
  const { error } = await supabase.from("profiles").upsert({ id: auth.user.id, auto_block: value });
  check(error);
}

// Guardar las reglas de crédito del negocio (Profile): límite por defecto, días para pagar y bloqueo.
export async function saveSettings(values) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new Error("Not authenticated");
  const { error } = await supabase.from("profiles").upsert({ id: auth.user.id, ...values });
  check(error);
}