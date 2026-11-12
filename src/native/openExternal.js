import { IS_NATIVE } from "@/native/useIsNative";

// Abre un enlace fuera de la app. En Android el WebView lo entrega al sistema: un enlace de WhatsApp (wa.me)
// abre directamente WhatsApp con el chat y el mensaje listos para enviar. En la web, pestaña nueva como siempre.
export function openExternal(url) {
  if (IS_NATIVE) {
    window.location.assign(url);
    return;
  }
  window.open(url, "_blank", "noopener");
}
