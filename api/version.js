// Vercel: GET /api/version  ->  la última versión publicada de la app Android.
// La app lo consulta para saber si hay una actualización. La respuesta se guarda 5 minutos en caché.
// Variables en Vercel: SUPABASE_URL y SUPABASE_ANON_KEY (también sirven VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // la app Android se sirve desde https://localhost
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return res.status(500).json({ error: "Missing SUPABASE_URL or SUPABASE_ANON_KEY" });

  const query =
    "select=version_name,version_code,apk_url,notes_es,notes_en,mandatory,created_at" +
    "&platform=eq.android&published=eq.true&order=version_code.desc&limit=1";

  try {
    const response = await fetch(`${url}/rest/v1/app_releases?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!response.ok) return res.status(502).json({ error: "Could not read the releases" });
    const [latest] = await response.json();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ latest: latest ?? null });
  } catch {
    return res.status(502).json({ error: "Could not reach Supabase" });
  }
}
