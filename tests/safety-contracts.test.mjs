import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isTrustedReleaseUrl } from "../src/lib/trustedReleaseUrl.js";

const supabaseUrl = "https://demo-project.supabase.co";

test("APK links must come from the project's public app-releases bucket", () => {
  assert.equal(
    isTrustedReleaseUrl("https://demo-project.supabase.co/storage/v1/object/public/app-releases/fiao.apk", supabaseUrl),
    true
  );
  assert.equal(
    isTrustedReleaseUrl("https://attacker.example/app.apk", supabaseUrl),
    false
  );
  assert.equal(
    isTrustedReleaseUrl("http://demo-project.supabase.co/storage/v1/object/public/app-releases/fiao.apk", supabaseUrl),
    false
  );
  assert.equal(
    isTrustedReleaseUrl("https://demo-project.supabase.co/storage/v1/object/public/other/fiao.apk", supabaseUrl),
    false
  );
  assert.equal(
    isTrustedReleaseUrl("https://demo-project.supabase.co/storage/v1/object/public/app-releases/fiao.zip", supabaseUrl),
    false
  );
});

test("sales never fall back to the old RPC signature without idempotency", async () => {
  const [productsApi, offline] = await Promise.all([
    readFile(new URL("../src/api/productsApi.js", import.meta.url), "utf8"),
    readFile(new URL("../src/offline/index.js", import.meta.url), "utf8"),
  ]);
  assert.match(productsApi, /p_request_id: requestId/);
  assert.doesNotMatch(productsApi, /supabase\.rpc\("register_fiado_sale", args\)/);
  assert.match(offline, /p_request_id: op\.record_id/);
  assert.doesNotMatch(offline, /return supabase\.rpc\("register_fiado_sale", args\)/);
});

test("SQL serializes duplicate sync operations and requires an idempotency key for sales", async () => {
  const [schema, migration001, migration003] = await Promise.all([
    readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/001_idempotent_fiado_sale.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/003_sync_and_archive_guards.sql", import.meta.url), "utf8"),
  ]);
  assert.match(schema, /perform pg_advisory_xact_lock\(hashtext\(v_owner::text\), hashtext\(v_id::text\)\)/);
  assert.match(schema, /An idempotency key is required/);
  assert.doesNotMatch(schema, /^as \$(?!\$)|^\$;$/m);
  assert.doesNotMatch(migration003, /^as \$(?!\$)|^\$;$/m);
  assert.match(migration001, /An idempotency key is required/);
  assert.match(migration003, /perform pg_advisory_xact_lock\(hashtext\(v_owner::text\), hashtext\(v_id::text\)\)/);
});

test("client archive and credit creation share a database lock and reject outstanding debt", async () => {
  const [schema, migration003] = await Promise.all([
    readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/003_sync_and_archive_guards.sql", import.meta.url), "utf8"),
  ]);
  for (const source of [schema, migration003]) {
    assert.match(source, /prevent_client_archive_with_balance/);
    assert.match(source, /Cannot archive a customer with an outstanding balance/);
    assert.match(source, /Customer not found or already archived/);
  }
});

test("legacy fractional product rows can be edited without changing stock or unit", async () => {
  const migration002 = await readFile(
    new URL("../supabase/migrations/002_whole_units_and_fifo_view.sql", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(migration002, /add constraint products_whole_units_chk/i);
  assert.match(migration002, /before insert or update of unit, stock, min_stock/i);
  assert.match(migration002, /drop constraint if exists products_whole_units_chk/i);
});

test("auth changes clear account-scoped query cache and profile writes use the offline queue", async () => {
  const [auth, authClient, setupApi] = await Promise.all([
    readFile(new URL("../src/contexts/AuthContext.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/api/authClient.js", import.meta.url), "utf8"),
    readFile(new URL("../src/api/setupApi.js", import.meta.url), "utf8"),
  ]);
  assert.match(auth, /queryClientInstance\.clear\(\)/);
  assert.match(authClient, /type: "profile\.update"/);
  assert.match(setupApi, /type: "profile\.update"/);
});
