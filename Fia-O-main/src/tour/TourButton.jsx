import React, { useEffect, useRef, useState } from "react";
import { useTour } from "@/tour/TourProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTourUi } from "@/tour/tourTranslations";

const HelpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

// El botón "?" de la barra superior (escritorio): abre un pequeño menú con las dos opciones de tutorial.
export function TourButton() {
  const { canStart, pageTourAvailable, start } = useTour();
  const { language } = useLanguage();
  const ui = getTourUi(language);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!canStart) return null;

  const choose = (scope) => {
    setOpen(false);
    start(scope);
  };
  const item = "w-full text-left px-4 py-3 hover:bg-black/5 block";

  return (
    <div ref={ref} className="relative" data-tour="tour-button">
      <button
        type="button"
        // Si esta página no tiene tutorial propio, el botón abre directamente el tutorial completo
        onClick={() => (pageTourAvailable ? setOpen(!open) : choose("all"))}
        aria-label={ui.guidedTour}
        aria-haspopup={pageTourAvailable ? "menu" : undefined}
        aria-expanded={pageTourAvailable ? open : undefined}
        className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition"
      >
        <HelpIcon />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={ui.guidedTour}
          className="absolute right-0 top-full mt-3 z-50 w-64 rounded-2xl overflow-hidden"
          style={{ backgroundColor: "var(--white)", border: "1px solid var(--border-cream)", boxShadow: "0 16px 40px rgba(0,0,0,0.3)" }}
        >
          <button type="button" role="menuitem" onClick={() => choose("page")} className={item} style={{ borderBottom: "1px solid var(--border-cream)" }}>
            <span className="block text-sm font-semibold" style={{ color: "var(--text)" }}>{ui.pageTour}</span>
            <span className="block text-xs" style={{ color: "var(--text-muted)" }}>{ui.pageTourDescription}</span>
          </button>
          <button type="button" role="menuitem" onClick={() => choose("all")} className={item}>
            <span className="block text-sm font-semibold" style={{ color: "var(--text)" }}>{ui.fullTour}</span>
            <span className="block text-xs" style={{ color: "var(--text-muted)" }}>{ui.fullTourDescription}</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Las mismas opciones dentro del menú del celular (la hamburguesa).
export function TourMobileItems({ onDone }) {
  const { canStart, pageTourAvailable, start } = useTour();
  const { language } = useLanguage();
  const ui = getTourUi(language);
  if (!canStart) return null;
  const go = (scope) => {
    onDone?.();
    start(scope);
  };
  const cls = "px-4 py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 text-white hover:bg-white/10 transition";
  return (
    <>
      {pageTourAvailable && (
        <button type="button" onClick={() => go("page")} className={cls}>
          <HelpIcon /> {ui.pageTour}
        </button>
      )}
      <button type="button" onClick={() => go("all")} className={cls}>
        <HelpIcon /> {ui.fullTour}
      </button>
    </>
  );
}

export default TourButton;
