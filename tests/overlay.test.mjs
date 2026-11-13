import test from "node:test";
import assert from "node:assert/strict";
import { applyPending } from "../src/offline/overlay.js";

const base = () => ({
  clients: [{ id: "c1", name: "Ana", phone: "6000", credit_limit: 50, archived: false }],
  products: [{ id: "p1", name: "Arroz", price: 2.5, stock: 10, min_stock: 2, unit: "unit", archived: false }],
  entries: [{ id: "e0", client_id: "c1", kind: "fiado", amount: 5, due_date: "2026-12-01", created_at: "2026-11-01T10:00:00Z" }],
  profile: { default_due_days: 15, auto_block: true },
});
const op = (type, extra) => ({ id: type, type, status: "pending", occurred_at: "2026-11-12T15:00:00.000Z", payload: {}, ...extra });

test("un cliente creado sin conexión aparece marcado como pendiente", () => {
  const out = applyPending(base(), [op("client.create", { record_id: "c2", payload: { name: "Luis", credit_limit: "30" } })]);
  const luis = out.clients.find((c) => c.id === "c2");
  assert.equal(luis.name, "Luis");
  assert.equal(luis.credit_limit, 30);
  assert.equal(luis._sync, "pending");
});

test("editar y archivar se reflejan sin perder el resto", () => {
  const out = applyPending(base(), [
    op("client.update", { record_id: "c1", payload: { name: "Ana M." } }),
    op("product.archive", { record_id: "p1" }),
  ]);
  assert.equal(out.clients[0].name, "Ana M.");
  assert.equal(out.clients[0].phone, "6000");
  assert.equal(out.products[0].archived, true);
});

test("fiado y pago pendientes entran al historial; el fiado calcula su fecha límite", () => {
  const out = applyPending(base(), [
    op("credit.fiado", { record_id: "e1", payload: { client_id: "c1", amount: "10", description: "Pan" } }),
    op("credit.pago", { record_id: "e2", payload: { client_id: "c1", amount: 3 } }),
  ]);
  const fiado = out.entries.find((e) => e.id === "e1");
  assert.equal(fiado.amount, 10);
  assert.equal(fiado.due_date, "2026-11-27"); // 12-nov + 15 días
  assert.equal(out.entries.find((e) => e.id === "e2").due_date, null);
  assert.equal(out.entries[0].id, "e2", "ordenado de lo más nuevo a lo más antiguo");
});

test("una venta fiada pendiente baja el inventario y crea el fiado con el precio local", () => {
  const out = applyPending(base(), [op("sale.fiado", { record_id: "s1", payload: { client_id: "c1", items: [{ product_id: "p1", quantity: 4 }] } })]);
  assert.equal(out.products[0].stock, 6);
  const sale = out.entries.find((e) => e.id === "s1");
  assert.equal(sale.amount, 10);
  assert.match(sale.description, /Arroz x4/);
});

test("no modifica los datos originales", () => {
  const data = base();
  applyPending(data, [op("client.archive", { record_id: "c1" })]);
  assert.equal(data.clients[0].archived, false);
});

test("un cambio en conflicto se marca como conflicto", () => {
  const out = applyPending(base(), [op("client.update", { record_id: "c1", status: "conflict", payload: { name: "X" } })]);
  assert.equal(out.clients[0]._sync, "conflict");
});
