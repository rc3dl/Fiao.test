import test from "node:test";
import assert from "node:assert/strict";
import { compareReleases, parseVersionCode } from "../src/lib/versions.js";

test("hay actualización solo si la publicada es mayor", () => {
  assert.deepEqual(compareReleases({ code: "10200" }, { version_code: 10300 }), { available: true, mandatory: false });
  assert.deepEqual(compareReleases({ code: "10300" }, { version_code: 10300 }), { available: false, mandatory: false });
  assert.deepEqual(compareReleases({ code: 20000 }, { version_code: 10300 }), { available: false, mandatory: false });
});
test("obligatoria solo cuando hay actualización", () => {
  assert.deepEqual(compareReleases({ code: 1 }, { version_code: 2, mandatory: true }), { available: true, mandatory: true });
  assert.deepEqual(compareReleases({ code: 2 }, { version_code: 2, mandatory: true }), { available: false, mandatory: false });
});
test("datos incompletos no rompen nada", () => {
  assert.deepEqual(compareReleases(null, null), { available: false, mandatory: false });
  assert.equal(parseVersionCode("abc"), 0);
  assert.equal(parseVersionCode(" 42 "), 42);
});
