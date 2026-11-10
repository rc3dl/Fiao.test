import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Wallet, Users, Package, LayoutGrid } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const TABS = [
  { path: "/dashboard", icon: Home, label: "nav.home" },
  { path: "/credit", icon: Wallet, label: "nav.credit" },
  { path: "/clients", icon: Users, label: "nav.clients" },
  { path: "/products", icon: Package, label: "nav.products" },
];
const MORE_PATHS = ["/reports", "/contact", "/profile"];

// Barra inferior flotante: la pestaña activa se expande en una píldora amarilla con su nombre.
export default function BottomDock({ moreOpen, onMore }) {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const moreActive = moreOpen || MORE_PATHS.includes(pathname);

  return (
    <nav data-tour="nav-menu" className="fiao-dock" aria-label={t("nav.toggleMenu")}>
      {TABS.map(({ path, icon: Icon, label }) => {
        const active = !moreOpen && pathname === path;
        return (
          <Link
            key={path}
            to={path}
            aria-current={active ? "page" : undefined}
            aria-label={t(label)}
            className={`fiao-tab ${active ? "is-active" : ""}`}
          >
            <Icon className="w-[22px] h-[22px] flex-shrink-0" strokeWidth={active ? 2.5 : 2} />
            <span className="fiao-tab-label">{t(label)}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onMore}
        aria-label={t("More")}
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
        className={`fiao-tab ${moreActive ? "is-active" : ""}`}
      >
        <LayoutGrid className="w-[22px] h-[22px] flex-shrink-0" strokeWidth={moreActive ? 2.5 : 2} />
        <span className="fiao-tab-label">{t("More")}</span>
      </button>
    </nav>
  );
}
