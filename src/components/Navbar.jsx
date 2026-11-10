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
import MobileTopBar from "@/native/MobileTopBar";
const NAV_ITEMS = [
  { key: "home", path: "/", authPath: "/dashboard" },
  { key: "credit", path: "/credit", authPath: "/credit" },
  { key: "products", path: "/products", authPath: "/products" },
  { key: "clients", path: "/clients", authPath: "/clients" },
  { key: "reports", path: "/reports", authPath: "/reports" },
  { key: "contact", path: "/contact", authPath: "/contact" },
];


function Logo() {
  const { t } = useLanguage();

  return (
    <Link
      to="/"
      className="flex items-center select-none"
      aria-label={t("FIA'O, inicio")}
    >
      <img
        src={withBase("/Logo-fiao-120x40.svg")}
        alt="FIA'O"
        className="h-8 sm:h-10 w-auto"
      />
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

  // Android: barra superior compacta (la navegación está abajo).
  if (IS_NATIVE) return <MobileTopBar />;

  return (
    <header
      className="w-full"
      style={{ backgroundColor: "var(--navbar-bg)" }}
    >
      {/* Floating navigation */}
      <div className="px-3 sm:px-6 pb-4">
        <nav
          className="mx-auto max-w-6xl rounded-full px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg"
          style={{
            backgroundColor: "var(--navbar-bg)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          }}
        >
          <Logo />

          {isAuthenticated ? (
            <>
              {/* Desktop navigation */}
              <div data-tour="nav-links" className="hidden lg:flex items-center gap-1.5">
                {NAV_ITEMS.map((item) => {
                  const target =
                    item.key === "home" ? homePath : item.path;
                  const active = location.pathname === target;

                  return (
                    <Link
                      key={item.path}
                      to={target}
                      className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: active
                          ? "#F9D103"
                          : "rgba(249,209,3,0.12)",
                        color: active ? "#2D2926" : "#FFFFFF",
                      }}
                    >
                      {t(`nav.${item.key}`)}
                    </Link>
                  );
                })}
              </div>

              {/* Desktop actions */}
              <div className="hidden lg:flex items-center gap-2">
                <button type="button" onClick={toggleLanguage} className="min-w-10 h-8 px-2 rounded-full flex items-center justify-center text-xs font-bold text-white border border-white/30 hover:bg-white/10 transition" aria-label={t("nav.language")} title={t("nav.language")}>
                  {language === "es" ? t("ESP") : t("ENG")}
                </button>
                <NotificationBell />
                <TourButton />

                <button data-tour="theme-toggle"
                  type="button"
                  onClick={toggleTheme}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition"
                  aria-label={t("nav.toggleTheme")}
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-white" />
                  ) : (
                    <Moon className="w-4 h-4 text-white" />
                  )}
                </button>

                <Link data-tour="profile-link"
                  to="/profile"
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition"
                  aria-label={t("Profile")}
                >
                  <UserCircle className="w-5 h-5 text-white" />
                </Link>
              </div>

              {/* Mobile notifications and menu */}
              <div className="lg:hidden flex items-center gap-1">
                <button type="button" onClick={toggleLanguage} className="h-9 min-w-10 px-2 rounded-full flex items-center justify-center text-xs font-bold text-white border border-white/30" aria-label={t("nav.language")} title={t("nav.language")}>
                  {language === "es" ? t("ESP") : t("ENG")}
                </button>
                <NotificationBell />

                <button data-tour="nav-menu"
                  type="button"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                  onClick={() => setOpen(!open)}
                  aria-label={t("nav.toggleMenu")}
                  aria-expanded={open}
                >
                  {open ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
            <button type="button" onClick={toggleLanguage} className="min-w-10 h-9 px-2 rounded-full flex items-center justify-center text-xs font-bold border border-white/30 text-white hover:bg-white/10 transition" aria-label={t("nav.language")} title={t("nav.language")}>
              {language === "es" ? t("ESP") : t("ENG")}
            </button>
            <Link
              to="/login"
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: "#F9D103",
                color: "#2D2926",
              }}
            >
              {t("nav.login")}
            </Link>
            </div>
          )}
        </nav>

        {/* Mobile menu */}
        {open && isAuthenticated && (
          <div
            className="lg:hidden mx-auto max-w-6xl mt-2 rounded-2xl p-3 flex flex-col gap-1.5"
            style={{ backgroundColor: "var(--navbar-bg)" }}
          >
            {NAV_ITEMS.map((item) => {
              const target =
                item.key === "home" ? homePath : item.path;
              const active = location.pathname === target;

              return (
                <Link
                  key={item.path}
                  to={target}
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 rounded-full text-sm font-semibold text-center"
                  style={{
                    backgroundColor: active
                      ? "#F9D103"
                      : "rgba(255,255,255,0.08)",
                    color: active ? "#2D2926" : "#FFFFFF",
                  }}
                >
                  {t(`nav.${item.key}`)}
                </Link>
              );
            })}

            {/* Language selector on mobile */}
            <button type="button" onClick={() => { toggleLanguage(); setOpen(false); }} className="px-4 py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 text-white hover:bg-white/10 transition" aria-label={t("nav.language")}>
              {language === "es" ? t("ESP · Español") : t("ENG · English")}
            </button>

            {/* Profile link */}
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="px-4 py-2.5 rounded-full text-sm font-semibold text-center flex items-center justify-center gap-2"
              style={{
                backgroundColor:
                  location.pathname === "/profile"
                    ? "#F9D103"
                    : "rgba(255,255,255,0.08)",
                color:
                  location.pathname === "/profile"
                    ? "#2D2926"
                    : "#FFFFFF",
              }}
            >
              <UserCircle className="w-4 h-4" />
              {t("nav.profile")}
            </Link>

            <TourMobileItems onDone={() => setOpen(false)} />

            {/* Theme toggle on mobile */}
            <button
              type="button"
              onClick={toggleTheme}
              className="px-4 py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 text-white hover:bg-white/10 transition"
              aria-label={t("nav.toggleTheme")}
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4" />
                  {t("nav.lightMode")}
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  {t("nav.darkMode")}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}