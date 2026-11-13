import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { checkForUpdate, downloadUpdate } from "@/native/updates";
import { useUpdateState } from "@/native/SyncStatus";

const DISMISSED_KEY = "fiao:update-dismissed";

// Aviso de versión nueva. Opcional: hoja con "Más tarde". Obligatoria: pantalla que bloquea hasta actualizar.
export default function UpdateGate({ enabled, online }) {
  const { t, language } = useLanguage();
  const update = useUpdateState();
  const [dismissed, setDismissed] = useState(() => Number(localStorage.getItem(DISMISSED_KEY)) || 0);

  useEffect(() => {
    if (!enabled || !online) return undefined;
    checkForUpdate(); // no repite la consulta si se hizo hace menos de 6 horas
    const id = setInterval(() => checkForUpdate(), 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [enabled, online]);

  const latest = update.latest;
  const show = update.status === "available" && latest && (update.mandatory || Number(latest.version_code) > dismissed);

  if (!show) return null;
  const notes = language === "es" ? latest.notes_es : latest.notes_en;
  const later = () => {
    localStorage.setItem(DISMISSED_KEY, String(latest.version_code));
    setDismissed(Number(latest.version_code));
  };

  return (
    <div className="fiao-sheet-backdrop" data-update-mandatory={update.mandatory ? "" : undefined} style={{ zIndex: update.mandatory ? 95 : 70 }} onClick={update.mandatory ? undefined : later}>
      <div role="alertdialog" aria-modal="true" className="fiao-sheet" onClick={(e) => e.stopPropagation()}>
        <span className="fiao-grab" aria-hidden="true" />
        <div className="flex items-center gap-3 mb-3">
          <span className="fiao-tile-icon"><Download className="w-5 h-5 text-white" /></span>
          <div>
            <h2 className="fiao-sheet-title" style={{ marginBottom: 0 }}>{update.mandatory ? t("Required update") : t("New version available")}</h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("Version")} {latest.version_name}</p>
          </div>
        </div>
        {update.mandatory && <p className="text-sm mb-2" style={{ color: "var(--text)" }}>{t("You need to update to keep using FIA'O.")}</p>}
        {notes && (
          <p className="text-sm whitespace-pre-line mb-3" style={{ color: "var(--text-muted)" }}>
            <b>{t("What's new")}:</b> {notes}
          </p>
        )}
        {update.downloadStarted && <p className="text-xs mb-3" style={{ color: "var(--ok-text)" }}>{t("The download started. When it finishes, open it to install. Your data is kept.")}</p>}
        <div className={`grid gap-3 ${update.mandatory ? "" : "grid-cols-2"}`}>
          {!update.mandatory && <button type="button" onClick={later} className="fiao-btn fiao-btn-ghost">{t("Later")}</button>}
          <button type="button" onClick={downloadUpdate} className="fiao-btn" style={{ backgroundColor: "#B91C1C", color: "#fff" }}>{t("Download and install")}</button>
        </div>
      </div>
    </div>
  );
}
