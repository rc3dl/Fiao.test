// Integración nativa de Android (Capacitor 8). Solo se carga dentro de la app.
import { SystemBars, SystemBarsStyle, SystemBarType } from "@capacitor/core";
import { App } from "@capacitor/app";
import { supabase } from "@/api/supabaseClient";
import { NATIVE_REDIRECT } from "@/lib/env";
import { withBase } from "@/lib/withBase";
import { parseNativeAuthReturn } from "@/lib/oauthReturn";

const authError = (message) => window.dispatchEvent(new CustomEvent("fiao:auth-error", { detail: message }));

// El proveedor OAuth devuelve a la app con com.fiao.panama://auth#access_token=...&refresh_token=...
async function finishNativeOAuth(url) {
  const result = parseNativeAuthReturn(url, NATIVE_REDIRECT);
  if (result.kind === "ignore") return; // enlace que no es el de retorno: se descarta sin tocar la sesión
  if (result.kind === "error") return authError(result.message);

  const { access_token, refresh_token } = result;
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

  // Los botones o la línea de navegación de Android se ocultan y reaparecen al deslizar desde el borde de abajo.
  // Para dejarlos siempre visibles, borra este bloque.
  try {
    await SystemBars.hide({ bar: SystemBarType.NavigationBar });
  } catch {
    /* se ignora */
  }

  // Botón/gesto "volver": se lo pasamos a la interfaz (MobileShell decide qué cerrar o a dónde ir).
  // Si nadie lo atiende, salimos de la app.
  App.addListener("backButton", () => {
    const handled = !window.dispatchEvent(new CustomEvent("fiao:back", { cancelable: true }));
    if (!handled) App.exitApp();
  });

  // Regreso desde el navegador tras iniciar sesión con un proveedor OAuth.
  App.addListener("appUrlOpen", ({ url }) => {
    if (url) finishNativeOAuth(url).catch(() => authError("No se pudo completar el inicio de sesión."));
  });
}
