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
  await release({ method: "POST", headers: auth, body: { version_name: "1.0.1", version_code: 10001, apk_url: "https://a/b.apk", mandatory: true, notes_es: "Mejoras" } }, ok);
  assert.equal(ok.statusCode, 201);
  const saved = JSON.parse(sent.init.body);
  assert.equal(saved.version_code, 10001);
  assert.equal(saved.mandatory, true);
  assert.equal(saved.platform, "android");
  assert.equal(sent.init.headers.apikey, "svc");
});

async function postRelease(body, { rawBody } = {}) {
  process.env.SUPABASE_URL = "https://x.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";
  process.env.RELEASE_ADMIN_TOKEN = "secreto-largo";
  let called = false;
  globalThis.fetch = async () => { called = true; return { ok: true, status: 201, json: async () => [{ id: "r1" }] }; };
  const res = fakeRes();
  await release({ method: "POST", headers: { authorization: "Bearer secreto-largo" }, body: rawBody ?? body }, res);
  return { res, called };
}
const good = { version_name: "1.0.1", version_code: 10001, apk_url: "https://a.supabase.co/b.apk" };

test("release: JSON mal formado, vacío o que no es un objeto → 400 sin tocar Supabase", async () => {
  for (const raw of ["{no es json", "[1,2]", "null", '"texto"']) {
    const { res, called } = await postRelease(null, { rawBody: raw });
    assert.equal(res.statusCode, 400, raw);
    assert.equal(called, false);
  }
  const { res } = await postRelease(null, { rawBody: "" });
  assert.equal(res.statusCode, 400);
});

test("release: tipos estrictos (nada de 'false' como texto ni '10001abc')", async () => {
  const cases = [
    { ...good, mandatory: "false" },
    { ...good, published: "false" },
    { ...good, mandatory: 1 },
    { ...good, version_code: "10001abc" },
    { ...good, version_code: 1.5 },
    { ...good, version_code: -3 },
    { ...good, version_code: 1e12 },
    { ...good, version_name: "latest" },
    { ...good, version_name: 7 },
    { ...good, apk_url: "javascript:alert(1)" },
    { ...good, apk_url: "https://user:pw@a.com/b.apk" },
    { ...good, notes_es: 5 },
  ];
  for (const body of cases) {
    const { res, called } = await postRelease(body);
    assert.equal(res.statusCode, 400, JSON.stringify(body));
    assert.equal(called, false);
  }
});

test("release: booleanos reales se respetan y published por defecto es true", async () => {
  let sent;
  const { res } = await postRelease({ ...good, published: false, mandatory: false });
  assert.equal(res.statusCode, 201);
  globalThis.fetch = async (u, init) => { sent = JSON.parse(init.body); return { ok: true, status: 201, json: async () => [{}] }; };
  const r2 = fakeRes();
  await release({ method: "POST", headers: { authorization: "Bearer secreto-largo" }, body: good }, r2);
  assert.equal(sent.published, true);
  assert.equal(sent.mandatory, false);
});

test("release: duplicado → 409; error o respuesta no JSON de Supabase → 502; sin red → 502", async () => {
  const { res: _ } = await postRelease(good);
  const run = async () => {
    const r = fakeRes();
    await release({ method: "POST", headers: { authorization: "Bearer secreto-largo" }, body: good }, r);
    return r;
  };
  globalThis.fetch = async () => ({ ok: false, status: 409, json: async () => ({ message: "dup" }) });
  assert.equal((await run()).statusCode, 409);
  globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => { throw new Error("html"); } });
  assert.equal((await run()).statusCode, 502);
  globalThis.fetch = async () => { throw new Error("ECONNRESET"); };
  assert.equal((await run()).statusCode, 502);
});

test("release: sin variables de entorno → 500", async () => {
  const res = fakeRes();
  await release({ method: "POST", headers: { authorization: "Bearer x" }, body: good }, res);
  assert.equal(res.statusCode, 500);
});
