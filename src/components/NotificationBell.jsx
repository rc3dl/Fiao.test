import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { fetchDashboard } from "@/api/dashboardApi";
import { buildAlerts, badgeText } from "@/lib/alerts";
import { useLanguage } from "@/contexts/LanguageContext";

const MAX_SHOWN = 8;

// La campana del Navbar: avisa de cuentas vencidas y productos que se acaban.
export default function NotificationBell({ defaultOpen = false }) {
    const { t, language } = useLanguage();
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef(null);
  const { data, isLoading, isError } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard, staleTime: 60_000 });

  const enabled = data?.settings?.notifications_enabled ?? true;
  const alerts = useMemo(() => (data && enabled ? buildAlerts(data, language) : []), [data, enabled, language]);

  // Cerrar al hacer clic fuera o con la tecla Esc
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

  const dot = { overdue: "var(--bad-text)", stock: "var(--warn-text)" };

  return (
    <div data-tour="bell" ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={alerts.length ? t(`Notifications (${alerts.length})`) : t("Notifications")}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition"
      >
        <Bell className="w-4 h-4 text-white" />
        {alerts.length > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ backgroundColor: "#F9D103", color: "#2D2926" }}
          >
            {badgeText(alerts.length)}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("Notifications")}
          className="absolute right-0 top-full mt-3 z-50 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl overflow-hidden"
          style={{ backgroundColor: "var(--white)", border: "1px solid var(--border-cream)", boxShadow: "0 16px 40px rgba(0,0,0,0.3)" }}
        >
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-cream)" }}>
            <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{t("Notifications")}</p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--text-muted)" }}>{t("Loading...")}</p>
            ) : isError ? (
              <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--bad-text)" }}>{t("Could not load your alerts.")}</p>
            ) : !enabled ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>{t("Notifications are turned off.")}</p>
                <Link to="/profile" onClick={() => setOpen(false)} className="text-sm font-semibold" style={{ color: "var(--accent-text)" }}>
                  {t("Turn them on in Profile")}
                </Link>
              </div>
            ) : alerts.length === 0 ? (
              <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--text-muted)" }}>{t("You're all caught up. 🎉")}</p>
            ) : (
              <>
                {alerts.slice(0, MAX_SHOWN).map((a) => (
                  <Link key={a.id} to={a.to} onClick={() => setOpen(false)} className="flex items-start gap-3 px-4 py-3 hover:bg-black/5" style={{ borderBottom: "1px solid var(--border-cream)" }}>
                    <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: dot[a.type] }} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold" style={{ color: "var(--text)" }}>{t(a.title)}</span>
                      <span className="block text-xs" style={{ color: "var(--text-muted)" }}>{t(a.detail)}</span>
                    </span>
                  </Link>
                ))}
                {alerts.length > MAX_SHOWN && (
                  <p className="px-4 py-3 text-xs text-center" style={{ color: "var(--text-faint)" }}>
                    +{alerts.length - MAX_SHOWN} {t("more. See Clients and Products for the full list.")}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}