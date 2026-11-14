import test from "node:test";
import assert from "node:assert/strict";
import { buildReport, presetRange, previousRange, percentages, percentChange, allowedClientIds, paginate } from "../src/lib/reports.js";
import { computeClientStats } from "../src/lib/credit.js";

const TODAY = "2026-11-14";
const e = (id, client_id, kind, amount, created_at, due_date = null) => ({ id, client_id, kind, amount, created_at, due_date });
const entries = [
  e("f1", "c1", "fiado", 40, "2026-10-05T15:00:00Z", "2026-10-20"),
  e("p1", "c1", "pago", 10, "2026-10-12T15:00:00Z"),
  e("f2", "c2", "fiado", 25, "2026-11-10T15:00:00Z", "2026-11-25"),
  e("p2", "c1", "pago", 5, "2026-11-12T15:00:00Z"), // posterior al mes pasado
];
const mkClients = () =>
  ["c1", "c2", "c3"].map((id) => ({ id, name: id, created_at: "2026-09-01T00:00:00Z", ...computeClientStats(entries.filter((x) => x.client_id === id), TODAY) }));
const report = (from, to, extra = {}) => buildReport({ clients: mkClients(), entries, from, to, today: TODAY, ...extra });

test("presets y período anterior (mes, mes pasado, 30 días, año)", () => {
  assert.deepEqual(presetRange("month", TODAY), { from: "2026-11-01", to: TODAY });
  assert.deepEqual(presetRange("lastMonth", TODAY), { from: "2026-10-01", to: "2026-10-31" });
  assert.deepEqual(presetRange("last30", TODAY), { from: "2026-10-16", to: TODAY });
  assert.deepEqual(presetRange("year", TODAY), { from: "2026-01-01", to: TODAY });
  assert.deepEqual(presetRange("lastMonth", "2027-01-10"), { from: "2026-12-01", to: "2026-12-31" }, "cambio de año");
  assert.deepEqual(previousRange("2026-11-01", "2026-11-14"), { from: "2026-10-18", to: "2026-10-31" });
});

test("actividad del período: solo cuenta movimientos dentro del rango", () => {
  const r = report("2026-10-01", "2026-10-31");
  assert.equal(r.cards.collected, 10, "el pago de noviembre no entra en octubre");
  assert.equal(r.issued, 40);
  assert.deepEqual(r.rows.map((x) => x.id), ["p1", "f1"]);
});

test("semántica fijada: la cartera (activeCredit) es la ACTUAL aunque el período sea pasado", () => {
  const past = report("2026-10-01", "2026-10-31");
  const now = report("2026-11-01", "2026-11-14");
  assert.equal(past.cards.activeCredit, now.cards.activeCredit);
  assert.equal(past.cards.activeCredit, 50); // 40-15 + 25
  assert.equal(past.asOf, TODAY);
});

test("comparación de la cartera con el inicio del período", () => {
  const r = report("2026-11-01", "2026-11-14");
  // saldo al 31-oct = 40-10 = 30; hoy = 50
  assert.equal(r.cards.activeCreditChange.pct, 67);
});

test("rango de un día, sin actividad y cliente archivado/sin movimientos", () => {
  const one = report("2026-11-10", "2026-11-10");
  assert.equal(one.issued, 25);
  assert.equal(one.cards.collected, 0);
  const empty = report("2026-01-01", "2026-01-31");
  assert.equal(empty.rows.length, 0);
  assert.equal(empty.cards.newCustomers, 0);
  assert.equal(empty.breakdown.reduce((s, b) => s + b.pct, 0), 0);
});

test("filtros por cliente y por estado", () => {
  const clients = mkClients();
  assert.equal(allowedClientIds(clients, "all"), null);
  assert.deepEqual([...allowedClientIds(clients, "client:c2")], ["c2"]);
  const r = report("2026-10-01", "2026-11-14", { filter: "client:c2" });
  assert.equal(r.cards.customers, 1);
  assert.equal(r.cards.activeCredit, 25);
});

test("porcentajes suman 100 y percentChange maneja cero", () => {
  assert.equal(percentages([1, 1, 1]).reduce((a, b) => a + b, 0), 100);
  assert.deepEqual(percentages([0, 0]), [0, 0]);
  assert.equal(percentChange(5, 0).label, "New");
  assert.equal(percentChange(0, 0).label, "No change");
  assert.equal(percentChange(110, 100).label, "+10%");
});

test("paginación", () => {
  const rows = Array.from({ length: 23 }, (_, i) => i);
  assert.equal(paginate(rows, 3).items.length, 3);
  assert.equal(paginate(rows, 99).page, 3);
  assert.equal(paginate([], 1).from, 0);
});
