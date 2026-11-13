// Actualizaciones de la app Android: consulta la última versión publicada y abre su descarga.
// La instalación la hace Android (pide permiso para instalar apps de esta fuente la primera vez).
// La versión nueva debe estar firmada con la misma llave y tener un número de versión mayor: así se actualiza
// sin desinstalar y se conservan los datos.
import { App } from "@capacitor/app";
import { supabase } from "@/api/supabaseClient";
import { UPDATES_URL } from "@/lib/env";
import { compareReleases } from "@/lib/versions";
import { openExternal } from "@/native/openExternal";

const COLUMNS = "version_name, version_code, apk_url, notes_es, notes_en, mandatory, created_at";
const EVERY_MS = 6 * 60 * 60 * 1000;

const INITIAL = { status: "idle", installed: null, latest: null, mandatory: false, checkedAt: null, downloadStarted: false };
let state = INITIAL;
const listeners = new Set();
const set = (patch) => {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
};
export const subscribeUpdate = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const getUpdateState = () => state;

async function fetchLatest() {
  if (UPDATES_URL) {
    const response = await fetch(`${UPDATES_URL}/api/version`, { cache: "no-store" });
    if (!response.ok) throw new Error("updates");
    return (await response.json()).latest ?? null;
  }
  const { data, error } = await supabase
    .from("app_releases")
    .select(COLUMNS)
    .eq("platform", "android")
    .eq("published", true)
    .order("version_code", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return data?.[0] ?? null;
}

// Busca una versión nueva. Con force = false no repite la consulta si se hizo hace poco.
export async function checkForUpdate({ force = false } = {}) {
  if (state.status === "checking") return state;
  if (!force && state.checkedAt && Date.now() - state.checkedAt < EVERY_MS) return state;
  set({ status: "checking" });
  try {
    const info = await App.getInfo(); // { version: "1.0.0", build: "10000" }
    const installed = { name: info.version, code: info.build };
    const latest = await fetchLatest();
    const { available, mandatory } = compareReleases(installed, latest);
    set({ status: available ? "available" : "uptodate", installed, latest, mandatory, checkedAt: Date.now() });
  } catch {
    set({ status: "error", checkedAt: Date.now() });
  }
  return state;
}

export function downloadUpdate() {
  if (!state.latest?.apk_url) return;
  openExternal(state.latest.apk_url);
  set({ downloadStarted: true });
}
