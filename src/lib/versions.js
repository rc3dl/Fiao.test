// Comparación de versiones de la app (el número de versión Android crece con cada publicación).

export function parseVersionCode(value) {
  const n = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// installed = { code }  latest = { version_code, mandatory } | null
// -> { available, mandatory }   (obligatoria solo si la versión instalada es anterior a la publicada)
export function compareReleases(installed, latest) {
  const have = parseVersionCode(installed?.code);
  const next = parseVersionCode(latest?.version_code);
  const available = next > have;
  return { available, mandatory: available && Boolean(latest?.mandatory) };
}
