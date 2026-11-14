import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Moon, Sun, UserCircle } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import NotificationBell from "@/components/NotificationBell";
import { TourButton, TourMobileItems } from "@/tour/TourButton";
import { withBase } from "@/lib/withBase";
import { IS_NATIVE } from "@/native/useIsNative";

const NAV_ITEMS = [
  { key: "home", path: "/", authPath: "/dashboard" },
  { key: "credit", path: "/credit", authPath: "/credit" },
  { key: "products", path: "/products", authPath: "/products" },
  { key: "clients", path: "/clients", authPath: "/clients" },
  { key: "reports", path: "/reports", authPath: "/reports" },
  { key: "contact", path: "/contact", authPath: "/contact" },
];

const PUBLIC_ITEMS = [
  { target: "#inicio", es: "Inicio", en: "Home" },
  { target: "#como-funciona", es: "Cómo funciona", en: "How it works" },
  { target: "#funciones", es: "Funciones", en: "Features" },
  { target: "#android", es: "Android", en: "Android" },
  { target: "#preguntas", es: "Preguntas", en: "FAQ" },
];

function Logo() {
  const { t } = useLanguage();
  return (
    <Link to="/" className="flex flex-shrink-0 select-none items-center" aria-label={t("FIA'O, inicio")}>
      <img src={withBase("/Logo-fiao-120x40.svg")} alt="FIA'O" className="h-8 w-auto sm:h-10" />
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const homePath = isAuthenticated ? "/dashboard" : "/";
  const es = language === "es";

  const publicTarget = (target) => {
    if (target.startsWith("#") && location.pathname !== "/") return "/" + target;
    return target;
  };

  if (IS_NATIVE) return null;

  return (
    <header className="w-full" style={{ backgroundColor: "var(--navbar-bg)" }}>
      <div className="px-3 pb-4 sm:px-6">
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full px-4 py-3 shadow-lg sm:px-6"
          style={{ backgroundColor: "var(--navbar-bg)", boxShadow: "0 8px 24px rgba(0,0,0,0.18)" }}
        >
          <Logo />

          {isAuthenticated ? (
            <>
              <div data-tour="nav-links" className="hidden items-center gap-1.5 lg:flex">
                {NAV_ITEMS.map((item) => {
                  const target = item.key === "home" ? homePath : item.path;
                  const active = location.pathname === target;
                  return (
                    <Link
                      key={item.path}
                      to={target}
                      className="rounded-full px-4 py-2 text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: active ? "#F9D103" : "rgba(249,209,3,0.12)",
                        color: active ? "#2D2926" : "#FFFFFF",
                      }}
                    >
                      {t("nav." + item.key)}
                    </Link>
                  );
                })}
              </div>

              <div className="hidden items-center gap-2 lg:flex">
                <button type="button" onClick={toggleLanguage} className="flex h-8 min-w-10 items-center justify-center rounded-full border border-white/30 px-2 text-xs font-bold text-white transition hover:bg-white/10" aria-label={t("nav.language")} title={t("nav.language")}>
                  {language === "es" ? t("ESP") : t("ENG")}
                </button>
                <NotificationBell />
                <TourButton />
                <button data-tour="theme-toggle" type="button" onClick={toggleTheme} className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10" aria-label={t("nav.toggleTheme")}>
                  {isDark ? <Sun className="h-4 w-4 text-white" /> : <Moon className="h-4 w-4 text-white" />}
                </button>
                <Link data-tour="profile-link" to="/profile" className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10" aria-label={t("Profile")}>
                  <UserCircle className="h-5 w-5 text-white" />
                </Link>
              </div>

              <div className="flex items-center gap-1 lg:hidden">
                <button type="button" onClick={toggleLanguage} className="flex h-9 min-w-10 items-center justify-center rounded-full border border-white/30 px-2 text-xs font-bold text-white" aria-label={t("nav.language")} title={t("nav.language")}>
                  {language === "es" ? t("ESP") : t("ENG")}
                </button>
                <NotificationBell />
                <button data-tour="nav-menu" type="button" className="flex h-9 w-9 items-center justify-center rounded-full text-white" onClick={() => setOpen(!open)} aria-label={t("nav.toggleMenu")} aria-expanded={open}>
                  {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="hidden items-center gap-0.5 xl:flex">
                {PUBLIC_ITEMS.map((item) => (
                  <Link
                    key={item.target}
                    to={publicTarget(item.target)}
                    className="whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/10 hover:text-white 2xl:px-3.5 2xl:text-sm"
                  >
                    {es ? item.es : item.en}
                  </Link>
                ))}
              </div>

              <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
                <button type="button" onClick={toggleLanguage} className="flex h-9 min-w-10 items-center justify-center rounded-full border border-white/30 px-2 text-xs font-bold text-white transition hover:bg-white/10" aria-label={t("nav.language")} title={t("nav.language")}>
                  {es ? "ESP" : "ENG"}
                </button>
                <Link to="/login" className="hidden rounded-full px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10 sm:inline-flex sm:text-sm">
                  {es ? "Iniciar sesión" : "Sign in"}
                </Link>
                <Link to="/register" className="hidden rounded-full px-4 py-2 text-xs font-bold sm:inline-flex sm:text-sm" style={{ backgroundColor: "#F9D103", color: "#2D2926" }}>
                  {es ? "Crear cuenta" : "Sign up"}
                </Link>
                <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full text-white xl:hidden" onClick={() => setOpen(!open)} aria-label={es ? "Abrir menú" : "Open menu"} aria-expanded={open}>
                  {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </>
          )}
        </nav>

        {open && isAuthenticated && (
          <div className="mx-auto mt-2 flex max-w-6xl flex-col gap-1.5 rounded-2xl p-3 lg:hidden" style={{ backgroundColor: "var(--navbar-bg)" }}>
            {NAV_ITEMS.map((item) => {
              const target = item.key === "home" ? homePath : item.path;
              const active = location.pathname === target;
              return (
                <Link
                  key={item.path}
                  to={target}
                  onClick={() => setOpen(false)}
                  className="rounded-full px-4 py-2.5 text-center text-sm font-semibold"
                  style={{
                    backgroundColor: active ? "#F9D103" : "rgba(255,255,255,0.08)",
                    color: active ? "#2D2926" : "#FFFFFF",
                  }}
                >
                  {t("nav." + item.key)}
                </Link>
              );
            })}

            <button type="button" onClick={() => { toggleLanguage(); setOpen(false); }} className="flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10" aria-label={t("nav.language")}>
              {language === "es" ? "ESP · Español" : "ENG · English"}
            </button>
            <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
              <UserCircle className="h-4 w-4" />{t("nav.profile")}
            </Link>
            <TourMobileItems onDone={() => setOpen(false)} />
            <button type="button" onClick={() => { toggleTheme(); setOpen(false); }} className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10" aria-label={t("nav.toggleTheme")}>
              {isDark ? <><Sun className="h-4 w-4" />{t("nav.lightMode")}</> : <><Moon className="h-4 w-4" />{t("nav.darkMode")}</>}
            </button>
          </div>
        )}

        {open && !isAuthenticated && (
          <div className="mx-auto mt-2 flex max-w-6xl flex-col gap-1.5 rounded-2xl p-3 xl:hidden" style={{ backgroundColor: "var(--navbar-bg)" }}>
            {PUBLIC_ITEMS.map((item) => (
              <Link
                key={item.target}
                to={publicTarget(item.target)}
                onClick={() => setOpen(false)}
                className="rounded-full px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {es ? item.es : item.en}
              </Link>
            ))}
            <div className="mt-1 grid grid-cols-2 gap-2 border-t border-white/15 pt-3">
              <Link to="/login" onClick={() => setOpen(false)} className="rounded-full border border-white/30 px-4 py-2.5 text-center text-sm font-semibold text-white">
                {es ? "Iniciar sesión" : "Sign in"}
              </Link>
              <Link to="/register" onClick={() => setOpen(false)} className="rounded-full px-4 py-2.5 text-center text-sm font-bold" style={{ backgroundColor: "#F9D103", color: "#2D2926" }}>
                {es ? "Crear cuenta" : "Sign up"}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
