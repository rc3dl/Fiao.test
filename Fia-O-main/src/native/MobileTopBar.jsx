import React from "react";
import { Link } from "react-router-dom";
import { UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import NotificationBell from "@/components/NotificationBell";
import { withBase } from "@/lib/withBase";

// Barra superior de la app Android: logo, idioma, avisos y perfil.
// La navegación principal vive en la barra inferior (BottomDock).
export default function MobileTopBar() {
  const { isAuthenticated } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="fiao-topbar">
      <Link to={isAuthenticated ? "/dashboard" : "/login"} aria-label={t("FIA'O, inicio")} className="flex items-center">
        <img src={withBase("/Logo-fiao-120x40.svg")} alt="FIA'O" className="h-8 w-auto select-none" />
      </Link>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggleLanguage}
          aria-label={t("nav.language")}
          className="fiao-chip"
        >
          {language === "es" ? "ES" : "EN"}
        </button>
        {isAuthenticated && (
          <>
            <NotificationBell />
            <Link to="/profile" aria-label={t("nav.profile")} className="fiao-icon-btn">
              <UserCircle className="w-6 h-6 text-white" />
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
