import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { withBase } from "@/lib/withBase";
import { IS_NATIVE } from "@/native/useIsNative";

function Logo() {
  return (
    <img
      src={withBase("/Logo-fiao-120x40.svg")}
      alt="FIA'O"
      className="h-9 w-auto select-none sm:h-10"
    />
  );
}

export default function Footer() {
  const { language } = useLanguage();
  const es = language === "es";
  if (IS_NATIVE) return null;

  const productLinks = [
    { to: "/#funciones", label: es ? "Funciones" : "Features" },
    { to: "/#como-funciona", label: es ? "Cómo funciona" : "How it works" },
    { to: "/#android", label: es ? "Aplicación Android" : "Android app" },
    { to: "/#preguntas", label: es ? "Preguntas frecuentes" : "FAQ" },
  ];

  return (
    <footer className="w-full" style={{ backgroundColor: "#2D2926" }}>
      <div className="mx-auto max-w-6xl px-6 py-12 sm:py-14">
        <div className="grid gap-10 border-b border-white/15 pb-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link to="/" aria-label="FIA'O, inicio"><Logo /></Link>
            <p className="mt-4 text-sm leading-relaxed text-white/65">
              {es
                ? "Una forma más clara de organizar clientes, fiados, pagos e inventario para pequeños negocios."
                : "A clearer way to organize customers, credit, payments, and inventory for small businesses."}
            </p>
            <Link to="/login" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#F9D103] transition hover:gap-2">
              {es ? "Acceso a tu cuenta" : "Sign in to your account"} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">{es ? "Explora" : "Explore"}</h2>
            <ul className="mt-4 space-y-3">
              {productLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-sm text-white/75 transition hover:text-white">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">{es ? "Información" : "Information"}</h2>
            <ul className="mt-4 space-y-3">
              <li><Link to="/login" className="text-sm text-white/75 transition hover:text-white">{es ? "Soporte para usuarios (iniciar sesión)" : "User support (sign in)"}</Link></li>
              <li><Link to="/privacy" className="text-sm text-white/75 transition hover:text-white">{es ? "Política de privacidad" : "Privacy policy"}</Link></li>
              <li><Link to="/terms" className="text-sm text-white/75 transition hover:text-white">{es ? "Términos y condiciones" : "Terms and conditions"}</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} FIA'O. {es ? "Todos los derechos reservados." : "All rights reserved."}</span>
          <span>{es ? "Hecho para pequeños negocios." : "Made for small businesses."}</span>
        </div>
      </div>
    </footer>
  );
}
