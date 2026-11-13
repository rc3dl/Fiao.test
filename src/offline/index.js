// Funcionamiento sin conexión de la app Android: copia local de los datos, cola de cambios y sincronización.
// En la web (IS_NATIVE = false) nada de esto actúa: las funciones llaman directo a Supabase como siempre.
import { supabase } from "@/api/supabaseClient";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/env";
import { IS_NATIVE } from "@/native/useIsNative";
import { queryClientInstance } from "@/lib/query-client";
import { isNetworkError } from "@/lib/network";
import { createEngine, createMemoryStorage, NetworkError } from "@/offline/engine";
import { applyPending } from "@/offline/overlay";
import { createIdbStorage, getMirror, putMirror, wipeMirror } from "@/offline/idb";

const TABLES = ["clients", "products", "credit_entries", "profiles"];
const PULL_EVERY_MS = 5 * 60 * 1000;
const TICK_MS = 20 * 1000;

export const newId = () => crypto.randomUUID();

// ---------- estado visible para la interfaz ----------
const EMPTY = { ready: false, online: true, flushing: false, pending: 0, conflicts: 0, rejected: 0, lastSyncAt: null, pulledAt: null, ops: [] };
let published = EMPTY;
const listeners = new Set();
const publish = (patch) => {
  published = { ...published, ...patch };
  listeners.forEach((fn) => fn());
};
export const subscribeSync = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const getSyncSnapshot = () => published;

let current = null; // { userId, engine, storage, mirrorAt, pulling, timer, cleanup }

export const getEngine = () => current?.engine ?? null;
export const hasUnsynced = () => Boolean(current?.engine.hasUnsynced());

function deviceId() {
  let id = localStorage.getItem("fiao:device");
  if (!id) {
    id = `android-${newId().slice(0, 8)}`;
    localStorage.setItem("fiao:device", id);
  }
  return id;
}

// ---------- servidor: apply_sync_op (o modo de compatibilidad si todavía no existe) ----------
let rpcMode = "unknown"; // "rpc" | "legacy"
const MISSING_FUNCTION = /could not find the function|pgrst202|42883|schema cache/i;
const SESSION_PROBLEM = /jwt|token|not authenticated|pgrst301/i;

const wire = (op) => ({
  id: op.id,
  type: op.type,
  record_id: op.record_id,
  base_version: op.base_version,
  payload: op.payload,
  device_id: op.device_id,
  occurred_at: op.occurred_at,
  force: op.force,
});

async function applyRemote(op) {
  if (rpcMode !== "legacy") {
    const { data, error } = await supabase.rpc("apply_sync_op", { p_op: wire(op) });
    if (!error) {
      rpcMode = "rpc";
      return data;
    }
    if (isNetworkError(error)) throw new NetworkError(error.message);
    if (MISSING_FUNCTION.test(`${error.code} ${error.message}`)) rpcMode = "legacy";
    else if (SESSION_PROBLEM.test(`${error.code} ${error.message}`)) throw new NetworkError("session"); // se reintenta luego
    else return { status: "rejected", message: error.message };
  }
  return applyLegacy(op);
}

// Modo de compatibilidad: sin la función nueva en Supabase. Funciona, pero sin historial central ni conflictos.
async function applyLegacy(op) {
  const p = op.payload || {};
  const done = async (query) => {
    const { error } = await query;
    if (!error) return { status: "applied" };
    if (isNetworkError(error)) throw new NetworkError(error.message);
    if (error.code === "23505") return { status: "duplicate" }; // ya existía (mismo id)
    return { status: "rejected", message: error.message };
  };
  const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));
  switch (op.type) {
    case "client.create":
      return done(supabase.from("clients").insert({ id: op.record_id, name: p.name, phone: p.phone ?? null, credit_limit: p.credit_limit ?? null }));
    case "client.update":
      return done(supabase.from("clients").update(pick(p, ["name", "phone", "credit_limit"])).eq("id", op.record_id));
    case "client.archive":
      return done(supabase.from("clients").update({ archived: true }).eq("id", op.record_id));
    case "product.create":
      return done(supabase.from("products").insert({ id: op.record_id, ...p }));
    case "product.update":
      return done(supabase.from("products").update(p).eq("id", op.record_id));
    case "product.archive":
      return done(supabase.from("products").update({ archived: true }).eq("id", op.record_id));
    case "credit.fiado":
    case "credit.pago":
      return done(
        supabase.from("credit_entries").insert({
          id: op.record_id,
          client_id: p.client_id,
          kind: op.type === "credit.fiado" ? "fiado" : "pago",
          amount: p.amount,
          description: p.description ?? null,
          due_date: p.due_date ?? null,
        })
      );
    case "sale.fiado":
      return done(supabase.rpc("register_fiado_sale", { p_client_id: p.client_id, p_items: p.items, p_due_date: p.due_date || null, p_note: p.note || null }));
    case "reminder.log":
      return done(supabase.from("reminders").insert({ id: op.record_id, client_id: p.client_id, message: p.message, channel: "whatsapp" }));
    case "profile.update":
      return done(supabase.from("profiles").upsert({ id: op.user_id, ...p }));
    default:
      return { status: "rejected", message: `Unknown operation: ${op.type}` };
  }
}

// ---------- copia local de los datos ----------
export async function pullAll() {
  const c = current;
  if (!c || !c.engine.isOnline()) return false;
  if (c.pulling) return c.pulling;
  c.pulling = (async () => {
    try {
      const results = await Promise.all([
        supabase.from("clients").select("*"),
        supabase.from("products").select("*"),
        supabase.from("credit_entries").select("*"),
        supabase.from("profiles").select("*").eq("id", c.userId).maybeSingle(),
      ]);
      const failed = results.find((r) => r.error);
      if (failed) {
        if (isNetworkError(failed.error)) c.engine.setOnline(false);
        return false;
      }
      const [clients, products, entries, profile] = results.map((r) => r.data);
      await Promise.all([
        putMirror(c.userId, "clients", clients),
        putMirror(c.userId, "products", products),
        putMirror(c.userId, "credit_entries", entries),
        putMirror(c.userId, "profiles", profile ? [profile] : []),
      ]);
      c.mirrorAt = new Date().toISOString();
      await c.storage.setMeta("mirrorAt", c.mirrorAt);
      publish({ pulledAt: c.mirrorAt, ready: true });
      return true;
    } catch (error) {
      if (isNetworkError(error)) c.engine.setOnline(false);
      return false;
    } finally {
      c.pulling = null;
    }
  })();
  return c.pulling;
}

// Cambios que deben verse encima de la copia local: los pendientes y los que se enviaron después de la última copia.
function overlayOps(c) {
  return c.engine
    .getSnapshot()
    .ops.filter((o) => (["pending", "syncing", "conflict"].includes(o.status)) || (o.status === "applied" && c.mirrorAt && o.synced_at > c.mirrorAt))
    .sort((a, b) => a.seq - b.seq);
}

// Datos tal como se verían con todos los cambios pendientes aplicados. null si todavía no hay copia local.
export async function localData() {
  const c = current;
  if (!c) return null;
  const [clients, products, entries, profiles] = await Promise.all(TABLES.map((t) => getMirror(c.userId, t)));
  if (!clients) return null;
  return applyPending({ clients, products: products || [], entries: entries || [], profile: profiles?.[0] ?? null }, overlayOps(c));
}

async function getRow(table, id) {
  const data = await localData();
  if (!data) return null;
  const list = table === "clients" ? data.clients : table === "products" ? data.products : table === "profiles" ? [data.profile] : [];
  return list.find((r) => r && (table === "profiles" || r.id === id)) ?? null;
}

// ---------- lecturas: servidor si hay conexión; copia local si no ----------
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function readOrLocal(remote, local) {
  const c = current;
  if (!IS_NATIVE || !c) return remote();
  const { engine } = c;

  // Primero se envía lo pendiente para no mostrar datos viejos
  if (engine.isOnline() && engine.hasUnsynced()) await Promise.race([engine.flush({ force: true }), sleep(3000)]);

  if (!engine.isOnline()) {
    const data = await localData();
    if (data) return local(data);
  }
  try {
    const result = await remote();
    if (Date.now() - Date.parse(c.mirrorAt || 0) > 60_000) pullAll();
    return result;
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    engine.setOnline(false);
    const data = await localData();
    if (!data) throw error;
    return local(data);
  }
}

// ---------- escrituras: siempre pasan por la cola ----------
export async function mutate(spec, legacy) {
  const c = current;
  if (!IS_NATIVE || !c) return legacy();
  const needsBefore = spec.type.endsWith(".update") || spec.type.endsWith(".archive");
  const before = needsBefore ? await getRow(spec.table, spec.record_id) : null;
  const result = await c.engine.submit({
    ...spec,
    before,
    base_version: before?.updated_at ?? null, // el motor lo ignora si hay conexión al guardar
  });
  if (result.status === "conflict") {
    throw new Error("This record was changed on another device. Review it in Sync.");
  }
  return result;
}

// ---------- ciclo de vida ----------
async function probe() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    await fetch(`${SUPABASE_URL}/auth/v1/health`, { headers: { apikey: SUPABASE_ANON_KEY }, signal: controller.signal });
    clearTimeout(timer);
    return true; // cualquier respuesta significa que hay conexión
  } catch {
    return false;
  }
}

async function tick() {
  const c = current;
  if (!c) return;
  if (!c.engine.isOnline()) {
    if (await probe()) c.engine.setOnline(true);
    return;
  }
  if (c.engine.hasUnsynced()) await c.engine.flush();
  else if (Date.now() - Date.parse(c.mirrorAt || 0) > PULL_EVERY_MS) pullAll();
}

// Sincronizar ahora (botón del panel de sincronización)
export async function syncNow() {
  const c = current;
  if (!c) return;
  if (await probe()) {
    c.engine.setOnline(true);
    await c.engine.flush({ force: true });
    await pullAll();
    queryClientInstance.invalidateQueries();
  } else {
    c.engine.setOnline(false);
  }
}

let starting = null; // { userId, promise }

// Arranca la copia local y la sincronización del usuario. Si ya está en marcha (o arrancando), no hace nada.
export function startOffline(userId) {
  if (!IS_NATIVE || !userId || current?.userId === userId) return Promise.resolve();
  if (starting?.userId === userId) return starting.promise;
  const promise = doStart(userId).finally(() => {
    if (starting?.promise === promise) starting = null;
  });
  starting = { userId, promise };
  return promise;
}

async function doStart(userId) {
  stopOffline();

  let storage;
  try {
    storage = createIdbStorage(userId);
    await storage.list();
  } catch {
    storage = createMemoryStorage(); // si IndexedDB no está disponible, la app sigue funcionando (sin guardar al cerrar)
  }

  const engine = createEngine({
    storage,
    remote: { apply: applyRemote },
    uuid: newId,
    userId,
    deviceId: deviceId(),
    isOnline: () => navigator.onLine !== false,
    onApplied: async () => {
      await pullAll();
      queryClientInstance.invalidateQueries();
    },
  });
  const mirrorAt = await storage.getMeta("mirrorAt");
  const onOnline = () => probe().then((ok) => ok && engine.setOnline(true));
  const onOffline = () => engine.setOnline(false);
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  const unsubscribe = engine.subscribe(() => publish({ ...engine.getSnapshot(), ready: true, pulledAt: current?.mirrorAt ?? mirrorAt }));
  current = {
    userId,
    engine,
    storage,
    mirrorAt,
    pulling: null,
    timer: setInterval(tick, TICK_MS),
    cleanup: () => {
      unsubscribe();
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    },
  };

  await engine.load();
  publish({ ...engine.getSnapshot(), ready: Boolean(mirrorAt), pulledAt: mirrorAt });
  queryClientInstance.invalidateQueries(); // las pantallas que cargaron antes ahora pueden usar la copia local
  if (engine.isOnline()) {
    await engine.flush({ force: true });
    pullAll();
  }
}

export function stopOffline() {
  if (!current) return;
  clearInterval(current.timer);
  current.cleanup();
  current = null;
  publish(EMPTY);
}

// Al cerrar sesión: se borra la copia de datos del dispositivo. Los cambios sin enviar se conservan
// para ese mismo usuario (se enviarán la próxima vez que entre).
export async function wipeOnLogout() {
  const c = current;
  if (!c) return;
  const unsynced = c.engine.hasUnsynced();
  stopOffline();
  try {
    await wipeMirror(c.userId, { keepOps: unsynced });
  } catch {
    /* se ignora */
  }
  localStorage.removeItem(`fiao:me:${c.userId}`);
}
