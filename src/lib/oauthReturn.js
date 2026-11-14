// Valida el enlace de retorno OAuth de Android sin exponer códigos ni tokens en errores.
// Supabase usa PKCE por defecto y devuelve ?code=...; también aceptamos el formato
// antiguo de tokens en el fragmento para mantener compatibilidad con versiones previas.
export function parseNativeAuthReturn(raw, redirect = "com.fiao.panama://auth") {
  let url;
  let expected;
  try {
    url = new URL(String(raw));
    expected = new URL(redirect);
  } catch {
    return { kind: "ignore" };
  }

  // Esquema, host y ruta EXACTOS.
  if (url.protocol !== expected.protocol || url.host !== expected.host || url.username || url.password || url.port) {
    return { kind: "ignore" };
  }
  if (url.pathname !== "" && url.pathname !== "/") return { kind: "ignore" };

  const query = url.searchParams;
  const fragment = new URLSearchParams(url.hash.replace(/^#/, ""));
  const params = new URLSearchParams([...query, ...fragment]);

  if (params.get("error")) {
    return { kind: "error", message: params.get("error_description") || params.get("error") };
  }

  const code = query.get("code") || fragment.get("code");
  if (code) return { kind: "code", code };

  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (access_token && refresh_token) return { kind: "session", access_token, refresh_token };

  return { kind: "error", message: "No se pudo completar el inicio de sesión. Vuelve a intentarlo." };
}
