// Variables de entorno de FIA'O, todas en un solo lugar.
// Vite solo expone las que empiezan por VITE_ y las fija al compilar (hay que volver a compilar si cambian).
//   GitHub Pages ........ salen de los secrets del workflow (.github/workflows)
//   Local y Android ..... salen de .env.local (copia .env.example)
const clean = (value) => (typeof value === "string" ? value.trim() : "");

export const SUPABASE_URL = clean(import.meta.env.VITE_SUPABASE_URL);
export const SUPABASE_ANON_KEY = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);
export const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Botón "Continuar con Google". En Android se abre en el navegador del sistema (Google bloquea los WebView)
// y se vuelve a la app por NATIVE_REDIRECT.
export const ENABLE_GOOGLE = clean(import.meta.env.VITE_ENABLE_GOOGLE) === "true";

// Dirección a la que se regresa a la app Android tras Google (esquema propio declarado en AndroidManifest.xml).
// También debe estar en Supabase: Authentication > URL Configuration > Redirect URLs.
export const NATIVE_REDIRECT = "com.fiao.panama://auth";

// Dirección pública de la web (por ejemplo https://usuario.github.io/Fia-O), sin "/" final.
// La app Android la usa para enlaces que se abren fuera de la app, como "olvidé mi contraseña".
// Dirección del servicio de actualizaciones (la web desplegada en Vercel, por ejemplo https://fia-o.vercel.app).
// Si no se define, la app consulta directamente la tabla app_releases de Supabase.
export const UPDATES_URL = clean(import.meta.env.VITE_UPDATES_URL).replace(/\/+$/, "");

export const APP_URL = clean(import.meta.env.VITE_APP_URL).replace(/\/+$/, "");
