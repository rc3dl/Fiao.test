import test from "node:test";
import assert from "node:assert/strict";
import { fetchAllPages } from "../src/lib/supabasePagination.js";

test("fetchAllPages combines every page and advances inclusive ranges", async () => {
  const calls = [];
  const all = await fetchAllPages(async (from, to) => {
    calls.push([from, to]);
    const rows = Array.from({ length: 5 }, (_, i) => i);
    return { data: rows.slice(from, to + 1), error: null };
  }, 2);
  assert.deepEqual(all, [0, 1, 2, 3, 4]);
  assert.deepEqual(calls, [[0, 1], [2, 3], [4, 5]]);
});

test("fetchAllPages requests the final empty page for an exact multiple", async () => {
  const calls = [];
  const all = await fetchAllPages(async (from, to) => {
    calls.push([from, to]);
    return { data: from < 4 ? [from, from + 1] : [], error: null };
  }, 2);
  assert.deepEqual(all, [0, 1, 2, 3]);
  assert.deepEqual(calls, [[0, 1], [2, 3], [4, 5]]);
});

test("fetchAllPages returns an empty array for an empty result", async () => {
  assert.deepEqual(await fetchAllPages(async () => ({ data: [], error: null }), 3), []);
});

test("fetchAllPages propagates Supabase errors", async () => {
  const failure = new Error("network failure");
  await assert.rejects(() => fetchAllPages(async () => ({ data: null, error: failure }), 3), failure);
});

test("fetchAllPages rejects invalid page sizes", async () => {
  await assert.rejects(() => fetchAllPages(async () => ({ data: [], error: null }), 0), RangeError);
});
