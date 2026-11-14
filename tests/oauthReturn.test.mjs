import test from "node:test";
import assert from "node:assert/strict";
import { parseNativeAuthReturn } from "../src/lib/oauthReturn.js";

const R = "com.fiao.panama://auth";
const ok = `${R}#access_token=AAA&refresh_token=BBB&token_type=bearer`;

test("enlace correcto devuelve los tokens (fragmento o query)", () => {
  assert.deepEqual(parseNativeAuthReturn(ok, R), { kind: "session", access_token: "AAA", refresh_token: "BBB" });
  assert.equal(parseNativeAuthReturn(`${R}/#access_token=A&refresh_token=B`, R).kind, "session");
  assert.equal(parseNativeAuthReturn(`${R}?access_token=A&refresh_token=B`, R).kind, "session");
});

test("enlaces con otro host, ruta, esquema o credenciales se ignoran", () => {
  for (const bad of [
    "com.fiao.panama://authx#access_token=A&refresh_token=B",
    "com.fiao.panama://auth.evil.com#access_token=A&refresh_token=B",
    "com.fiao.panama://auth/extra#access_token=A&refresh_token=B",
    "com.fiao.panama://evil@auth#access_token=A&refresh_token=B",
    "com.fiao.panama://auth:99#access_token=A&refresh_token=B",
    "https://auth/#access_token=A&refresh_token=B",
    "otra.app://auth#access_token=A&refresh_token=B",
    "no es una url",
    "",
    undefined,
  ]) assert.equal(parseNativeAuthReturn(bad, R).kind, "ignore", String(bad));
});

test("error del proveedor y tokens ausentes dan un mensaje sin exponer tokens", () => {
  assert.deepEqual(parseNativeAuthReturn(`${R}#error=access_denied&error_description=Cancelado`, R), { kind: "error", message: "Cancelado" });
  const missing = parseNativeAuthReturn(`${R}#access_token=SECRETO`, R);
  assert.equal(missing.kind, "error");
  assert.ok(!JSON.stringify(missing).includes("SECRETO"));
});
