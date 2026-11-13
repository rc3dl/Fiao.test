import React from "react";
import { Link } from "react-router-dom";
import { BarChart3, Mail, UserCircle, Globe, Moon, Sun, Compass, ChevronRight, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTour } from "@/tour/TourProvider";
import { getTourUi } from "@/tour/tourTranslations";

const SECTIONS = [
  { path: "/reports", icon: BarChart3, label: "nav.reports" },
  { path: "/contact", icon: Mail, label: "nav.contact" },
  { path: "/profile", icon: UserCircle, label: "nav.profile" },
];

// Panel "Más": secciones secundarias y ajustes rápidos.
export default function MoreSheet({ open, onClose }) {
  const { t, language, toggleLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { canStart, pageTourAvailable, start } = useTour();
  const ui = getTourUi(language);

  if (!open) return null;

  const row = "fiao-row";
  const tour = (scope) => {
    onClose();
    start(scope);
  };

  return (
    <div className="fiao-sheet-backdrop" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={t("More")} className="fiao-sheet" onClick={(e) => e.stopPropagation()}>
        <span className="fiao-grab" aria-hidden="true" />
        <h2 className="fiao-sheet-title">{t("More")}</h2>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {SECTIONS.map(({ path, icon: Icon, label }) => (
            <Link key={path} to={path} onClick={onClose} className="fiao-tile">
              <span className="fiao-tile-icon"><Icon className="w-5 h-5 text-white" /></span>
              <span className="text-[13px] font-bold" style={{ color: "var(--text)" }}>{t(label)}</span>
            </Link>
          ))}
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              window.dispatchEvent(new CustomEvent("fiao:open-sync"));
            }}
            className={row}
          >
            <RefreshCw className="w-5 h-5" style={{ color: "var(--accent-text)" }} />
            <span className="flex-1 text-left">{t("Sync and updates")}</span>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>
          <button type="button" onClick={toggleLanguage} className={row}>
            <Globe className="w-5 h-5" style={{ color: "var(--accent-text)" }} />
            <span className="flex-1 text-left">{language === "es" ? "Español · English" : "English · Español"}</span>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>
          <button type="button" onClick={toggleTheme} className={row}>
            {isDark ? <Sun className="w-5 h-5" style={{ color: "var(--accent-text)" }} /> : <Moon className="w-5 h-5" style={{ color: "var(--accent-text)" }} />}
            <span className="flex-1 text-left">{isDark ? t("nav.lightMode") : t("nav.darkMode")}</span>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>
          {canStart && pageTourAvailable && (
            <button type="button" onClick={() => tour("page")} className={row}>
              <Compass className="w-5 h-5" style={{ color: "var(--accent-text)" }} />
              <span className="flex-1 text-left">{ui.pageTour}</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
          )}
          {canStart && (
            <button type="button" onClick={() => tour("all")} className={row}>
              <Compass className="w-5 h-5" style={{ color: "var(--accent-text)" }} />
              <span className="flex-1 text-left">{ui.fullTour}</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
