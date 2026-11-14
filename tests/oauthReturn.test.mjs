import test from "node:test";
import assert from "node:assert/strict";
import { parseNativeAuthReturn } from "../src/lib/oauthReturn.js";

const R = "com.fiao.panama://auth";

test("acepta el código PKCE que Supabase devuelve en la query", () => {
  assert.deepEqual(parseNativeAuthReturn(`${R}?code=CODE123`, R), { kind: "code", code: "CODE123" });
  assert.deepEqual(parseNativeAuthReturn(`${R}/?code=CODE123`, R), { kind: "code", code: "CODE123" });
});

test("mantiene compatibilidad con el retorno antiguo de tokens", () => {
  const ok = `${R}#access_token=AAA&refresh_token=BBB&token_type=bearer`;
  assert.deepEqual(parseNativeAuthReturn(ok, R), { kind: "session", access_token: "AAA", refresh_token: "BBB" });
  assert.equal(parseNativeAuthReturn(`${R}/#access_token=A&refresh_token=B`, R).kind, "session");
  assert.equal(parseNativeAuthReturn(`${R}?access_token=A&refresh_token=B`, R).kind, "session");
});

test("enlaces con otro host, ruta, esquema o credenciales se ignoran", () => {
  for (const bad of [
    "com.fiao.panama://authx?code=A",
    "com.fiao.panama://auth.evil.com?code=A",
    "com.fiao.panama://auth/extra?code=A",
    "com.fiao.panama://evil@auth?code=A",
    "com.fiao.panama://auth:99?code=A",
    "https://auth/?code=A",
    "otra.app://auth?code=A",
    "no es una url",
    "",
    undefined,
  ]) assert.equal(parseNativeAuthReturn(bad, R).kind, "ignore", String(bad));
});

test("errores del proveedor no exponen códigos ni tokens", () => {
  assert.deepEqual(
    parseNativeAuthReturn(`${R}?error=access_denied&error_description=Cancelado`, R),
    { kind: "error", message: "Cancelado" }
  );
  const missing = parseNativeAuthReturn(`${R}#access_token=SECRETO`, R);
  assert.equal(missing.kind, "error");
  assert.ok(!JSON.stringify(missing).includes("SECRETO"));
});
