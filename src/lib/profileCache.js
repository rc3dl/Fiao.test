// Actualiza el perfil mínimo que permite reabrir la app offline.
// No inventa una sesión nueva si todavía no existe una copia local.
export function mergeProfileCache(storage, userId, fields) {
  if (!storage || !userId || !fields || typeof fields !== "object") return false;

  const key = `fiao:me:${userId}`;
  try {
    const raw = storage.getItem(key);
    if (!raw) return false;
    const current = JSON.parse(raw);
    if (!current || current.id !== userId || typeof current !== "object") return false;
    storage.setItem(key, JSON.stringify({ ...current, ...fields, id: userId }));
    return true;
  } catch {
    return false;
  }
}
