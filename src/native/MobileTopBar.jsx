import React from "react";
import { Link } from "react-router-dom";
import { UserCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import NotificationBell from "@/components/NotificationBell";
import { SyncPill } from "@/native/SyncStatus";
import { withBase } from "@/lib/withBase";

// Barra superior de la app Android: pegada arriba, con el logo, el indicador de conexión (solo si hace falta),
// los avisos y el perfil. El idioma y el tema están en "Más".
export default function MobileTopBar({ onOpenSync }) {
  const { t } = useLanguage();
  return (
    <header className="fiao-topbar">
      <Link to="/dashboard" aria-label={t("nav.home")} className="flex items-center flex-shrink-0">
        <img src={withBase("/Logo-fiao-120x40.svg")} alt="FIA'O" className="h-7 w-auto select-none" draggable={false} />
      </Link>
      <div className="fiao-topbar-mid">
        <SyncPill onOpen={onOpenSync} />
      </div>
      <NotificationBell />
      <Link to="/profile" aria-label={t("nav.profile")} className="fiao-icon-btn">
        <UserCircle className="w-6 h-6 text-white" />
      </Link>
    </header>
  );
}
