// Agrega la ruta base (/Fia-O) a cualquier ruta interna.
export const withBase = (path = "/") =>
  import.meta.env.BASE_URL.replace(/\/$/, "") +
  (path.startsWith("/") ? path : "/" + path);