// Almacenamiento local en IndexedDB: operaciones pendientes (cola), copia de los datos y pequeños ajustes.
// Cada usuario tiene sus datos separados por su id.
const DB_NAME = "fiao-offline";
const OPS = "ops";
const KV = "kv";

let dbPromise;
function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(OPS)) db.createObjectStore(OPS, { keyPath: "id" });
        if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

function run(store, mode, work) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const request = work(tx.objectStore(store));
        tx.oncomplete = () => resolve(request?.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
  );
}

const kvKey = (userId, name) => `${userId}|${name}`;

// Almacenamiento de la cola para el motor de sincronización
export function createIdbStorage(userId) {
  return {
    list: async () => (await run(OPS, "readonly", (s) => s.getAll())).filter((o) => o.user_id === userId),
    put: (op) => run(OPS, "readwrite", (s) => s.put(op)),
    remove: (id) => run(OPS, "readwrite", (s) => s.delete(id)),
    getMeta: async (key) => (await run(KV, "readonly", (s) => s.get(kvKey(userId, `meta:${key}`)))) ?? null,
    setMeta: (key, value) => run(KV, "readwrite", (s) => s.put(value, kvKey(userId, `meta:${key}`))),
  };
}

// Copia local de las tablas (para poder consultar sin conexión)
export const getMirror = async (userId, table) => (await run(KV, "readonly", (s) => s.get(kvKey(userId, `mirror:${table}`)))) ?? null;
export const putMirror = (userId, table, rows) => run(KV, "readwrite", (s) => s.put(rows, kvKey(userId, `mirror:${table}`)));

// Borra la copia de datos de un usuario (al cerrar sesión). Las operaciones sin enviar se conservan.
export async function wipeMirror(userId, { keepOps = true } = {}) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction([KV, OPS], "readwrite");
    const kv = tx.objectStore(KV);
    const keys = kv.getAllKeys();
    keys.onsuccess = () => {
      for (const key of keys.result) if (String(key).startsWith(`${userId}|`)) kv.delete(key);
    };
    if (!keepOps) {
      const ops = tx.objectStore(OPS).getAll();
      ops.onsuccess = () => {
        for (const op of ops.result) if (op.user_id === userId) tx.objectStore(OPS).delete(op.id);
      };
    }
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
