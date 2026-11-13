import test from "node:test";
import assert from "node:assert/strict";
import version from "../api/version.js";
import release from "../api/release.js";

function fakeRes() {
  const res = { headers: {}, statusCode: 200, body: undefined };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  res.end = () => res;
  return res;
}
const realFetch = globalThis.fetch;
test.afterEach(() => { globalThis.fetch = realFetch; for (const k of ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "RELEASE_ADMIN_TOKEN"]) delete process.env[k]; });

test("version: devuelve la última publicada, con caché y CORS", async () => {
  process.env.SUPABASE_URL = "https://x.supabase.co";
  process.env.SUPABASE_ANON_KEY = "anon";
  let seen;
  globalThis.fetch = async (url, init) => { seen = { url, init }; return { ok: true, json: async () => [{ version_name: "1.0.1", version_code: 10001 }] }; };
  const res = fakeRes();
  await version({ method: "GET" }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.latest.version_code, 10001);
  assert.match(seen.url, /published=eq\.true/);
  assert.match(seen.url, /order=version_code\.desc&limit=1/);
  assert.equal(seen.init.headers.apikey, "anon");
  assert.match(res.headers["Cache-Control"], /s-maxage=300/);
  assert.equal(res.headers["Access-Control-Allow-Origin"], "*");
});

test("version: sin versiones publicadas responde latest null; sin configuración responde 500", async () => {
  process.env.SUPABASE_URL = "https://x.supabase.co";
  process.env.SUPABASE_ANON_KEY = "anon";
  globalThis.fetch = async () => ({ ok: true, json: async () => [] });
  const res = fakeRes();
  await version({ method: "GET" }, res);
  assert.equal(res.body.latest, null);

  delete process.env.SUPABASE_URL;
  const res2 = fakeRes();
  await version({ method: "GET" }, res2);
  assert.equal(res2.statusCode, 500);
});

test("release: exige el token de administrador", async () => {
  process.env.SUPABASE_URL = "https://x.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";
  process.env.RELEASE_ADMIN_TOKEN = "secreto-largo";
  let called = false;
  globalThis.fetch = async () => { called = true; return { ok: true, json: async () => [] }; };
  const body = { version_name: "1.0.1", version_code: 10001, apk_url: "https://a/b.apk" };

  const noToken = fakeRes();
  await release({ method: "POST", headers: {}, body }, noToken);
  assert.equal(noToken.statusCode, 401);
  const badToken = fakeRes();
  await release({ method: "POST", headers: { authorization: "Bearer otro" }, body }, badToken);
  assert.equal(badToken.statusCode, 401);
  assert.equal(called, false, "no toca Supabase sin autorización");
  const wrongMethod = fakeRes();
  await release({ method: "GET", headers: {} }, wrongMethod);
  assert.equal(wrongMethod.statusCode, 405);
});

test("release: valida los datos y guarda con la llave del servidor", async () => {
  process.env.SUPABASE_URL = "https://x.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";
  process.env.RELEASE_ADMIN_TOKEN = "secreto-largo";
  const auth = { authorization: "Bearer secreto-largo" };

  const bad = fakeRes();
  await release({ method: "POST", headers: auth, body: { version_name: "1.0.1", version_code: "abc", apk_url: "http://inseguro" } }, bad);
  assert.equal(bad.statusCode, 400);

  let sent;
  globalThis.fetch = async (url, init) => { sent = { url, init }; return { ok: true, status: 201, json: async () => [{ id: "r1", version_code: 10001 }] }; };
  const ok = fakeRes();
  await release({ method: "POST", headers: auth, body: { version_name: "1.0.1", version_code: "10001", apk_url: "https://a/b.apk", mandatory: true, notes_es: "Mejoras" } }, ok);
  assert.equal(ok.statusCode, 201);
  const saved = JSON.parse(sent.init.body);
  assert.equal(saved.version_code, 10001);
  assert.equal(saved.mandatory, true);
  assert.equal(saved.platform, "android");
  assert.equal(sent.init.headers.apikey, "svc");
});
