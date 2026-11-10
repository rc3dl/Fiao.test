// Detección de plataforma: true solo dentro de la app Android/iOS (Capacitor).
// En Chrome u otro navegador es siempre false, así que todo lo "móvil nativo" queda apagado.
import { Capacitor } from "@capacitor/core";

function detect() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export const IS_NATIVE = detect();
export const useIsNative = () => IS_NATIVE;
