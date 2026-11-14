import test from "node:test";
import assert from "node:assert/strict";
import { translations } from "../src/lib/translations.js";

const copy = translations.es.copy;

test("textos nuevos (cola local, sync, perfil, informe) tienen traducción al español", () => {
  for (const key of [
    "Credit saved on this phone. It will be confirmed when it syncs.",
    "Payment saved on this phone. It will be confirmed when it syncs.",
    "Sale saved on this phone: {amount} for {name}. It will be confirmed when it syncs.",
    "Sale registered: {amount} added to {name}'s debt.",
    "Nothing waiting to be sent.",
    "Offline storage is not available on this phone, so changes cannot be saved offline. Connect to the internet to keep working.",
    "We could not load your profile.",
    "Could not start Google sign-in. Try again.",
    "We could not complete the request right now. Please try again in a moment.",
    "ACTIVE CREDIT TODAY",
    "PENDING BALANCES TODAY",
    "This unit only allows whole numbers (no decimals) for stock.",
    "That price is too high.",
  ]) assert.ok(copy[key], `falta traducción: ${key}`);
});

test("las plantillas con {valores} conservan los mismos marcadores en español", () => {
  for (const [en, es] of Object.entries(copy)) {
    const a = [...en.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join();
    const b = [...String(es).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join();
    assert.equal(a, b, en);
  }
});

test("secciones jerárquicas: mismas claves en español e inglés", () => {
  for (const group of ["nav", "common", "auth", "pages"]) {
    assert.deepEqual(Object.keys(translations.es[group]).sort(), Object.keys(translations.en[group]).sort(), group);
  }
});
