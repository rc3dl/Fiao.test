// Integración nativa de Android (Capacitor 8). Solo se carga dentro de la app.
import { SystemBars, SystemBarsStyle } from "@capacitor/core";
import { App } from "@capacitor/app";

export async function initNative() {
  // La barra superior de FIA'O siempre es roja/oscura: iconos del sistema en claro.
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

}
