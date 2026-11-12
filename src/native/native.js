// Integración nativa de Android (Capacitor 8). Solo se carga dentro de la app.
import { SystemBars, SystemBarsStyle } from "@capacitor/core";
import { App } from "@capacitor/app";
import { supabase } from "@/api/supabaseClient";
import { NATIVE_REDIRECT } from "@/lib/env";
import { withBase } from "@/lib/withBase";

const authError = (message) => window.dispatchEvent(new CustomEvent("fiao:auth-error", { detail: message }));

// Google devuelve a la app con com.fiao.panama://auth#access_token=...&refresh_token=...
async function finishGoogleLogin(url) {
  const params = new URLSearchParams(url.split("#")[1] || url.split("?")[1] || "");
  if (params.get("error")) return authError(params.get("error_description") || params.get("error"));

  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) return authError("No se pudo completar el inicio de sesión con Google.");

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) return authError(error.message);
  window.location.assign(withBase("/dashboard"));
}

export async function initNative() {
  // La barra de estado y la de gestos van sobre el rojo de FIA'O: iconos del sistema en claro.
  try {
    await SystemBars.setStyle({ style: SystemBarsStyle.Dark });
  } catch {
    /* se ignora */
  }

  // Botón/gesto "volver": se lo pasamos a la interfaz (MobileShell decide qué cerrar o a dónde ir).
  // Si nadie lo atiende, salimos de la app.
  App.addListener("backButton", () => {
    const handled = !window.dispatchEvent(new CustomEvent("fiao:back", { cancelable: true }));
    if (!handled) App.exitApp();
  });

  // Regreso desde el navegador tras iniciar sesión con Google.
  App.addListener("appUrlOpen", ({ url }) => {
    if (url && url.startsWith(NATIVE_REDIRECT)) finishGoogleLogin(url);
  });
}
