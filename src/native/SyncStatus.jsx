import React, { useSyncExternalStore } from "react";
import { WifiOff, RefreshCw, AlertTriangle, Download, CheckCircle2, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSyncState } from "@/offline/useSyncState";
import { getEngine, syncNow } from "@/offline";
import { queryClientInstance } from "@/lib/query-client";
import { money } from "@/lib/credit";
import { describeOp, conflictLines, timeAgo } from "@/native/describeOp";
import { subscribeUpdate, getUpdateState, checkForUpdate, downloadUpdate } from "@/native/updates";

export const useUpdateState = () => useSyncExternalStore(subscribeUpdate, getUpdateState);

// Indicador pequeño arriba a la izquierda. Solo aparece cuando hay algo que saber (sin conexión, enviando, por revisar...).
export function SyncPill({ onOpen }) {
  const { t } = useLanguage();
  const s = useSyncState();
  const update = useUpdateState();
  const review = s.conflicts + s.rejected;

  let tone = null;
  let text = "";
  let Icon = RefreshCw;
  if (review > 0) {
    tone = "warn";
    text = `${review} ${t("to review")}`;
    Icon = AlertTriangle;
  } else if (!s.online) {
    tone = "off";
    text = s.pending ? `${t("Offline")} · ${s.pending}` : t("Offline");
    Icon = WifiOff;
  } else if (s.flushing || s.pending > 0) {
    tone = "sync";
    text = s.pending ? `${t("Syncing")} · ${s.pending}` : t("Syncing");
  } else if (update.status === "available") {
    tone = "update";
    text = t("Update available");
    Icon = Download;
  }
  if (!tone) return null;

  return (
    <button type="button" onClick={onOpen} className={`fiao-pill fiao-pill-${tone}`} aria-label={t("Sync")}>
      <Icon className={`w-3.5 h-3.5 ${tone === "sync" ? "animate-spin" : ""}`} aria-hidden="true" />
      <span>{text}</span>
    </button>
  );
}

function Row({ title, subtitle, children }) {
  return (
    <div className="p-3 rounded-2xl" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-cream)" }}>
      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{title}</p>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-5">
      <h3 className="text-[11px] font-bold tracking-[0.12em] uppercase mb-2" style={{ color: "var(--text-muted)" }}>{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

// Panel de sincronización: conexión, pendientes, conflictos, historial y actualizaciones.
export function SyncSheet({ open, onClose }) {
  const { t, language } = useLanguage();
  const s = useSyncState();
  const update = useUpdateState();
  if (!open) return null;

  const engine = getEngine();
  const act = async (fn) => {
    await fn();
    queryClientInstance.invalidateQueries();
  };
  const attention = s.ops.filter((o) => o.status === "conflict" || o.status === "rejected");
  const pending = s.ops.filter((o) => o.status === "pending" || o.status === "syncing");
  const recent = s.ops.filter((o) => o.status === "applied").slice(0, 8);
  const notes = update.latest ? (language === "es" ? update.latest.notes_es : update.latest.notes_en) : null;

  return (
    <div className="fiao-sheet-backdrop" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={t("Sync")} className="fiao-sheet" onClick={(e) => e.stopPropagation()}>
        <span className="fiao-grab" aria-hidden="true" />
        <div className="flex items-center justify-between mb-3">
          <h2 className="fiao-sheet-title" style={{ marginBottom: 0 }}>{t("Sync")}</h2>
          <button type="button" onClick={onClose} aria-label={t("Close")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--surface)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text)" }} />
          </button>
        </div>

        <Row
          title={s.online ? t("Connected") : t("Offline")}
          subtitle={
            s.online
              ? `${t("Last sync")}: ${timeAgo(s.lastSyncAt, language) || t("Never")}`
              : t("You are offline. Changes are saved on this phone and sent when the connection returns.")
          }
        >
          <button type="button" onClick={syncNow} disabled={s.flushing || !engine} className="fiao-btn mt-3 w-full px-4 disabled:opacity-60" style={{ backgroundColor: "#F9D103", color: "var(--on-yellow)" }}>
            {s.flushing ? t("Syncing") : t("Sync now")}
          </button>
        </Row>

        {attention.length > 0 && (
          <Section title={t("Needs your attention")}>
            {attention.map((op) => (
              <Row key={op.id} title={describeOp(op, language, money)} subtitle={op.status === "conflict" ? t("Changed on another device") : op.last_error}>
                {op.status === "conflict" && (
                  <ul className="mt-2 space-y-1">
                    {conflictLines(op).map((line) => (
                      <li key={line.field} className="text-xs" style={{ color: "var(--text-muted)" }}>
                        <b>{line.field}</b>: {String(line.mine)} <span style={{ color: "var(--text-faint)" }}>({t("Server")}: {String(line.server)})</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {op.status === "conflict" ? (
                    <>
                      <button type="button" className="fiao-btn fiao-btn-ghost px-2" onClick={() => act(() => engine.resolveConflict(op.id, "server"))}>{t("Keep server version")}</button>
                      <button type="button" className="fiao-btn px-2" style={{ backgroundColor: "#B91C1C", color: "#fff" }} onClick={() => act(() => engine.resolveConflict(op.id, "mine"))}>{t("Use my version")}</button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="fiao-btn fiao-btn-ghost px-2" onClick={() => act(() => engine.discard(op.id))}>{t("Discard")}</button>
                      <button type="button" className="fiao-btn px-2" style={{ backgroundColor: "#B91C1C", color: "#fff" }} onClick={() => act(() => engine.retry(op.id))}>{t("Retry")}</button>
                    </>
                  )}
                </div>
              </Row>
            ))}
          </Section>
        )}

        <Section title={t("Pending changes")}>
          {pending.length === 0 ? (
            <p className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
              <CheckCircle2 className="w-4 h-4" style={{ color: "var(--ok-text)" }} /> {t("Nothing pending. Everything is saved in the cloud.")}
            </p>
          ) : (
            pending.map((op) => <Row key={op.id} title={describeOp(op, language, money)} subtitle={t("Saved on this phone")} />)
          )}
        </Section>

        {recent.length > 0 && (
          <Section title={t("Recent changes")}>
            {recent.map((op) => (
              <Row key={op.id} title={describeOp(op, language, money)} subtitle={`${t("Sent")} ${timeAgo(op.synced_at, language)}`} />
            ))}
          </Section>
        )}

        <Section title={t("Updates")}>
          <Row
            title={`${t("Version")} ${update.installed?.name || "—"}`}
            subtitle={
              update.status === "available"
                ? `${t("New version available")}: ${update.latest.version_name}`
                : update.status === "uptodate"
                  ? t("You have the latest version.")
                  : update.status === "error"
                    ? t("Could not check for updates.")
                    : update.status === "checking"
                      ? t("Checking...")
                      : null
            }
          >
            {update.status === "available" && notes && (
              <p className="text-xs mt-2 whitespace-pre-line" style={{ color: "var(--text-muted)" }}><b>{t("What's new")}:</b> {notes}</p>
            )}
            {update.downloadStarted && <p className="text-xs mt-2" style={{ color: "var(--ok-text)" }}>{t("The download started. When it finishes, open it to install. Your data is kept.")}</p>}
            <button
              type="button"
              disabled={update.status === "checking"}
              onClick={update.status === "available" ? downloadUpdate : () => checkForUpdate({ force: true })}
              className="fiao-btn fiao-btn-ghost mt-3 w-full px-4 disabled:opacity-60"
            >
              {update.status === "available" ? t("Download and install") : t("Check for updates")}
            </button>
          </Row>
        </Section>
      </div>
    </div>
  );
}
