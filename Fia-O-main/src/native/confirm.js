import { IS_NATIVE } from "@/native/useIsNative";

// Confirmación para acciones importantes.
// - Web: window.confirm, igual que siempre.
// - Android: hoja inferior propia (la dibuja MobileShell).
// Devuelve una promesa con true (aceptó) o false (canceló).
export function confirmAction(message, { confirmLabel, destructive = true } = {}) {
  if (!IS_NATIVE) return Promise.resolve(window.confirm(message));
  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent("fiao:confirm", { detail: { message, confirmLabel, destructive, resolve } })
    );
  });
}
