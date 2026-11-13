// Motor de sincronización sin conexión.
// Es "puro": no conoce Supabase, IndexedDB ni el navegador. Todo lo externo se inyecta (storage, remote, uuid...),
// así se puede probar con pruebas automáticas (tests/).
//
// Cada escritura es una OPERACIÓN guardada primero en el dispositivo (cola) y enviada después al servidor.
//   pending  -> espera conexión o turno          syncing -> se está enviando
//   applied  -> el servidor la aplicó            conflict -> otro dispositivo cambió el registro: hay que revisar
//   rejected -> el servidor la rechazó (regla)   discarded -> el usuario la descartó

export class NetworkError extends Error {
  constructor(message = "Network error") {
    super(message);
    this.name = "NetworkError";
  }
}

export class RejectedError extends Error {
  constructor(message) {
    super(message);
    this.name = "RejectedError";
  }
}

const OPEN = ["pending", "syncing", "conflict", "rejected"]; // sin resolver
const DONE = ["applied", "discarded"]; // historial
const bySeq = (a, b) => a.seq - b.seq;

export const backoffMs = (attempts) => Math.min(2 ** attempts * 2000, 300000);

// Almacenamiento en memoria (pruebas y respaldo si IndexedDB no está disponible).
export function createMemoryStorage() {
  const map = new Map();
  const meta = new Map();
  return {
    async list() {
      return [...map.values()].map((o) => structuredClone(o));
    },
    async put(op) {
      map.set(op.id, structuredClone(op));
    },
    async remove(id) {
      map.delete(id);
    },
    async getMeta(key) {
      return meta.get(key) ?? null;
    },
    async setMeta(key, value) {
      meta.set(key, value);
    },
  };
}

export function createEngine({
  storage,
  remote, // { apply(op) -> { status, message?, row? }  (lanza NetworkError si no hay conexión) }
  uuid,
  userId,
  deviceId,
  isOnline = () => true,
  now = () => Date.now(),
  onApplied = async () => {},
  maxHistory = 200,
}) {
  let ops = null;
  let seq = 0;
  let flushing = null;
  let online = isOnline();
  let lastSyncAt = null;
  let snapshot = null;
  const listeners = new Set();

  async function load() {
    if (ops) return;
    ops = (await storage.list()).filter((o) => o.user_id === userId).sort(bySeq);
    seq = ops.reduce((m, o) => Math.max(m, o.seq), 0);
    lastSyncAt = await storage.getMeta("lastSyncAt");
    snapshot = null;
  }

  const unresolved = () => (ops || []).filter((o) => OPEN.includes(o.status));

  function buildSnapshot() {
    const list = ops || [];
    const count = (...s) => list.filter((o) => s.includes(o.status)).length;
    return {
      online,
      flushing: Boolean(flushing),
      pending: count("pending", "syncing"),
      conflicts: count("conflict"),
      rejected: count("rejected"),
      lastSyncAt,
      ops: [...list].sort((a, b) => b.seq - a.seq).map((o) => ({ ...o })),
    };
  }
  function emit() {
    snapshot = buildSnapshot();
    listeners.forEach((fn) => fn());
  }

  async function prune() {
    const done = ops.filter((o) => DONE.includes(o.status)).sort((a, b) => b.seq - a.seq);
    for (const old of done.slice(maxHistory)) {
      ops = ops.filter((o) => o.id !== old.id);
      await storage.remove(old.id);
    }
  }

  // Un paso: intenta enviar las operaciones pendientes en orden.
  // Devuelve { changed, stopped }: stopped = se perdió la conexión, no hay que seguir intentando ahora.
  async function pass({ force, tried }) {
    const blocked = new Set(ops.filter((o) => o.status === "conflict" || o.status === "rejected").map((o) => o.group));
    const applied = [];
    let changed = false;
    let stopped = false;

    for (const op of [...ops].sort(bySeq)) {
      if (op.status !== "pending") continue;
      if (blocked.has(op.group)) continue; // espera a que se resuelva lo anterior de ese registro
      if (!online && !force) break;
      if (!force && op.next_try_at > now()) continue;
      if (tried.has(op.id)) continue; // cada operación se intenta una sola vez por envío
      tried.add(op.id);

      op.status = "syncing";
      emit();
      let res;
      try {
        res = await remote.apply({ ...op, force: op.force });
      } catch (err) {
        op.status = "pending";
        op.attempts += 1;
        op.last_error = err.message;
        op.next_try_at = now() + backoffMs(op.attempts);
        await storage.put(op);
        changed = true;
        if (err instanceof NetworkError || err.name === "NetworkError") {
          online = false;
          stopped = true;
          emit();
          break; // sin conexión: no tiene sentido seguir
        }
        blocked.add(op.group); // fallo inesperado: se conserva el orden de ese registro
        continue;
      }

      changed = true;
      if (res.status === "applied" || res.status === "duplicate") {
        op.status = "applied";
        op.synced_at = new Date(now()).toISOString();
        op.last_error = null;
        op.server = null;
        lastSyncAt = op.synced_at;
        applied.push(op);
      } else if (res.status === "conflict") {
        op.status = "conflict";
        op.server = res.row ?? null;
        op.last_error = res.message || "conflict";
        blocked.add(op.group);
      } else {
        op.status = "rejected";
        op.last_error = res.message || "rejected";
        blocked.add(op.group);
      }
      await storage.put(op);
    }

    if (applied.length) {
      await storage.setMeta("lastSyncAt", lastSyncAt);
      try {
        await onApplied(applied);
      } catch {
        /* refrescar pantallas no debe romper la sincronización */
      }
    }
    return { changed, stopped };
  }

  async function run(opts) {
    await load();
    // Se repite mientras haya progreso (por ejemplo, si entraron operaciones nuevas durante el envío)
    const tried = new Set();
    for (let guard = 0; guard < 20; guard += 1) {
      const { changed, stopped } = await pass({ ...opts, tried });
      if (stopped || !changed) break;
    }
    await prune();
  }

  function flush({ force = false } = {}) {
    if (flushing) return flushing;
    flushing = run({ force }).finally(() => {
      flushing = null;
      emit();
    });
    emit();
    return flushing;
  }

  // Guarda la operación y, si hay conexión, la envía de inmediato.
  // Devuelve { status: "applied" | "queued" | "conflict", op }. Si el servidor la rechaza al momento, lanza RejectedError.
  async function submit(input) {
    await load();
    const op = {
      id: uuid(),
      seq: ++seq,
      user_id: userId,
      device_id: deviceId,
      status: "pending",
      attempts: 0,
      next_try_at: 0,
      last_error: null,
      server: null,
      synced_at: null,
      force: false,
      before: null,
      base_version: null,
      payload: {},
      ...input,
      online_at_submit: online,
      occurred_at: new Date(now()).toISOString(),
    };
    // Con conexión se edita sobre lo que se está viendo (sin comprobar versión); sin conexión se recuerda la versión base.
    if (op.online_at_submit) op.base_version = null;
    ops.push(op);
    await storage.put(op);
    emit();

    if (online) await flush({ force: true });

    const current = ops.find((o) => o.id === op.id) || op;
    if (current.status === "rejected" && op.online_at_submit) {
      ops = ops.filter((o) => o.id !== op.id); // el usuario ya vio el error: no se queda en la cola
      await storage.remove(op.id);
      emit();
      throw new RejectedError(current.last_error);
    }
    if (current.status === "applied") return { status: "applied", op: current };
    if (current.status === "conflict") return { status: "conflict", op: current };
    return { status: "queued", op: current };
  }

  async function mutateOp(id, fn) {
    await load();
    const op = ops.find((o) => o.id === id);
    if (!op) return null;
    const oldId = op.id;
    fn(op);
    if (op.id !== oldId) await storage.remove(oldId); // si cambió de id (nuevo intento), se reemplaza el registro
    await storage.put(op);
    emit();
    return op;
  }

  // Conflicto: "server" conserva lo del servidor (descarta mi cambio); "mine" vuelve a enviar mi cambio sobre lo nuevo.
  async function resolveConflict(id, choice) {
    const op = await mutateOp(id, (o) => {
      if (o.status !== "conflict") return;
      if (choice === "mine") {
        o.id = uuid(); // el servidor recuerda el id anterior como "conflicto": el nuevo intento lleva otro
        o.base_version = o.server?.updated_at ?? null;
        o.force = true;
        o.status = "pending";
        o.attempts = 0;
        o.next_try_at = 0;
        o.server = null;
        o.last_error = null;
      } else {
        o.status = "discarded";
      }
    });
    if (op && op.status === "pending" && online) await flush({ force: true });
  }

  async function retry(id) {
    const op = await mutateOp(id, (o) => {
      if (o.status !== "rejected") return;
      o.id = uuid();
      o.status = "pending";
      o.attempts = 0;
      o.next_try_at = 0;
      o.last_error = null;
    });
    if (op && online) await flush({ force: true });
  }

  const discard = (id) =>
    mutateOp(id, (o) => {
      if (OPEN.includes(o.status)) o.status = "discarded";
    });

  function setOnline(value) {
    if (value === online) return;
    online = value;
    emit();
    if (value) flush({ force: true });
  }

  // Estado de sincronización de un registro: "conflict" | "rejected" | "pending" | "synced"
  function recordStatus(table, recordId) {
    const mine = unresolved().filter((o) => o.table === table && o.record_id === recordId);
    if (mine.some((o) => o.status === "conflict")) return "conflict";
    if (mine.some((o) => o.status === "rejected")) return "rejected";
    if (mine.length) return "pending";
    return "synced";
  }

  return {
    load,
    submit,
    flush,
    resolveConflict,
    retry,
    discard,
    setOnline,
    recordStatus,
    isOnline: () => online,
    // Operaciones que todavía deben verse reflejadas en pantalla (las rechazadas no).
    pendingOps: () => unresolved().filter((o) => o.status !== "rejected").sort(bySeq),
    hasUnsynced: () => unresolved().some((o) => o.status === "pending" || o.status === "syncing"),
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getSnapshot() {
      if (!snapshot) snapshot = buildSnapshot();
      return snapshot;
    },
  };
}
