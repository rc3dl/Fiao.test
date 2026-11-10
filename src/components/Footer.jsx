import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { withBase } from "@/lib/withBase";
import { IS_NATIVE } from "@/native/useIsNative";
function Logo() {
  return (
    <img
      src={withBase("/Logo-fiao-120x40.svg")}
      alt="FIA'O"
      className="h-9 sm:h-10 w-auto select-none"
    />
  );
}

export default function Footer() {
    const { t } = useLanguage();
  if (IS_NATIVE) return null; // en la app Android el pie de marketing no aporta nada
  return (
    <footer className="w-full">
          {/* Dark footer */}
      <div className="w-full py-12" style={{ backgroundColor: "var(--surface)" }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-1">
              <Logo />
              <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {t("The app for shopkeepers to manage their credit lines without paper notebooks or wall markings.")}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-wider mb-3" style={{ color: "var(--accent-text)" }}>{t("NAVIGATION")}</h4>
              <ul className="space-y-2">
                {["Home", "Credit", "Products", "Clients"].map((l) => (
                  <li key={l}><Link to={`/${l === "Home" ? "" : l.toLowerCase()}`} className="text-sm hover:underline" style={{ color: "var(--text-muted)" }}>{t(l)}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-wider mb-3" style={{ color: "var(--accent-text)" }}>{t("PRODUCT")}</h4>
              <ul className="space-y-2">
                {["Reports", "Inventory", "Digital Catalog", "Payment Integration"].map((l) => (
                  <li key={l}><span className="text-sm" style={{ color: "var(--text-muted)" }}>{t(l)}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-wider mb-3" style={{ color: "var(--accent-text)" }}>{t("CONTACT")}</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}><Mail className="w-3.5 h-3.5" /> {t("hola@fiao.app")}</li>
                <li className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}><Phone className="w-3.5 h-3.5" /> +507 6000-0000</li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t flex flex-col sm:flex-row justify-between gap-2" style={{ borderColor: "var(--border-cream)" }}>
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>{t("© 2026 FIA'O. Visual prototypes.")}</span>
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>{t("Made for local businesses")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}