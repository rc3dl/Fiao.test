import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchDashboard } from "@/api/dashboardApi";
import { buildAlerts } from "@/lib/alerts";
import NotificationBell from "@/components/NotificationBell";
import BottomDock from "@/native/BottomDock";
import MoreSheet from "@/native/MoreSheet";
import ConfirmSheet from "@/native/ConfirmSheet";
import SplashIntro from "@/native/SplashIntro";
import UpdateGate from "@/native/UpdateGate";
import { SyncPill, SyncSheet } from "@/native/SyncStatus";
import { startOffline, stopOffline } from "@/offline";
import { useSyncState } from "@/offline/useSyncState";

const APP_PATHS = ["/dashboard", "/credit", "/clients", "/products", "/reports", "/contact", "/profile"];
const DIALOG = '.fixed.inset-0 > [role="dialog"]';

// Todo lo que solo existe en la app Android: barra inferior, panel "Más", confirmaciones,
// botón volver, teclado y la presentación animada. En la web este componente no se monta.
export default function MobileShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings } = useAuth();
  const sync = useSyncState();
  const [moreOpen, setMoreOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [toast, setToast] = useState("");
  const lastBack = useRef(0);
  const moreRef = useRef(false);
  moreRef.current = moreOpen;
  const syncRef = useRef(false);
  syncRef.current = syncOpen;

  const showDock = isAuthenticated && APP_PATHS.includes(pathname);

  useEffect(() => {
    document.documentElement.classList.toggle("has-dock", showDock);
    return () => document.documentElement.classList.remove("has-dock");
  }, [showDock]);

  useEffect(() => {
    setMoreOpen(false);
    setSyncOpen(false);
  }, [pathname]);

  // Copia local, cola de cambios y sincronización: arrancan con la sesión y se detienen al cerrarla
  useEffect(() => {
    if (isAuthenticated && user?.id) startOffline(user.id);
    else if (!isLoadingAuth) stopOffline();
  }, [isAuthenticated, isLoadingAuth, user?.id]);

  // "Sincronización y actualizaciones" se abre también desde el panel Más
  useEffect(() => {
    const open = () => setSyncOpen(true);
    window.addEventListener("fiao:open-sync", open);
    return () => window.removeEventListener("fiao:open-sync", open);
  }, []);

  // Botón / gesto "volver".
  useEffect(() => {
    const onBack = (e) => {
      if (e.defaultPrevented) return; // ya lo atendió, por ejemplo, la hoja de confirmación
      const stop = () => e.preventDefault();

      // Actualización obligatoria: el botón volver no debe cerrar la pantalla ni la app
      if (document.querySelector("[data-update-mandatory]")) return stop();
      if (moreRef.current) { setMoreOpen(false); return stop(); }
      if (syncRef.current) { setSyncOpen(false); return stop(); }

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
        setToast(t("Press back again to exit"));
        setTimeout(() => setToast(""), 2000);
        return stop();
      }
      if (!["/", "/login"].includes(pathname)) { window.history.back(); return stop(); }
    };
    window.addEventListener("fiao:back", onBack);
    return () => window.removeEventListener("fiao:back", onBack);
  }, [pathname, isAuthenticated, navigate]);

  // Recordatorio diario (notificación de Android) con los mismos avisos de la campana.
  // Se reprograma al abrir la app; al cerrar sesión se cancela.
  const { data: dash } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard, staleTime: 60_000, enabled: isAuthenticated });
  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isAuthenticated) {
      import("@/native/notifications").then((m) => m.cancelReminder()).catch(() => {});
      return;
    }
    if (!dash) return;
    const alerts = (dash.settings?.notifications_enabled ?? true) ? buildAlerts(dash, language) : [];
    const count = (type) => alerts.filter((a) => a.type === type).length;
    import("@/native/notifications")
      .then((m) => m.syncReminder({ overdue: count("overdue"), stock: count("stock"), language }))
      .catch(() => {});
  }, [isAuthenticated, isLoadingAuth, dash, language]);

  // Errores al volver del inicio de sesión con Google (los avisa src/native/native.js)
  useEffect(() => {
    const onAuthError = (e) => {
      setToast(String(e.detail || ""));
      setTimeout(() => setToast(""), 4000);
    };
    window.addEventListener("fiao:auth-error", onAuthError);
    return () => window.removeEventListener("fiao:auth-error", onAuthError);
  }, []);

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
      {showDock && (
        <div className="fiao-bell">
          <NotificationBell />
        </div>
      )}
      {showDock && <SyncPill onOpen={() => setSyncOpen(true)} />}
      {showDock && <BottomDock moreOpen={moreOpen} onMore={() => setMoreOpen((v) => !v)} />}
      {showDock && <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />}
      {showDock && <SyncSheet open={syncOpen} onClose={() => setSyncOpen(false)} />}
      <UpdateGate enabled={isAuthenticated} online={sync.online} />
      <ConfirmSheet />
      {toast && <div role="status" className="fiao-toast">{toast}</div>}
    </>
  );
}
