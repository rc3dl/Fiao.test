// Ayudas para reconocer fallos de conexión y leer la sesión guardada en el dispositivo.
import { SUPABASE_URL } from "@/lib/env";

// ¿El error es de conexión (sin internet, tiempo agotado...) y no una respuesta del servidor?
export const isNetworkError = (error) => {
  const text = typeof error === "string" ? error : `${error?.name || ""} ${error?.message || ""}`;
  return /failed to fetch|networkerror|network error|network request|load failed|fetch failed|timeout|timed out|offline/i.test(text);
};

// Sesión que Supabase guarda en el dispositivo. Se puede leer sin internet.
export function readStoredSession() {
  try {
    const ref = new URL(SUPABASE_URL).hostname.split(".")[0];
    const raw = localStorage.getItem(`sb-${ref}-auth-token`);
    const session = raw ? JSON.parse(raw) : null;
    return session?.user ? session : null;
  } catch {
    return null;
  }
}
