import React, { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

// Hoja de confirmación (reemplaza a window.confirm dentro de la app Android).
export default function ConfirmSheet() {
  const { t } = useLanguage();
  const [req, setReq] = useState(null);

  useEffect(() => {
    const onAsk = (e) => setReq(e.detail);
    window.addEventListener("fiao:confirm", onAsk);
    return () => window.removeEventListener("fiao:confirm", onAsk);
  }, []);

  const answer = (value) => {
    req?.resolve(value);
    setReq(null);
  };

  // El botón "volver" del teléfono cancela la confirmación.
  useEffect(() => {
    if (!req) return undefined;
    const onBack = (e) => {
      e.preventDefault();
      req.resolve(false);
      setReq(null);
    };
    window.addEventListener("fiao:back", onBack);
    return () => window.removeEventListener("fiao:back", onBack);
  }, [req]);

  if (!req) return null;

  return (
    <div className="fiao-sheet-backdrop" style={{ zIndex: 80 }} onClick={() => answer(false)}>
      <div role="alertdialog" aria-modal="true" className="fiao-sheet" onClick={(e) => e.stopPropagation()}>
        <span className="fiao-grab" aria-hidden="true" />
        <p className="text-[15px] font-semibold leading-snug mb-5" style={{ color: "var(--text)" }}>{req.message}</p>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => answer(false)} className="fiao-btn fiao-btn-ghost">{t("Cancel")}</button>
          <button
            type="button"
            onClick={() => answer(true)}
            className="fiao-btn"
            style={{ backgroundColor: req.destructive ? "#B91C1C" : "var(--btn-solid)", color: "#fff" }}
          >
            {req.confirmLabel || t("Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
