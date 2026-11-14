import test from "node:test";
import assert from "node:assert/strict";
import { parseQty, validateProduct, cartLines, cartTotal, checkSale, allowsFraction } from "../src/lib/products.js";

const prod = (over = {}) => ({ id: "p1", name: "Arroz", price: 0.85, stock: 10, unit: "unit", ...over });
const form = (over = {}) => ({ name: "Arroz", price: "0.85", stock: "10", min_stock: "2", unit: "unit", ...over });

test("parseQty acepta coma y rechaza texto/negativos", () => {
  assert.equal(parseQty("2,5"), 2.5);
  assert.equal(parseQty("0"), 0);
  for (const bad of ["", "x", "-1"]) assert.ok(Number.isNaN(parseQty(bad)));
});

test("unidades: solo peso/volumen admiten decimales", () => {
  assert.ok(allowsFraction("lb") && allowsFraction("kg") && allowsFraction("liter"));
  assert.ok(!allowsFraction("unit") && !allowsFraction("box"));
  assert.ok(validateProduct(form({ unit: "unit", stock: "2.5" })).error);
  assert.ok(validateProduct(form({ unit: "box", min_stock: "0.5" })).error);
  assert.equal(validateProduct(form({ unit: "lb", stock: "2.5" })).values.stock, 2.5);
});

test("validateProduct: nombre, precio y enlace de imagen", () => {
  assert.ok(validateProduct(form({ name: "  " })).error);
  assert.ok(validateProduct(form({ price: "abc" })).error);
  assert.ok(validateProduct(form({ price: "1000000000" })).error);
  assert.ok(validateProduct(form({ image_url: "ftp://x" })).error);
  assert.equal(validateProduct(form({ price: "0,85" })).values.price, 0.85);
});

test("cartTotal redondea por línea en centavos", () => {
  const lines = cartLines({ p1: "3", p2: "2.5" }, [prod(), prod({ id: "p2", price: 1.1, unit: "lb" })]);
  assert.equal(cartTotal(lines), 2.55 + 2.75);
  assert.equal(cartLines({ p1: "0", p2: "" }, [prod(), prod({ id: "p2" })]).length, 0);
});

test("checkSale: stock, entero por unidad, límite y cliente", () => {
  const client = { balance: 0 };
  const ok = cartLines({ p1: "2" }, [prod()]);
  assert.equal(checkSale({ lines: ok, client, limit: 100, autoBlock: true }), "");
  assert.match(checkSale({ lines: ok, client: null, limit: 100, autoBlock: true }), /customer/i);
  assert.match(checkSale({ lines: [], client, limit: 100, autoBlock: true }), /at least one/i);
  assert.match(checkSale({ lines: cartLines({ p1: "11" }, [prod()]), client, limit: 100, autoBlock: true }), /Not enough stock/);
  assert.match(checkSale({ lines: cartLines({ p1: "1.5" }, [prod()]), client, limit: 100, autoBlock: true }), /whole/);
  assert.match(checkSale({ lines: cartLines({ p1: "10" }, [prod({ price: 20 })]), client, limit: 100, autoBlock: true }), /Blocked/);
});
