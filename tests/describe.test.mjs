import test from "node:test";
import assert from "node:assert/strict";
import { describeOp, conflictLines, timeAgo } from "../src/native/describeOp.js";

const money = (v) => `B/. ${v.toFixed(2)}`;

test("describe las operaciones en español e inglés", () => {
  assert.equal(describeOp({ type: "credit.fiado", payload: { amount: 12.5 } }, "es", money), "Fiado de B/. 12.50");
  assert.equal(describeOp({ type: "credit.pago", payload: { amount: 3 } }, "en", money), "Payment of B/. 3.00");
  assert.equal(describeOp({ type: "client.create", payload: { name: "Ana" } }, "es", money), "Nuevo cliente: Ana");
  assert.equal(describeOp({ type: "client.archive", payload: {}, before: { name: "Luis" } }, "es", money), "Cliente archivado: Luis");
  assert.equal(describeOp({ type: "algo.raro" }, "es", money), "algo.raro");
});

test("muestra solo los campos que cambian en un conflicto", () => {
  const lines = conflictLines({ payload: { name: "Mío", phone: "6000" }, server: { name: "Otro", phone: "6000" } });
  assert.deepEqual(lines, [{ field: "name", mine: "Mío", server: "Otro" }]);
});

test("tiempo relativo legible", () => {
  const now = Date.parse("2026-11-12T12:00:00Z");
  assert.equal(timeAgo(null, "es", now), null);
  assert.match(timeAgo("2026-11-12T11:55:00Z", "es", now), /5 minutos/);
  assert.match(timeAgo("2026-11-11T12:00:00Z", "en", now), /yesterday|1 day ago/);
});
