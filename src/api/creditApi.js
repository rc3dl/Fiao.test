// Conversaciones con la base de datos para la pantalla Credit (fiados, pagos y ajustes).
import { supabase } from "@/api/supabaseClient";
import { computeClientStats } from "@/lib/credit";
import { mutate, newId, readOrLocal } from "@/offline";

function check(error) {
  if (error) throw new Error(error.message);
}

// Cuando se registra un fiado o un pago hay que refrescar todas estas pantallas.
export const LEDGER_KEYS = [["credit"], ["clients"], ["dashboard"], ["reports"]];

   const DEFAULT_SETTINGS = { default_credit_limit: 100, default_due_days: 15, auto_block: true, notifications_enabled: true };

// Convierte la fila del perfil en los ajustes del negocio (con valores por defecto).
function settingsFromProfile(data) {
  return {
    default_credit_limit: Number(data?.default_credit_limit ?? DEFAULT_SETTINGS.default_credit_limit),
    default_due_days: Number(data?.default_due_days ?? DEFAULT_SETTINGS.default_due_days),
    auto_block: data?.auto_block ?? DEFAULT_SETTINGS.auto_block,
    notifications_enabled: data?.notifications_enabled ?? DEFAULT_SETTINGS.notifications_enabled,
  };
}

async function fetchSettingsRemote() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return DEFAULT_SETTINGS;
  const { data, error } = await supabase
    .from("profiles")
    .select("default_credit_limit, default_due_days, auto_block, notifications_enabled")
    .eq("id", auth.user.id)
    .maybeSingle();
  check(error);
  return settingsFromProfile(data);
}

// Ajustes del negocio (límite por defecto, plazo y bloqueo automático).
export function fetchSettings() {
  return readOrLocal(fetchSettingsRemote, (local) => settingsFromProfile(local.profile));
}

// Arma lo que muestra la pantalla Credit a partir de las filas (sirve igual para datos del servidor o locales).
function buildLedger(clientRows, entryRows, settings) {
  const byClient = new Map();
  for (const e of entryRows) {
    if (!byClient.has(e.client_id)) byClient.set(e.client_id, []);
    byClient.get(e.client_id).push(e);
  }
  const names = {};
  const clients = [];
  for (const c of clientRows) {
    names[c.id] = c.name;
    if (!c.archived) clients.push({ ...c, ...computeClientStats(byClient.get(c.id) || []) });
  }
  return { clients, entries: entryRows, names, settings };
}

async function fetchLedgerRemote() {
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
  return buildLedger(clientsRes.data, entriesRes.data, settings);
}

// Todo lo que necesita la pantalla Credit en una sola carga.
export function fetchLedger() {
  return readOrLocal(fetchLedgerRemote, (local) =>
    buildLedger(
      [...local.clients].sort((a, b) => String(a.name).localeCompare(String(b.name))),
      local.entries,
      settingsFromProfile(local.profile)
    )
  );
}

// Registrar un fiado. La base de datos vuelve a comprobar el límite y pone la fecha límite si falta.
export async function addFiado({ client_id, amount, description, due_date }) {
  const values = { client_id, amount, description: description?.trim() || null, due_date: due_date || null };
  return mutate(
    { type: "credit.fiado", table: "credit_entries", record_id: newId(), group: `clients:${client_id}`, payload: values },
    async () => {
      const { error } = await supabase.from("credit_entries").insert({ client_id, kind: "fiado", ...values });
      check(error);
    }
  );
}

// Registrar un pago. La base de datos comprueba que no sea mayor que la deuda.
export async function addPayment({ client_id, amount, description }) {
  const values = { client_id, amount, description: description?.trim() || null };
  return mutate(
    { type: "credit.pago", table: "credit_entries", record_id: newId(), group: `clients:${client_id}`, payload: values },
    async () => {
      const { error } = await supabase.from("credit_entries").insert({ client_id, kind: "pago", ...values });
      check(error);
    }
  );
}

// Guardar un ajuste del negocio en el perfil (en Android entra por la cola, como todo lo demás).
function saveProfile(values) {
  return mutate({ type: "profile.update", table: "profiles", record_id: null, group: "profile", payload: values }, async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) throw new Error("Not authenticated");
    const { error } = await supabase.from("profiles").upsert({ id: auth.user.id, ...values });
    check(error);
  });
}

// Guardar el interruptor de "Automatic Blocking" (es un ajuste del negocio).
export const saveAutoBlock = (value) => saveProfile({ auto_block: value });

// Guardar las reglas de crédito del negocio (Profile): límite por defecto, días para pagar y bloqueo.
export const saveSettings = (values) => saveProfile(values);
