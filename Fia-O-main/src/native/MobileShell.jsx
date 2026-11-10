import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import BottomDock from "@/native/BottomDock";
import MoreSheet from "@/native/MoreSheet";
import ConfirmSheet from "@/native/ConfirmSheet";
import SplashIntro from "@/native/SplashIntro";

const APP_PATHS = ["/dashboard", "/credit", "/clients", "/products", "/reports", "/contact", "/profile"];
const DIALOG = '.fixed.inset-0 > [role="dialog"]';

// Todo lo que solo existe en la app Android: barra inferior, panel "Más", confirmaciones,
// botón volver, teclado y la presentación animada. En la web este componente no se monta.
export default function MobileShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [exitHint, setExitHint] = useState(false);
  const lastBack = useRef(0);
  const moreRef = useRef(false);
  moreRef.current = moreOpen;

  const showDock = isAuthenticated && APP_PATHS.includes(pathname);

  useEffect(() => {
    document.documentElement.classList.toggle("has-dock", showDock);
    return () => document.documentElement.classList.remove("has-dock");
  }, [showDock]);

  useEffect(() => setMoreOpen(false), [pathname]);

  // Botón / gesto "volver".
  useEffect(() => {
    const onBack = (e) => {
      if (e.defaultPrevented) return; // ya lo atendió, por ejemplo, la hoja de confirmación
      const stop = () => e.preventDefault();

      if (moreRef.current) { setMoreOpen(false); return stop(); }

      // Tutorial abierto: se cierra con Esc.
      if (document.querySelector("[data-tour-overlay]")) {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        return stop();
      }
      // Ventanas de Clientes/Productos: primero Esc; si no cierra, se toca el fondo.
      const dialog = document.querySelector(DIALOG);
      if (dialog) {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        setTimeout(() => {
          const still = document.querySelector(DIALOG);
          if (still) still.parentElement?.click();
        }, 60);
        return stop();
      }

      if (isAuthenticated && APP_PATHS.includes(pathname)) {
        if (pathname !== "/dashboard") { navigate("/dashboard", { replace: true }); return stop(); }
        // Pantalla principal: hace falta pulsar dos veces para salir.
        if (Date.now() - lastBack.current < 2000) return; // sin stop = cierra la app
        lastBack.current = Date.now();
        setExitHint(true);
        setTimeout(() => setExitHint(false), 2000);
        return stop();
      }
      if (!["/", "/login"].includes(pathname)) { window.history.back(); return stop(); }
    };
    window.addEventListener("fiao:back", onBack);
    return () => window.removeEventListener("fiao:back", onBack);
  }, [pathname, isAuthenticated, navigate]);

  // Teclado: se esconde la barra inferior y el campo activo se mantiene a la vista.
  useEffect(() => {
    const typing = (el) =>
      el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !["checkbox", "radio", "button", "submit", "range"].includes(el.type);
    const root = document.documentElement;
    const onIn = (e) => {
      if (!typing(e.target)) return;
      root.setAttribute("data-kb", "");
      setTimeout(() => e.target.scrollIntoView?.({ block: "center", behavior: "smooth" }), 320);
    };
    const onOut = () => setTimeout(() => !typing(document.activeElement) && root.removeAttribute("data-kb"), 80);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);

  return (
    <>
      <SplashIntro ready={!isLoadingAuth && !isLoadingPublicSettings} />
      {showDock && <BottomDock moreOpen={moreOpen} onMore={() => setMoreOpen((v) => !v)} />}
      {showDock && <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />}
      <ConfirmSheet />
      {exitHint && <div role="status" className="fiao-toast">{t("Press back again to exit")}</div>}
    </>
  );
}
