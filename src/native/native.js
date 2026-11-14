// Integración nativa de Android (Capacitor 8). Solo se carga dentro de la app.
import { SystemBars, SystemBarsStyle, SystemBarType } from "@capacitor/core";
import { App } from "@capacitor/app";
import { supabase } from "@/api/supabaseClient";
import { NATIVE_REDIRECT } from "@/lib/env";
import { withBase } from "@/lib/withBase";
import { parseNativeAuthReturn } from "@/lib/oauthReturn";

const authError = (message) => window.dispatchEvent(new CustomEvent("fiao:auth-error", { detail: message }));

// Supabase usa PKCE: el navegador devuelve un código de un solo uso (?code=...).
// Se intercambia dentro del WebView, donde Supabase conserva el verificador PKCE.
async function finishNativeOAuth(url) {
  const result = parseNativeAuthReturn(url, NATIVE_REDIRECT);
  if (result.kind === "ignore") return;
  if (result.kind === "error") return authError(result.message);

  if (result.kind === "code") {
    const { error } = await supabase.auth.exchangeCodeForSession(result.code);
    if (error) return authError(error.message);
  } else if (result.kind === "session") {
    // Compatibilidad con enlaces de retorno antiguos que contienen tokens.
    const { access_token, refresh_token } = result;
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) return authError(error.message);
  }

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
  try {
    await SystemBars.hide({ bar: SystemBarType.NavigationBar });
  } catch {
    /* se ignora */
  }

  // Registrar primero el listener para no perder el retorno OAuth si la app ya estaba abierta.
  App.addListener("appUrlOpen", ({ url }) => {
    if (url) finishNativeOAuth(url).catch((error) => {
      console.error("Native OAuth return failed:", error);
      authError("No se pudo completar el inicio de sesión. Vuelve a intentarlo.");
    });
  });

  // También recuperar el enlace cuando Android inicia la app desde cero (cold start).
  try {
    const launch = await App.getLaunchUrl();
    if (launch?.url) {
      await finishNativeOAuth(launch.url);
    }
  } catch (error) {
    console.error("Could not read Android launch URL:", error);
  }

  // Botón/gesto "volver": se lo pasamos a la interfaz (MobileShell decide qué cerrar o a dónde ir).
  App.addListener("backButton", () => {
    const handled = !window.dispatchEvent(new CustomEvent("fiao:back", { cancelable: true }));
    if (!handled) App.exitApp();
  });
}
