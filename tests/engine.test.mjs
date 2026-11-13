import test from "node:test";
import assert from "node:assert/strict";
import { createEngine, createMemoryStorage, NetworkError, RejectedError, backoffMs } from "../src/offline/engine.js";

let counter = 0;
const uuid = () => `op-${++counter}`;

function fakeRemote(rules = () => null) {
  const applied = new Map();
  const calls = [];
  const remote = {
    online: true,
    applied,
    calls,
    async apply(op) {
      calls.push(op.id);
      if (!remote.online) throw new NetworkError();
      if (applied.has(op.id)) return { status: "duplicate" };
      const custom = rules(op);
      if (custom) return custom;
      applied.set(op.id, op);
      return { status: "applied" };
    },
  };
  return remote;
}

function setup({ online = true, rules, storage = createMemoryStorage(), clock } = {}) {
  const remote = fakeRemote(rules);
  remote.online = online;
  let t = clock?.t ?? 1_000_000;
  const appliedBatches = [];
  const engine = createEngine({
    storage,
    remote,
    uuid,
    userId: "u1",
    deviceId: "dev1",
    isOnline: () => online,
    now: () => t,
    onApplied: async (ops) => appliedBatches.push(ops.map((o) => o.id)),
  });
  return { engine, remote, storage, appliedBatches, tick: (ms) => (t += ms) };
}

const clientCreate = (id, name = "Ana") => ({ type: "client.create", table: "clients", record_id: id, group: `clients:${id}`, payload: { name } });
const fiado = (clientId, amount = 10) => ({ type: "credit.fiado", table: "credit_entries", record_id: `e-${counter + 1}`, group: `clients:${clientId}`, payload: { client_id: clientId, amount } });

test("con conexión: la operación se aplica al momento", async () => {
  const { engine, remote } = setup();
  const res = await engine.submit(clientCreate("c1"));
  assert.equal(res.status, "applied");
  assert.equal(remote.applied.size, 1);
  assert.equal(engine.getSnapshot().pending, 0);
});

test("sin conexión: se guarda en cola, sobrevive a reiniciar y se envía en orden al volver", async () => {
  const storage = createMemoryStorage();
  const a = setup({ online: false, storage });
  const r1 = await a.engine.submit(clientCreate("c1"));
  const r2 = await a.engine.submit(fiado("c1", 25));
  assert.equal(r1.status, "queued");
  assert.equal(r2.status, "queued");
  assert.equal(a.engine.getSnapshot().pending, 2);

  // "Se cierra la app": otro motor lee lo guardado
  const b = setup({ online: true, storage });
  await b.engine.load();
  assert.equal(b.engine.getSnapshot().pending, 2);
  await b.engine.flush({ force: true });
  assert.deepEqual([...b.remote.applied.values()].map((o) => o.type), ["client.create", "credit.fiado"]);
  assert.equal(b.engine.getSnapshot().pending, 0);
  assert.ok(b.engine.getSnapshot().lastSyncAt);
  assert.equal(b.appliedBatches.length > 0, true);
});

test("sin duplicados: si se pierde la respuesta, el reintento no aplica dos veces", async () => {
  let first = true;
  const { engine, remote } = setup({ online: true });
  const original = remote.apply.bind(remote);
  remote.apply = async (op) => {
    const res = await original(op); // el servidor SÍ aplica...
    if (first) {
      first = false;
      throw new NetworkError("respuesta perdida"); // ...pero la respuesta no llega
    }
    return res;
  };
  const r = await engine.submit(clientCreate("c1"));
  assert.equal(r.status, "queued");
  assert.equal(remote.applied.size, 1);
  await engine.flush({ force: true });
  assert.equal(remote.applied.size, 1, "no se duplicó");
  assert.equal(engine.getSnapshot().pending, 0);
});

test("reintentos con espera creciente; al volver la conexión se envían", async () => {
  const { engine, remote, tick } = setup({ online: true });
  remote.online = false;
  await engine.submit(clientCreate("c1"));
  const snap = engine.getSnapshot();
  assert.equal(snap.online, false);
  assert.equal(snap.ops[0].attempts, 1);
  assert.equal(snap.ops[0].next_try_at - 1_000_000, backoffMs(1));

  remote.online = true;
  engine.setOnline(true); // dispara el envío forzado
  await engine.flush({ force: true });
  assert.equal(remote.applied.size, 1);
  assert.equal(tick(0) > 0, true);
});

test("sin forzar, no reintenta antes de tiempo", async () => {
  const { engine, remote, tick } = setup({ online: true });
  remote.online = false;
  await engine.submit(clientCreate("c1"));
  remote.online = true;
  engine.setOnline(true);
  await engine.flush({ force: true });
  assert.equal(remote.applied.size, 1);

  // nueva operación con fallo y espera
  remote.online = false;
  await engine.submit(clientCreate("c2"));
  remote.online = true;
  await engine.flush(); // online=false en el motor: no envía
  assert.equal(remote.applied.size, 1);
  engine.setOnline(true);
  await engine.flush({ force: true });
  assert.equal(remote.applied.size, 2);
  assert.ok(tick(1) > 0);
});

test("rechazo inmediato (con conexión): lanza el error y no queda en la cola", async () => {
  const { engine } = setup({ rules: (op) => (op.type === "credit.fiado" ? { status: "rejected", message: "Blocked: over the limit" } : null) });
  await assert.rejects(engine.submit(fiado("c1", 999)), (e) => e instanceof RejectedError && /over the limit/.test(e.message));
  assert.equal(engine.getSnapshot().ops.length, 0);
});

test("rechazo al sincronizar más tarde: queda para revisar y bloquea solo ese registro", async () => {
  const { engine, remote } = setup({
    online: false,
    rules: (op) => (op.type === "client.create" && op.record_id === "bad" ? { status: "rejected", message: "nombre inválido" } : null),
  });
  await engine.submit(clientCreate("bad"));
  await engine.submit(fiado("bad", 5)); // depende del cliente rechazado
  await engine.submit(clientCreate("ok"));
  remote.online = true;
  engine.setOnline(true);
  await engine.flush({ force: true });

  const snap = engine.getSnapshot();
  assert.equal(snap.rejected, 1);
  assert.equal(snap.pending, 1, "el fiado del cliente rechazado espera");
  assert.deepEqual([...remote.applied.values()].map((o) => o.record_id), ["ok"], "el otro registro sí se sincronizó");
  assert.equal(engine.recordStatus("clients", "bad"), "rejected");
  assert.equal(engine.recordStatus("clients", "ok"), "synced");
});

test("conflicto: no sobrescribe en silencio; 'servidor' descarta y desbloquea", async () => {
  const { engine, remote } = setup({
    online: false,
    rules: (op) => (op.type === "client.update" && !op.force ? { status: "conflict", row: { id: op.record_id, name: "Otro", updated_at: "2026-11-12T10:00:00Z" }, message: "changed" } : null),
  });
  await engine.submit({ type: "client.update", table: "clients", record_id: "c1", group: "clients:c1", payload: { name: "Mío" }, base_version: "2026-11-01T00:00:00Z" });
  await engine.submit({ ...fiado("c1", 5) });
  remote.online = true;
  engine.setOnline(true);
  await engine.flush({ force: true });

  assert.equal(engine.getSnapshot().conflicts, 1);
  assert.equal(engine.recordStatus("clients", "c1"), "conflict");
  assert.equal(remote.applied.size, 0, "nada se aplicó mientras hay conflicto");

  const conflictOp = engine.getSnapshot().ops.find((o) => o.status === "conflict");
  assert.equal(conflictOp.server.name, "Otro");
  await engine.resolveConflict(conflictOp.id, "server");
  await engine.flush({ force: true });
  assert.equal(engine.getSnapshot().conflicts, 0);
  assert.deepEqual([...remote.applied.values()].map((o) => o.type), ["credit.fiado"], "tras resolver, lo siguiente continúa");
});

test("conflicto: 'mío' reenvía con otro id, sobre la versión nueva", async () => {
  const { engine, remote } = setup({
    online: false,
    rules: (op) => (op.type === "client.update" && !op.force ? { status: "conflict", row: { id: "c1", updated_at: "V2" } } : null),
  });
  await engine.submit({ type: "client.update", table: "clients", record_id: "c1", group: "clients:c1", payload: { name: "Mío" }, base_version: "V1" });
  remote.online = true;
  engine.setOnline(true);
  await engine.flush({ force: true });
  const conflictOp = engine.getSnapshot().ops[0];
  const oldId = conflictOp.id;
  await engine.resolveConflict(oldId, "mine");
  const applied = [...remote.applied.values()];
  assert.equal(applied.length, 1);
  assert.notEqual(applied[0].id, oldId);
  assert.equal(applied[0].base_version, "V2");
  assert.equal(applied[0].force, true);
});

test("reintentar un rechazo usa un id nuevo", async () => {
  let reject = true;
  const { engine, remote } = setup({ online: false, rules: () => (reject ? { status: "rejected", message: "Not enough stock" } : null) });
  await engine.submit({ type: "sale.fiado", table: "credit_entries", record_id: "s1", group: "clients:c1", payload: {} });
  remote.online = true;
  engine.setOnline(true);
  await engine.flush({ force: true });
  const rejected = engine.getSnapshot().ops[0];
  assert.equal(rejected.status, "rejected");
  reject = false;
  await engine.retry(rejected.id);
  assert.equal(remote.applied.size, 1);
  assert.equal(engine.getSnapshot().rejected, 0);
});

test("el historial se limita y lo pendiente nunca se borra", async () => {
  const storage = createMemoryStorage();
  const remote = fakeRemote();
  const engine = createEngine({ storage, remote, uuid, userId: "u1", deviceId: "d", maxHistory: 3 });
  for (let i = 0; i < 6; i += 1) await engine.submit(clientCreate(`h${i}`));
  remote.online = false;
  await engine.submit(clientCreate("pendiente"));
  const snap = engine.getSnapshot();
  assert.equal(snap.pending, 1);
  assert.equal(snap.ops.filter((o) => o.status === "applied").length, 3);
});

test("cada usuario solo ve sus propias operaciones", async () => {
  const storage = createMemoryStorage();
  const a = createEngine({ storage, remote: fakeRemote(), uuid, userId: "A", deviceId: "d", isOnline: () => false });
  await a.submit(clientCreate("x"));
  const b = createEngine({ storage, remote: fakeRemote(), uuid, userId: "B", deviceId: "d", isOnline: () => false });
  await b.load();
  assert.equal(b.getSnapshot().ops.length, 0);
});
