// Lectura estricta del enlace con el que vuelve el inicio de sesión de Google a la app Android.
// Puro: no toca la red ni el navegador. Nunca devuelve tokens dentro de mensajes de error.

// Devuelve { kind: "ignore" } si el enlace no es el de retorno esperado,
// { kind: "error", message } si el proveedor informó un fallo, o { kind: "session", access_token, refresh_token }.
export function parseNativeAuthReturn(raw, redirect = "com.fiao.panama://auth") {
  let url;
  let expected;
  try {
    url = new URL(String(raw));
    expected = new URL(redirect);
  } catch {
    return { kind: "ignore" };
  }
  // Esquema, host y ruta EXACTOS (nada de prefijos como com.fiao.panama://auth.evil ni com.fiao.panama://authx)
  if (url.protocol !== expected.protocol || url.host !== expected.host || url.username || url.password || url.port) return { kind: "ignore" };
  if (url.pathname !== "" && url.pathname !== "/") return { kind: "ignore" };

  const params = new URLSearchParams(url.hash.replace(/^#/, "") || url.search.replace(/^\?/, ""));
  if (params.get("error")) return { kind: "error", message: params.get("error_description") || params.get("error") };

  // Supabase puede devolver tokens (implicit flow) o un código PKCE (code flow).
  const code = params.get("code");
  if (code) return { kind: "code", code };

  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) return { kind: "error", message: "No se pudo completar el inicio de sesión con el proveedor." };
  return { kind: "session", access_token, refresh_token };
}
