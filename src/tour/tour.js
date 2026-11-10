// Lógica del tutorial que no depende de la pantalla (así se puede probar aparte).

export const TOUR_VERSION = 1; // sube este número si algún día quieres que el tutorial vuelva a salir para todos
export const DESKTOP_MIN_WIDTH = 1024; // igual que el breakpoint "lg" de la barra de navegación
export const DOCK_MAX_WIDTH = 640; // por debajo de este ancho la tarjeta se pega abajo, como una hoja
export const NON_PAGE_CHAPTERS = ["Welcome", "Navigation", "Done"];

// ----------------------------------------------------------- Cuándo mostrarlo
export const storageKey = (userId) => `fiao:tour:v${TOUR_VERSION}:${userId}`;

function safeStorage(storage) {
  if (storage) return storage;
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null; // por ejemplo, navegación privada que bloquea el almacenamiento
  }
}

export function hasSeenTour(userId, storage) {
  const s = safeStorage(storage);
  if (!s || !userId) return false;
  try {
    return s.getItem(storageKey(userId)) === "done";
  } catch {
    return false;
  }
}

export function markTourSeen(userId, storage) {
  const s = safeStorage(storage);
  if (!s || !userId) return;
  try {
    s.setItem(storageKey(userId), "done");
  } catch {
    /* si no se puede guardar, simplemente volverá a salir */
  }
}

export function clearTourSeen(userId, storage) {
  const s = safeStorage(storage);
  if (!s || !userId) return;
  try {
    s.removeItem(storageKey(userId));
  } catch {
    /* nada */
  }
}

// ------------------------------------------------------- Qué pasos se muestran
export const isMobileWidth = (width) => width < DESKTOP_MIN_WIDTH;

// scope "all"  = el tutorial completo
// scope "page" = solo los pasos de la página donde estás (si esa página no tiene pasos, se usa el completo)
export function buildTour(allSteps, { scope = "all", pathname = "/dashboard", mobile = false } = {}) {
  const visible = allSteps.filter((s) => !(s.only === "desktop" && mobile) && !(s.only === "mobile" && !mobile));
  if (scope === "page") {
    const pageSteps = visible.filter((s) => s.path === pathname && !NON_PAGE_CHAPTERS.includes(s.chapter));
    if (pageSteps.length > 0) return pageSteps;
  }
  return visible;
}

// ¿Esta página tiene un tutorial propio?
export function pagesWithTour(allSteps) {
  return new Set(allSteps.filter((s) => !NON_PAGE_CHAPTERS.includes(s.chapter)).map((s) => s.path));
}

// Contenido que realmente se muestra en este tamaño de pantalla
export function stepBody(step, mobile) {
  return mobile && step.mobileBody ? step.mobileBody : step.body;
}

export function progressPercent(index, total) {
  if (total <= 0) return 0;
  return Math.round(((index + 1) / total) * 100);
}

// ------------------------------------------------------------ Texto con formato
// "Usa **negrita** aquí"  ->  [{ text: "Usa ", bold: false }, { text: "negrita", bold: true }, ...]
export function parseRichText(text) {
  return String(text ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) =>
      paragraph
        .split("**")
        .map((chunk, i) => ({ text: chunk, bold: i % 2 === 1 }))
        .filter((part) => part.text !== "")
    )
    .filter((parts) => parts.length > 0);
}

// ------------------------------------------------------------ Dónde va la tarjeta
const OPPOSITE = { top: "bottom", bottom: "top", left: "right", right: "left" };
const clamp = (n, min, max) => Math.min(Math.max(n, min), Math.max(min, max));

// rect = zona resaltada en coordenadas de la ventana: { top, left, width, height } (o null si no hay elemento)
// tip  = tamaño de la tarjeta: { w, h }
// Devuelve:
//   { mode: "center" }                        tarjeta en el centro (pasos sin elemento)
//   { mode: "dock" }                          tarjeta pegada abajo (celulares o elementos enormes)
//   { mode: "float", side, top, left, width, arrow }   tarjeta junto al elemento
export function computePlacement({ rect, tip, vw, vh, prefer = "bottom", gap = 16, margin = 12 }) {
  if (!rect) return { mode: "center" };
  if (vw < DOCK_MAX_WIDTH) return { mode: "dock" };

  const w = Math.min(tip.w, vw - margin * 2);
  const h = tip.h;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const right = rect.left + rect.width;
  const bottom = rect.top + rect.height;

  // "fits" = la tarjeta queda completa dentro de la pantalla en ese lado
  const inY = (y) => y >= margin && y + h <= vh - margin;
  const inX = (x) => x >= margin && x + w <= vw - margin;
  const options = {
    bottom: { top: bottom + gap, left: clamp(cx - w / 2, margin, vw - margin - w), fits: inY(bottom + gap) },
    top: { top: rect.top - gap - h, left: clamp(cx - w / 2, margin, vw - margin - w), fits: inY(rect.top - gap - h) },
    right: { top: clamp(cy - h / 2, margin, vh - margin - h), left: right + gap, fits: inX(right + gap) },
    left: { top: clamp(cy - h / 2, margin, vh - margin - h), left: rect.left - gap - w, fits: inX(rect.left - gap - w) },
  };

  const order =
    prefer === "auto" || !options[prefer]
      ? ["bottom", "top", "right", "left"]
      : [prefer, OPPOSITE[prefer], ...["bottom", "top", "right", "left"].filter((s) => s !== prefer && s !== OPPOSITE[prefer])];

  for (const side of order) {
    const o = options[side];
    if (!o.fits) continue;
    const vertical = side === "top" || side === "bottom";
    return {
      mode: "float",
      side, // en qué lado del elemento queda la tarjeta
      top: Math.round(o.top),
      left: Math.round(o.left),
      width: w,
      // la flecha apunta al centro del elemento, sin salirse de la tarjeta
      arrow: { edge: OPPOSITE[side], offset: Math.round(vertical ? clamp(cx - o.left, 24, w - 24) : clamp(cy - o.top, 24, h - 24)) },
    };
  }
  return { mode: "dock" };
}

// Ajuste de desplazamiento: si la tarjeta va pegada abajo, el elemento debe quedar en la parte de arriba.
// Devuelve cuántos píxeles hay que desplazar la página (positivo = bajar) o 0 si ya se ve bien.
export function dockScrollDelta({ rect, vh, dockHeight, topOffset = 88, margin = 16 }) {
  if (!rect) return 0;
  const usable = vh - dockHeight - margin;
  const bottom = rect.top + rect.height;
  if (rect.top >= topOffset - 4 && bottom <= usable) return 0; // ya se ve completo encima de la tarjeta
  if (rect.height <= usable - topOffset) return Math.round(rect.top - topOffset); // cabe: lo subimos
  return Math.round(rect.top - 24); // es muy alto: lo dejamos empezando arriba
}
