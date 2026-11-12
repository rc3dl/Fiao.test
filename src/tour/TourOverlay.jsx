import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  computePlacement,
  parseRichText,
  progressPercent,
  stepBody,
  isMobileWidth,
  DOCK_MAX_WIDTH,
} from "@/tour/tour";
import { getTourUi, localizeTourStep } from "@/tour/tourTranslations";
import { IS_NATIVE } from "@/native/useIsNative";

const PAD = 8; // espacio entre el elemento y el borde amarillo
const CARD_WIDTH = 380; // ancho de la tarjeta (el mismo flotando o pegada abajo)
const FIND_TIMEOUT = 6000; // cuánto espera a que aparezca un elemento (por ejemplo, mientras cargan los datos)
const SETTLED_TIMEOUT = 900; // si la página ya cargó, los elementos que faltan se detectan rápido
const FALLBACK_GRACE = 2000; // cuánto se espera al elemento principal antes de explicar el alternativo
const SETTLED_FALLBACK_GRACE = 300;
const OPTIONAL_TIMEOUT = 250; // pasos opcionales (skipIfMissing) en una página ya cargada: se saltan casi al instante
const POLL_MS = 100;
const FOLLOW_MS = 400; // cada cuánto se revisa si el elemento se movió
const DIM = "rgba(14, 8, 5, 0.66)";

// ---------------------------------------------------------------- utilidades
function isVisible(el) {
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return false;
  const style = getComputedStyle(el);
  return style.visibility !== "hidden" && style.display !== "none";
}

// Busca el primer elemento VISIBLE con data-tour="id" (algunos existen dos veces: versión de escritorio y de celular).
function findTourElement(id) {
  if (!id) return null;
  for (const el of document.querySelectorAll(`[data-tour="${id}"]`)) if (isVisible(el)) return el;
  return null;
}

// Zona segura del sistema (barra de estado / de gestos) en px; vale 0 fuera de la app Android
// ¿El elemento queda fijo en pantalla aunque la página se desplace? (barra pegajosa, botón flotante, barra inferior)
function isPinned(node) {
  for (let el = node; el && el !== document.body; el = el.parentElement) {
    const position = getComputedStyle(el).position;
    if (position === "fixed" || position === "sticky") return true;
  }
  return false;
}

function readInset(name) {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

// ------------------------------------------------------------------ íconos
const Icon = ({ children, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const ArrowRight = () => (
  <Icon size={15}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Icon>
);
const ArrowLeft = () => (
  <Icon size={15}>
    <path d="M19 12H5" />
    <path d="m11 18-6-6 6-6" />
  </Icon>
);
const Close = () => (
  <Icon size={16}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Icon>
);
const Bulb = () => (
  <Icon size={15}>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </Icon>
);

const CSS = `
@keyframes fiaoTourIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes fiaoTourInTop { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
@keyframes fiaoTourFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes fiaoTourRing { 0% { opacity: .75; transform: scale(1); } 100% { opacity: 0; transform: scale(1.06); } }
@keyframes fiaoTourSpin { to { transform: rotate(360deg); } }
.fiao-tour-card { animation: fiaoTourIn .24s ease-out both; }
.fiao-tour-card[data-side="top"] { animation-name: fiaoTourInTop; }
.fiao-tour-loader { animation: fiaoTourFade .2s ease .4s both; }
.fiao-tour-ring { animation: fiaoTourRing 1.8s ease-out infinite; }
.fiao-tour-btn { transition: transform .12s ease, filter .12s ease, background-color .12s ease; cursor: pointer; font-family: inherit; }
.fiao-tour-btn:hover { filter: brightness(1.06); }
.fiao-tour-btn:active { transform: scale(.97); }
.fiao-tour-btn:focus-visible { outline: 3px solid #F9D103; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .fiao-tour-card, .fiao-tour-loader, .fiao-tour-ring, .fiao-tour-btn { animation: none !important; transition: none !important; }
}
`;

// ------------------------------------------------------------- el componente
export default function TourOverlay({ step, index, total, pathname, language = "en", settled, onNext, onBack, onClose, onSkip }) {
  const reduced = usePrefersReducedMotion();
  const ui = getTourUi(language);
  const displayStep = localizeTourStep(step, language);
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [found, setFound] = useState({ stepId: step.id, status: step.target ? "searching" : "center", rect: null, radius: 16, fallback: false });
  const [cardHeight, setCardHeight] = useState(260); // alto de la tarjeta (se mide); el ancho es fijo
  const cardRef = useRef(null);
  const primaryRef = useRef(null);
  const previousFocus = useRef(null);
  const handlers = useRef({});
  handlers.current = { onNext, onBack, onClose, onSkip };

  // Al cambiar de paso, durante un instante el estado guardado todavía es del paso anterior: se ignora
  const view = found.stepId === step.id ? found : { status: step.target ? "searching" : "center", rect: null, radius: 16, fallback: false };

  const mobile = isMobileWidth(vp.w);
  const docked = vp.w < DOCK_MAX_WIDTH;

  // Tamaño de la ventana
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // En celulares la tarjeta va pegada abajo: se da espacio extra al final de la página para poder subir cualquier elemento.
  useEffect(() => {
    if (!docked) return undefined;
    const previous = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "60vh";
    return () => {
      document.body.style.paddingBottom = previous;
    };
  }, [docked]);

  // Buscar el elemento del paso, llevarlo a la vista y seguirlo si la página cambia de tamaño
  useEffect(() => {
    setFound({ stepId: step.id, status: step.target ? "searching" : "center", rect: null, radius: 16, fallback: false });
    if (!step.target) return undefined;

    let cancelled = false;
    let timer = null;
    let frame = 0;
    let element = null;
    let usingFallback = false;
    let resizeObserver = null;
    let follow = null;
    let clicked = !step.before;
    let startedAt = performance.now();
    let patient = false; // true = el elemento ya había aparecido y desapareció: se le da más tiempo para volver

    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    // Deja de seguir al elemento actual
    const detach = () => {
      cancelAnimationFrame(frame);
      clearInterval(follow);
      resizeObserver?.disconnect();
      resizeObserver = null;
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("scroll", scheduleMeasure, true);
    };

    // La página quitó o escondió el elemento (por ejemplo, mientras se recargan los datos): se vuelve a buscar
    const lose = () => {
      detach();
      clearTimeout(timer);
      element = null;
      usingFallback = false;
      patient = true;
      startedAt = performance.now();
      setFound({ stepId: step.id, status: "searching", rect: null, radius: 16, fallback: false });
      tick();
    };

    const measure = () => {
      if (cancelled || !element) return;
      if (!element.isConnected || !isVisible(element)) return lose();
      const r = element.getBoundingClientRect();
      const radius = Math.min(28, Math.max(10, (parseFloat(getComputedStyle(element).borderTopLeftRadius) || 8) + PAD * 0.6), (r.height + PAD * 2) / 2);
      const rect = { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
      setFound((prev) => {
        const same =
          prev.stepId === step.id && prev.status === "found" && prev.fallback === usingFallback && prev.radius === radius && prev.rect &&
          Math.abs(prev.rect.top - rect.top) < 0.5 && Math.abs(prev.rect.left - rect.left) < 0.5 &&
          Math.abs(prev.rect.width - rect.width) < 0.5 && Math.abs(prev.rect.height - rect.height) < 0.5;
        return same ? prev : { stepId: step.id, status: "found", radius, fallback: usingFallback, rect, pinned: isPinned(element) };
      });
    };

    const reveal = (node) => {
      element = node;
      node.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
      // (En celular, después se acomoda la página para que el elemento quede libre de la tarjeta: ver más abajo)
      measure();
      if (!element) return; // la página lo quitó justo ahora: ya se está buscando de nuevo
      resizeObserver = new ResizeObserver(scheduleMeasure);
      resizeObserver.observe(node);
      resizeObserver.observe(document.body);
      window.addEventListener("resize", scheduleMeasure);
      window.addEventListener("scroll", scheduleMeasure, true);
      follow = setInterval(measure, FOLLOW_MS); // por si la página mueve el elemento sin cambiar de tamaño
    };

    const tick = () => {
      if (cancelled) return;
      // Esperando a que el tutorial termine de cambiar de página
      if (pathname !== step.path) {
        timer = setTimeout(tick, POLL_MS);
        return;
      }
      // Acción previa: por ejemplo, abrir la pestaña correcta
      if (!clicked) {
        const button = findTourElement(step.before.click);
        if (button) {
          button.click();
          clicked = true;
          timer = setTimeout(tick, 80);
          return;
        }
      }
      const options = mobile && step.mobileTarget ? [step.mobileTarget, step.target] : [step.target];
      const node = options.map(findTourElement).find(Boolean);
      // La página está en su estado vacío (por ejemplo, sin clientes): los pasos opcionales se saltan sin esperar
      if (!node && step.skipIfMissing && settled.has(`empty:${step.path}`)) {
        handlers.current.onSkip();
        return;
      }
      if (node && clicked) {
        settled.add(step.path);
        reveal(node);
        return;
      }
      const elapsed = performance.now() - startedAt;
      const isSettled = settled.has(step.path);

      // El elemento principal no aparece: si existe el alternativo, se explica ese (tras una breve espera por si todavía carga)
      const alt = step.fallback ? findTourElement(step.fallback.target) : null;
      const grace = step.fallback?.graceMs ?? (isSettled ? SETTLED_FALLBACK_GRACE : FALLBACK_GRACE);
      if (alt && clicked && elapsed > grace) {
        settled.add(step.path);
        settled.add(`empty:${step.path}`);
        usingFallback = true;
        reveal(alt);
        return;
      }
      const limit = isSettled && !patient ? (step.skipIfMissing ? OPTIONAL_TIMEOUT : SETTLED_TIMEOUT) : FIND_TIMEOUT;
      if (elapsed > limit) {
        settled.add(step.path);
        if (step.skipIfMissing) {
          handlers.current.onSkip();
          return;
        }
        // Se explica con una tarjeta centrada, pero se sigue vigilando por si el elemento aparece más tarde
        setFound((prev) => (prev.status === "missing" && prev.stepId === step.id ? prev : { stepId: step.id, status: "missing", rect: null, radius: 16, fallback: false }));
        timer = setTimeout(tick, 500);
        return;
      }
      timer = setTimeout(tick, POLL_MS);
    };
    tick();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      detach();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id, pathname, mobile]);

  // Medir el alto de la tarjeta para colocarla bien.
  // La tarjeta flotante y la pegada abajo tienen el MISMO ancho, así que su alto es el mismo
  // y la decisión no puede ir y volver sin parar entre una y otra.
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const h = el.getBoundingClientRect().height;
    if (Math.abs(h - cardHeight) > 1.5) setCardHeight(h);
  });

  // Celular: la tarjeta va pegada abajo (arriba solo si el elemento está fijo en la parte baja, como la barra inferior).
  // La página se desplaza para que el elemento quede siempre en la zona libre, sin quedar tapado por la tarjeta.
  useEffect(() => {
    if (!docked || view.status !== "found" || !view.rect || view.pinned) return;
    const header = document.querySelector("header");
    const headerBottom = header && ["sticky", "fixed"].includes(getComputedStyle(header).position) ? header.getBoundingClientRect().bottom : 0;
    const top = Math.max(readInset("--sat"), headerBottom) + 12;
    const bottom = vp.h - readInset("--sab") - cardHeight - 12 - 16; // 12 = margen de la tarjeta, 16 = un poco de aire
    const { top: t, height: h } = view.rect;
    if (t >= top && t + h <= bottom) return;
    const free = bottom - top;
    const delta = h <= free ? t - (top + (free - h) / 2) : t - top;
    if (Math.abs(delta) > 2) window.scrollBy(0, delta);
  }, [docked, view.status, view.rect?.top, view.rect?.height, view.pinned, cardHeight, vp.h]);

  // Teclado: flechas, Escape y Tab dentro de la tarjeta
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handlers.current.onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handlers.current.onNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlers.current.onBack();
      } else if (e.key === "Tab" && cardRef.current) {
        const items = [...cardRef.current.querySelectorAll("button:not([disabled])")];
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (!cardRef.current.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Foco: al abrir y en cada paso va al botón principal; al cerrar vuelve a donde estaba
  useEffect(() => {
    previousFocus.current = document.activeElement;
    return () => previousFocus.current?.focus?.({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (view.status !== "searching") primaryRef.current?.focus({ preventScroll: true });
  }, [step.id, view.status]);

  // -------------------------------------------------------- qué se muestra
  const isIntro = step.type === "intro";
  const isOutro = step.type === "outro";
  const isLast = index === total - 1;
  const alt = view.fallback && displayStep.fallback ? displayStep.fallback : null;
  const missing = view.status === "missing";
  const content = {
    title: alt?.title ?? displayStep.title,
    body:
      alt?.body ??
      (missing && displayStep.missingBody ? displayStep.missingBody : IS_NATIVE && displayStep.nativeBody ? displayStep.nativeBody : stepBody(displayStep, mobile)),
    tip: alt ? undefined : IS_NATIVE && displayStep.nativeTip ? displayStep.nativeTip : displayStep.tip,
  };
  const placement = computePlacement({
    rect: view.status === "found" ? view.rect : null,
    tip: { w: CARD_WIDTH, h: cardHeight },
    vw: vp.w,
    vh: vp.h,
    prefer: step.placement ?? "bottom",
    insetTop: readInset("--sat"),
    insetBottom: readInset("--sab"),
    dockSide: view.status === "found" && view.pinned && view.rect.top + view.rect.height / 2 > vp.h / 2 ? "top" : "bottom",
  });
  const searching = view.status === "searching";

  // -------------------------------------------------------------- estilos
  const cardBase = {
    background: "var(--white, #fff)",
    color: "var(--text, #2D2926)",
    border: "1px solid var(--border-cream, #F0E6C5)",
    borderRadius: 20,
    boxShadow: "0 24px 60px rgba(0,0,0,0.38), 0 2px 8px rgba(0,0,0,0.12)",
    pointerEvents: "auto",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };
  let cardStyle;
  if (placement.mode === "float") {
    cardStyle = { ...cardBase, position: "absolute", top: placement.top, left: placement.left, width: placement.width };
  } else if (placement.mode === "dock") {
    cardStyle = {
      ...cardBase, position: "absolute", left: 12, right: 12, margin: "0 auto", width: `min(${CARD_WIDTH}px, calc(100vw - 24px))`,
      ...(placement.side === "top" ? { top: "calc(12px + var(--sat, 0px))" } : { bottom: "calc(12px + var(--sab, 0px))" }),
      maxHeight: "calc(100vh - 24px - var(--sat, 0px) - var(--sab, 0px))", overflowY: "auto",
    };
  } else {
    cardStyle = { ...cardBase, width: "min(460px, calc(100vw - 32px))", maxHeight: "calc(100vh - 32px)", overflowY: "auto" };
  }

  const arrow = placement.mode === "float" ? placement.arrow : null;
  const arrowStyle = arrow && {
    position: "absolute",
    width: 14,
    height: 14,
    background: "var(--white, #fff)",
    transform: "rotate(45deg)",
    borderStyle: "solid",
    borderColor: "var(--border-cream, #F0E6C5)",
    // Solo se ven los dos bordes que miran hacia afuera (orden: arriba, derecha, abajo, izquierda)
    ...(arrow.edge === "top" && { top: -8, left: arrow.offset - 7, borderWidth: "1px 0 0 1px" }),
    ...(arrow.edge === "bottom" && { bottom: -8, left: arrow.offset - 7, borderWidth: "0 1px 1px 0" }),
    ...(arrow.edge === "left" && { left: -8, top: arrow.offset - 7, borderWidth: "0 0 1px 1px" }),
    ...(arrow.edge === "right" && { right: -8, top: arrow.offset - 7, borderWidth: "1px 1px 0 0" }),
  };

  const btn = { border: "none", borderRadius: 999, padding: "10px 18px", fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 };
  const ease = "cubic-bezier(.4,0,.2,1)";
  const t = reduced ? "none" : `top .34s ${ease}, left .34s ${ease}, width .34s ${ease}, height .34s ${ease}, border-radius .34s ${ease}`;

  const card = (
    <div
      ref={cardRef}
      key={step.id}
      className="fiao-tour-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fiao-tour-title"
      aria-describedby="fiao-tour-body"
      data-tour-card=""
      data-mode={placement.mode}
      data-side={placement.side}
      style={cardStyle}
    >
      {arrowStyle && <span style={arrowStyle} />}

      {/* barra de progreso */}
      <div style={{ height: 5, background: "var(--border-cream, #F0E6C5)", borderRadius: "20px 20px 0 0", overflow: "hidden" }} aria-hidden="true">
        <div style={{ width: `${progressPercent(index, total)}%`, height: "100%", background: "#F9D103", transition: reduced ? "none" : "width .3s ease" }} />
      </div>

      <div style={{ padding: "16px 20px 18px" }}>
        {/* encabezado */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ background: "#B91C1C", color: "#fff", fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 999 }}>
            {displayStep.chapter}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted, #6B6357)", fontWeight: 600 }} data-tour-counter="">
            {ui.stepOf(index + 1, total)}
          </span>
          <button type="button" onClick={onClose} aria-label={ui.closeTour} className="fiao-tour-btn"
            style={{ marginLeft: "auto", background: "transparent", border: "none", color: "var(--text-muted, #6B6357)", width: 30, height: 30, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
            <Close />
          </button>
        </div>

        <h2 id="fiao-tour-title" style={{ margin: "0 0 8px", fontSize: 19, lineHeight: 1.25, fontWeight: 700, fontFamily: "Poppins, system-ui, sans-serif", color: "var(--text, #2D2926)" }}>
          {content.title}
        </h2>

        <div id="fiao-tour-body" style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-muted, #6B6357)" }}>
          {parseRichText(content.body).map((parts, i) => (
            <p key={i} style={{ margin: i === 0 ? 0 : "8px 0 0" }}>
              {parts.map((part, j) =>
                part.bold ? (
                  <strong key={j} style={{ color: "var(--text, #2D2926)", fontWeight: 700 }}>{part.text}</strong>
                ) : (
                  <React.Fragment key={j}>{part.text}</React.Fragment>
                )
              )}
            </p>
          ))}
        </div>

        {content.tip && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 12, padding: "10px 12px", borderRadius: 12, background: "var(--warn-bg, #FEF3C7)", color: "var(--warn-text, #92400E)", fontSize: 12.5, lineHeight: 1.5 }} data-tour-tip="">
            <span style={{ marginTop: 1, flexShrink: 0 }}><Bulb /></span>
            <span>{content.tip}</span>
          </div>
        )}

        {/* botones */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
          {isIntro ? (
            <button type="button" onClick={onClose} className="fiao-tour-btn" style={{ background: "transparent", border: "none", color: "var(--text-muted, #6B6357)", fontSize: 13, fontWeight: 600, padding: "10px 4px" }}>
              {ui.maybeLater}
            </button>
          ) : !isOutro ? (
            <button type="button" onClick={onClose} className="fiao-tour-btn" style={{ background: "transparent", border: "none", color: "var(--text-muted, #6B6357)", fontSize: 13, fontWeight: 600, padding: "10px 4px" }}>
              {ui.skipTour}
            </button>
          ) : null}

          <span style={{ flex: 1 }} />

          {index > 0 && (
            <button type="button" onClick={onBack} className="fiao-tour-btn" style={{ ...btn, background: "var(--surface, #FFFBEB)", color: "var(--text, #2D2926)", border: "1px solid var(--border-cream, #F0E6C5)" }}>
              <ArrowLeft /> {ui.back}
            </button>
          )}
          <button
            ref={primaryRef}
            type="button"
            onClick={onNext}
            className="fiao-tour-btn"
            data-tour-primary=""
            style={{ ...btn, background: isLast ? "#F9D103" : "#B91C1C", color: isLast ? "#2D2926" : "#fff" }}
          >
            {isIntro ? ui.startTour : isLast ? ui.finish : ui.next} {!isLast && <ArrowRight />}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <div data-tour-overlay="" data-step={step.id} data-status={view.status} style={{ position: "fixed", inset: 0, zIndex: 100000, overflow: "hidden" }}>
      <style>{CSS}</style>

      {/* Capa que bloquea los clics sobre la página mientras dura el tutorial */}
      <div style={{ position: "absolute", inset: 0, background: view.status === "found" ? "transparent" : DIM }} onClick={(e) => e.stopPropagation()} />

      {/* Zona resaltada */}
      {view.status === "found" && view.rect && (
        <>
          <div
            data-tour-spot=""
            style={{
              position: "absolute",
              top: view.rect.top,
              left: view.rect.left,
              width: view.rect.width,
              height: view.rect.height,
              borderRadius: view.radius,
              boxShadow: `0 0 0 100vmax ${DIM}, 0 0 0 3px #F9D103, 0 0 26px 4px rgba(249, 209, 3, 0.5)`,
              transition: t,
              pointerEvents: "none",
            }}
          />
          <div
            className="fiao-tour-ring"
            style={{ position: "absolute", top: view.rect.top, left: view.rect.left, width: view.rect.width, height: view.rect.height, borderRadius: view.radius, border: "2px solid #F9D103", pointerEvents: "none" }}
          />
        </>
      )}

      {/* Buscando el elemento (por ejemplo, mientras carga la página) */}
      {searching && (
        <div className="fiao-tour-loader" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ ...cardBase, borderRadius: 999, padding: "10px 18px", display: "inline-flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "var(--text-muted, #6B6357)" }}>
            <span style={{ width: 16, height: 16, borderRadius: 999, border: "2px solid var(--border-cream, #F0E6C5)", borderTopColor: "#B91C1C", animation: reduced ? "none" : "fiaoTourSpin .8s linear infinite" }} />
            {ui.loading}
          </div>
        </div>
      )}

      {/* La tarjeta */}
      {!searching &&
        (placement.mode === "center" ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, pointerEvents: "none" }}>{card}</div>
        ) : (
          card
        ))}

      {/* Para lectores de pantalla */}
      <div aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {`${ui.stepOf(index + 1, total)}: ${content.title}`}
      </div>
    </div>,
    document.body
  );
}
