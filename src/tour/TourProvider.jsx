import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { isProfileComplete } from "@/lib/settings";
import { TOUR_STEPS } from "@/tour/tourSteps";
import { buildTour, hasSeenTour, markTourSeen, pagesWithTour, isMobileWidth } from "@/tour/tour";
import TourOverlay from "@/tour/TourOverlay";

const TourContext = createContext(null);
const PAGES_WITH_TOUR = pagesWithTour(TOUR_STEPS);
const AUTO_START_DELAY = 1200; // da tiempo a que cargue el Dashboard antes de abrir la bienvenida

// Lo que usan los demás componentes: el botón "?" y la fila de Profile.
export function useTour() {
  return useContext(TourContext) ?? { active: false, canStart: false, pageTourAvailable: false, start() {}, stop() {} };
}

// El "director" del tutorial: sabe en qué paso va, cambia de página cuando hace falta
// y abre solo la primera vez que alguien entra a la app.
export default function TourProvider({ children }) {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(null); // { steps, index, scope, direction }
  const settled = useRef(new Set()); // páginas que ya terminaron de cargar durante este tutorial
  const autoTriedUsers = useRef(new Set());
  const autoTimer = useRef(null);

  const userId = user?.id;
  const canTour = Boolean(isAuthenticated && isProfileComplete(user));

  const start = useCallback(
    (scope = "all") => {
      if (!canTour) return;
      const steps = buildTour(TOUR_STEPS, { scope, pathname: location.pathname, mobile: isMobileWidth(window.innerWidth) });
      if (steps.length === 0) return;
      settled.current = new Set();
      setSession({ steps, index: 0, scope, direction: 1 });
    },
    [canTour, location.pathname]
  );

  // Cerrar (o terminar): se recuerda que esta persona ya lo vio para no volver a abrirlo sola
  const stop = useCallback(() => {
    setSession(null);
    if (userId) markTourSeen(userId);
  }, [userId]);

  const next = useCallback(() => {
    if (!session) return;
    if (session.index >= session.steps.length - 1) return stop();
    setSession({ ...session, index: session.index + 1, direction: 1 });
  }, [session, stop]);

  const back = useCallback(() => {
    if (!session || session.index === 0) return;
    setSession({ ...session, index: session.index - 1, direction: -1 });
  }, [session]);

  // Un paso cuyo elemento no existe se salta, en la dirección en que iba la persona
  const skip = useCallback(() => {
    if (!session) return;
    const target = session.index + session.direction;
    if (target >= session.steps.length) return stop();
    if (target < 0) return setSession({ ...session, index: 0, direction: 1 });
    setSession({ ...session, index: target });
  }, [session, stop]);

  // Cambiar de página cuando el paso lo pide
  useEffect(() => {
    if (!session) return;
    const step = session.steps[session.index];
    if (step.path !== location.pathname) navigate(step.path, { replace: true });
  }, [session, location.pathname, navigate]);

  // Si se cierra la sesión mientras el tutorial está abierto, se cierra también
  useEffect(() => {
    if (session && !canTour) setSession(null);
  }, [session, canTour]);

  // Primera vez: se abre solo en el Dashboard
  useEffect(() => {
    if (isLoadingAuth || !canTour || !userId) return undefined;
    if (location.pathname !== "/dashboard") return undefined;
    if (autoTriedUsers.current.has(userId)) return undefined;

    if (hasSeenTour(userId)) {
      autoTriedUsers.current.add(userId);
      return undefined;
    }

    autoTimer.current = setTimeout(() => {
      autoTriedUsers.current.add(userId);
      start("all");
    }, AUTO_START_DELAY);
    return () => clearTimeout(autoTimer.current);
  }, [isLoadingAuth, canTour, userId, location.pathname, start]);
  useEffect(() => () => clearTimeout(autoTimer.current), []);

  const value = useMemo(
    () => ({
      active: Boolean(session),
      canStart: canTour,
      pageTourAvailable: canTour && PAGES_WITH_TOUR.has(location.pathname),
      start,
      stop,
    }),
    [session, canTour, location.pathname, start, stop]
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {session && (
        <TourOverlay
          step={session.steps[session.index]}
          index={session.index}
          total={session.steps.length}
          pathname={location.pathname}
          language={language}
          settled={settled.current}
          onNext={next}
          onBack={back}
          onClose={stop}
          onSkip={skip}
        />
      )}
    </TourContext.Provider>
  );
}
