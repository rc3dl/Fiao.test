// Vercel: POST /api/release  ->  registra una versión nueva de la app (después de subir el APK a Supabase Storage).
//
//   curl -X POST https://TU-PROYECTO.vercel.app/api/release \
//     -H "Authorization: Bearer $RELEASE_ADMIN_TOKEN" -H "Content-Type: application/json" \
//     -d '{"version_name":"1.0.1","version_code":10001,"apk_url":"https://...supabase.co/storage/v1/object/public/app-releases/fiao-1.0.1.apk",
//          "notes_es":"Mejoras de velocidad","notes_en":"Speed improvements","mandatory":false}'
//
// Variables en Vercel (NUNCA con prefijo VITE_, solo del servidor):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RELEASE_ADMIN_TOKEN (una clave larga que tú inventas)

import { timingSafeEqual } from "node:crypto";
import { isTrustedReleaseUrl } from "../src/lib/trustedReleaseUrl.js";

const same = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

// Validación estricta: solo se aceptan los tipos exactos (nada de "false" como texto ni "10001abc").
function validateRelease(b, supabaseUrl) {
  const problems = [];
  if (typeof b.version_name !== "string" || !/^\d+\.\d+\.\d+([-+][0-9A-Za-z.-]+)?$/.test(b.version_name.trim()) || b.version_name.length > 40) {
    problems.push("version_name must be a version like 1.0.1");
  }
  const code = typeof b.version_code === "string" && /^\d{1,10}$/.test(b.version_code) ? Number(b.version_code) : b.version_code;
  if (!Number.isSafeInteger(code) || code <= 0 || code > 2100000000) {
    problems.push("version_code must be a positive integer");
  }
  let url = null;
  try {
    url = typeof b.apk_url === "string" && b.apk_url.length <= 2048 ? new URL(b.apk_url) : null;
  } catch {
    url = null;
  }
  if (!isTrustedReleaseUrl(b.apk_url, supabaseUrl)) {
    problems.push("apk_url must be an HTTPS APK in this project's app-releases bucket");
  }
  for (const key of ["mandatory", "published"]) {
    if (key in b && typeof b[key] !== "boolean") problems.push(`${key} must be true or false (boolean)`);
  }
  for (const key of ["notes_es", "notes_en"]) {
    if (b[key] != null && (typeof b[key] !== "string" || b[key].length > 2000)) problems.push(`${key} must be text up to 2000 characters`);
  }
  return problems;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RELEASE_ADMIN_TOKEN } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RELEASE_ADMIN_TOKEN) {
    return res.status(500).json({ error: "The server is not configured" });
  }

  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token || !same(token, RELEASE_ADMIN_TOKEN)) return res.status(401).json({ error: "Unauthorized" });

  let b = req.body;
  if (typeof b === "string") {
    try {
      b = b.trim() ? JSON.parse(b) : {};
    } catch {
      return res.status(400).json({ error: "The body is not valid JSON" });
    }
  }
  if (!b || typeof b !== "object" || Array.isArray(b)) return res.status(400).json({ error: "The body must be a JSON object" });

  const problems = validateRelease(b, SUPABASE_URL);
  if (problems.length) return res.status(400).json({ error: problems.join("; ") });
  const versionCode = Number(b.version_code);

  let response;
  let data = null;
  try {
    response = await fetch(`${SUPABASE_URL}/rest/v1/app_releases`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        platform: "android",
        version_name: b.version_name.trim(),
        version_code: versionCode,
        apk_url: b.apk_url,
        notes_es: b.notes_es ?? null,
        notes_en: b.notes_en ?? null,
        mandatory: b.mandatory ?? false,
        published: b.published ?? true,
      }),
      signal: AbortSignal.timeout(10000),
    });
    data = await response.json().catch(() => null);
  } catch {
    return res.status(502).json({ error: "Could not reach the database" });
  }
  if (!response.ok) return res.status(response.status === 409 ? 409 : 502).json({ error: data?.message || "Could not save the release" });
  return res.status(201).json({ release: data?.[0] ?? null });
}
