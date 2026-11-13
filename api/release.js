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

const same = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RELEASE_ADMIN_TOKEN } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RELEASE_ADMIN_TOKEN) {
    return res.status(500).json({ error: "The server is not configured" });
  }

  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token || !same(token, RELEASE_ADMIN_TOKEN)) return res.status(401).json({ error: "Unauthorized" });

  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const versionCode = Number.parseInt(b.version_code, 10);
  if (!b.version_name || !Number.isInteger(versionCode) || versionCode <= 0 || !/^https:\/\//.test(b.apk_url || "")) {
    return res.status(400).json({ error: "version_name, version_code (a positive number) and apk_url (https) are required" });
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/app_releases`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      platform: "android",
      version_name: String(b.version_name),
      version_code: versionCode,
      apk_url: b.apk_url,
      notes_es: b.notes_es ?? null,
      notes_en: b.notes_en ?? null,
      mandatory: Boolean(b.mandatory),
      published: b.published !== false,
    }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) return res.status(response.status === 409 ? 409 : 502).json({ error: data?.message || "Could not save the release" });
  return res.status(201).json({ release: data?.[0] ?? null });
}
