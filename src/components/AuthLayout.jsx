import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { withBase } from "@/lib/withBase";
import { IS_NATIVE } from "@/native/useIsNative";

export default function AuthLayout({ icon: Icon, title, subtitle, footer = null, children }) {
  const { t, language, toggleLanguage } = useLanguage();
  const { pathname } = useLocation();
  const es = language === "es";
  const year = new Date().getFullYear();

  // Android conserva su composición nativa y su panel inferior; solo cambian los métodos de acceso.
  if (IS_NATIVE) {
    return (
      <div className="fiao-auth">
        <div className="fiao-auth-hero">
          {pathname !== "/login" && (
            <Link to="/login" className="fiao-auth-back" aria-label={t("common.back")}>
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
          )}
          <img src={withBase("/Logo-fiao-300x100.svg")} alt="FIA'O" className="fiao-auth-logo select-none" draggable={false} />
          <p className="fiao-auth-tagline">{t("Your credit notebook, now digital.")}</p>
        </div>
        <div className="fiao-auth-panel bg-card">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary">
              <Icon className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground">{title}</h1>
              {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {children}
          {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
        </div>
      </div>
    );
  }

  const highlights = es
    ? ["Clientes y fiados organizados", "Inventario y ventas bajo control", "Informes claros de tu negocio"]
    : ["Organized customers and credit", "Inventory and sales under control", "Clear business reports"];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F6F2E8] px-4 py-6 sm:px-6 sm:py-8">
      <div aria-hidden="true" className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-[#F9D103]/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[#B91C1C]/10 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_80px_rgba(45,41,38,0.12)] lg:min-h-[700px] lg:grid-cols-[0.88fr_1.12fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex" style={{ backgroundColor: "#B91C1C" }}>
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/10" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full border border-white/10" />
          <div className="relative">
            <Link to="/" aria-label="FIA'O, inicio">
              <img src={withBase("/Logo-fiao-200x67.svg")} alt="FIA'O" className="h-12 w-auto" />
            </Link>
          </div>

          <div className="relative max-w-sm">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#F9D103]">
              {es ? "Tu negocio, más organizado" : "A more organized business"}
            </span>
            <h2 className="mt-4 text-4xl font-bold leading-tight" style={{ fontFamily: "Poppins" }}>
              {es ? "Tus cuentas claras. Tu negocio en orden." : "Clear accounts. A business in order."}
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-white/80">
              {es
                ? "Accede a FIA'O para llevar el control de tus clientes, fiados, pagos e inventario desde un solo lugar."
                : "Sign in to FIA'O and manage customers, credit, payments, and inventory in one place."}
            </p>
            <ul className="mt-8 space-y-4">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium text-white/90">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[#F9D103]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-xs text-white/55">© {year} FIA'O</p>
        </aside>

        <main className="flex items-center bg-white px-5 py-7 sm:px-10 sm:py-10 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-7 flex items-center justify-between">
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {es ? "Volver al inicio" : "Back to home"}
              </Link>
              <button
                type="button"
                onClick={toggleLanguage}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                aria-label={es ? "Cambiar idioma" : "Change language"}
              >
                {es ? "ESP" : "ENG"}
              </button>
            </div>

            <Link to="/" aria-label="FIA'O, inicio" className="mb-7 flex justify-center lg:hidden">
              <img src={withBase("/Logo-fiao-200x67.svg")} alt="FIA'O" className="h-11 w-auto" />
            </Link>

            <div className="mb-7 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "#FFF4B8", color: "#8B6500" }}>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[#2D2926]" style={{ fontFamily: "Poppins" }}>{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
            </div>

            <div>{children}</div>

            {footer && <p className="mt-6 text-center text-sm leading-relaxed text-slate-500">{footer}</p>}

            <div className="mt-7 flex items-center justify-center gap-4 border-t border-slate-100 pt-5 text-xs text-slate-400">
              <Link to="/privacy" className="transition hover:text-slate-600">{es ? "Privacidad" : "Privacy"}</Link>
              <span aria-hidden="true">·</span>
              <Link to="/terms" className="transition hover:text-slate-600">{es ? "Términos" : "Terms"}</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
