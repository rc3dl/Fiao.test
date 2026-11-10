// Variables de entorno de FIA'O, todas en un solo lugar.
// Vite solo expone las que empiezan por VITE_ y las fija al compilar (hay que volver a compilar si cambian).
//   GitHub Pages ........ salen de los secrets del workflow (.github/workflows)
//   Local y Android ..... salen de .env.local (copia .env.example)
import { IS_NATIVE } from "@/native/useIsNative";

const clean = (value) => (typeof value === "string" ? value.trim() : "");

export const SUPABASE_URL = clean(import.meta.env.VITE_SUPABASE_URL);
export const SUPABASE_ANON_KEY = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);
export const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// El botón de Google solo existe en la web: Google bloquea el inicio de sesión dentro de un WebView.
export const ENABLE_GOOGLE = clean(import.meta.env.VITE_ENABLE_GOOGLE) === "true" && !IS_NATIVE;

// Dirección pública de la web (por ejemplo https://usuario.github.io/Fia-O), sin "/" final.
// La app Android la usa para enlaces que se abren fuera de la app, como "olvidé mi contraseña".
export const APP_URL = clean(import.meta.env.VITE_APP_URL).replace(/\/+$/, "");
