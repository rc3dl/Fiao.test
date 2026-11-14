// Integración nativa de Android (Capacitor 8). Solo se carga dentro de la app.
import { SystemBars, SystemBarsStyle, SystemBarType } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/api/supabaseClient";
import { NATIVE_REDIRECT } from "@/lib/env";
import { withBase } from "@/lib/withBase";
import { parseNativeAuthReturn } from "@/lib/oauthReturn";

const authError = (message) => window.dispatchEvent(new CustomEvent("fiao:auth-error", { detail: message }));
let lastOAuthUrl = null;

// El proveedor devuelve a la app con tokens o con un código PKCE.
async function finishNativeOAuth(url) {
  if (!url || url === lastOAuthUrl) return;
  const result = parseNativeAuthReturn(url, NATIVE_REDIRECT);
  if (result.kind === "ignore") return;
  lastOAuthUrl = url;

  if (result.kind === "error") {
    authError(result.message);
    return;
  }

  try {
    let error = null;
    if (result.kind === "code") {
      ({ error } = await supabase.auth.exchangeCodeForSession(result.code));
    } else {
      ({ error } = await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      }));
    }
    if (error) {
      lastOAuthUrl = null;
      authError(error.message);
      return;
    }
    await Browser.close().catch(() => {});
    window.location.assign(withBase("/dashboard"));
  } catch (error) {
    lastOAuthUrl = null;
    authError(error?.message || "No se pudo completar el inicio de sesión.");
  }
}

export async function initNative() {
  // Registrar primero el retorno OAuth para no perder el enlace al reanudar Android.
  App.addListener("appUrlOpen", ({ url }) => {
    if (url) finishNativeOAuth(url);
  });

  // También cubre el caso en que Android inicia la actividad desde un enlace profundo.
  try {
    const launch = await App.getLaunchUrl();
    if (launch?.url) await finishNativeOAuth(launch.url);
  } catch {
    /* No hay enlace de inicio: se continúa normalmente. */
  }

  try {
    await SystemBars.setStyle({ style: SystemBarsStyle.Dark });
  } catch {
    /* se ignora */
  }

  try {
    await SystemBars.hide({ bar: SystemBarType.NavigationBar });
  } catch {
    /* se ignora */
  }

  App.addListener("backButton", () => {
    const handled = !window.dispatchEvent(new CustomEvent("fiao:back", { cancelable: true }));
    if (!handled) App.exitApp();
  });
}
