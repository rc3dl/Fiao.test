import test from "node:test";
import assert from "node:assert/strict";
import { computeClientStats, annotateEntries, summarize, parseAmount, parseLimit, checkFiado, checkPayment, addDays, effectiveLimit } from "../src/lib/credit.js";

const f = (id, amount, created_at, due_date) => ({ id, kind: "fiado", amount, created_at, due_date });
const p = (id, amount, created_at) => ({ id, kind: "pago", amount, created_at, due_date: null });
const TODAY = "2026-11-14";

test("FIFO: pago parcial cubre el fiado más viejo y parte del siguiente", () => {
  const entries = [f("a", 10, "2026-10-01T15:00:00Z", "2026-10-16"), f("b", 20, "2026-10-05T15:00:00Z", "2026-11-20"), p("p1", 15, "2026-10-10T15:00:00Z")];
  const s = computeClientStats(entries, TODAY);
  assert.equal(s.balance, 15);
  assert.equal(s.overdue, 0, "el fiado vencido (a) quedó cubierto; b aún no vence");
  assert.equal(s.status, "Pending");
  const rows = annotateEntries(entries, TODAY);
  assert.equal(rows.find((r) => r.id === "a").status, "Paid");
  assert.equal(rows.find((r) => r.id === "b").status, "Pending");
});

test("pago que cubre exactamente un fiado; vencido solo lo que queda sin pagar", () => {
  const entries = [f("a", 10, "2026-10-01T15:00:00Z", "2026-10-16"), f("b", 5, "2026-10-02T15:00:00Z", "2026-10-17"), p("p", 10, "2026-10-03T15:00:00Z")];
  const s = computeClientStats(entries, TODAY);
  assert.equal(s.balance, 5);
  assert.equal(s.overdue, 5);
  assert.equal(s.status, "Overdue");
});

test("cliente sin movimientos y saldo en cero", () => {
  assert.deepEqual(computeClientStats([], TODAY), { balance: 0, overdue: 0, purchases: 0, status: "On Time", oldestPendingDate: null, daysPending: 0 });
  assert.equal(computeClientStats([f("a", 5, "2026-11-01T15:00:00Z", "2026-11-20"), p("p", 5, "2026-11-02T15:00:00Z")], TODAY).status, "On Time");
});

test("centavos sin errores de coma flotante", () => {
  const s = computeClientStats([f("a", 0.1, "2026-11-01T15:00:00Z", "2026-12-01"), f("b", 0.2, "2026-11-02T15:00:00Z", "2026-12-01"), p("p", 0.1, "2026-11-03T15:00:00Z")], TODAY);
  assert.equal(s.balance, 0.2);
  assert.equal(computeClientStats([f("a", 0.01, "2026-11-01T15:00:00Z", "2026-12-01")], TODAY).balance, 0.01);
});

test("fiado vencido exactamente hoy no cuenta como vencido (vence mañana)", () => {
  assert.equal(computeClientStats([f("a", 5, "2026-11-01T15:00:00Z", TODAY)], TODAY).overdue, 0);
  assert.equal(computeClientStats([f("a", 5, "2026-11-01T15:00:00Z", "2026-11-13")], TODAY).overdue, 5);
});

test("pagos del día usan la fecha de Panamá, no la de UTC", () => {
  const clients = [{ balance: 0, status: "On Time" }];
  const entries = [p("p1", 7, "2026-11-15T03:30:00Z"), p("p2", 3, "2026-11-15T05:00:00Z")]; // 22:30 del 14 (Panamá) y 00:00 del 15
  assert.equal(summarize(clients, entries, "2026-11-14").paymentsToday, 7);
  assert.equal(summarize(clients, entries, "2026-11-15").paymentsToday, 3);
});

test("parseAmount: formatos de Panamá y entradas inválidas", () => {
  assert.equal(parseAmount("12,50"), 12.5);
  assert.equal(parseAmount("B/. 12.5"), 12.5);
  assert.equal(parseAmount("0.01"), 0.01);
  for (const bad of ["", "abc", "-1", "1.2.3", "1e3", null]) assert.ok(Number.isNaN(parseAmount(bad)), String(bad));
});

test("parseLimit: vacío = null, acepta coma, rechaza negativos, texto y excesos", () => {
  assert.equal(parseLimit(""), null);
  assert.equal(parseLimit("  "), null);
  assert.equal(parseLimit("50,5"), 50.5);
  assert.equal(parseLimit("0"), 0);
  for (const bad of ["-5", "abc", "1e9", "100000000"]) assert.ok(Number.isNaN(parseLimit(bad)), bad);
});

test("límites y pagos: bloqueo exacto en el límite y pago mayor a la deuda", () => {
  assert.equal(checkFiado({ amount: 10, balance: 90, limit: 100, autoBlock: true }), "");
  assert.match(checkFiado({ amount: 10.01, balance: 90, limit: 100, autoBlock: true }), /Blocked/);
  assert.equal(checkFiado({ amount: 500, balance: 90, limit: 100, autoBlock: false }), "");
  assert.match(checkFiado({ amount: 0, balance: 0, limit: 100, autoBlock: true }), /greater than 0/);
  assert.equal(checkPayment({ amount: 5, balance: 5 }), "");
  assert.match(checkPayment({ amount: 5.01, balance: 5 }), /higher than the debt/);
  assert.match(checkPayment({ amount: 1, balance: 0 }), /no debt/);
  assert.equal(effectiveLimit({ credit_limit: 0 }, { default_credit_limit: 100 }), 0, "límite 0 es válido y no cae al del negocio");
  assert.equal(effectiveLimit({ credit_limit: null }, { default_credit_limit: 100 }), 100);
});

test("addDays: cambio de mes, año y bisiesto", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});
