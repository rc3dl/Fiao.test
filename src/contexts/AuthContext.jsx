import { createContext, useState, useRef, useEffect, useContext } from "react";
import { base44 } from "@/api/authClient";
import { supabase } from "@/api/supabaseClient";
import { IS_NATIVE } from "@/native/useIsNative";
import { readStoredSession } from "@/lib/network";
import { queryClientInstance } from "@/lib/query-client";

/** @type {import("react").Context<any>} */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings] = useState(null);
  const activeUserIdRef = useRef(null);
  const authAttemptRef = useRef(0);

  useEffect(() => {
    checkAppState();
  }, []);

  // Limpia los datos privados al cerrar sesión o al cambiar de cuenta.
  // Las llamadas asíncronas se ejecutan fuera del callback de Supabase Auth.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        const previousUserId = activeUserIdRef.current;
        authAttemptRef.current += 1;
        activeUserIdRef.current = null;
        queryClientInstance.clear();
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);

        if (IS_NATIVE && previousUserId) {
          setTimeout(() => {
            import("@/offline")
              .then(({ wipeOnLogout }) => wipeOnLogout(previousUserId))
              .catch((error) => console.error("Could not clear offline user data:", error));
          }, 0);
        }
        return;
      }

      if (event === "SIGNED_IN") {
        const nextUserId = session?.user?.id;
        const previousUserId = activeUserIdRef.current;

        if (nextUserId && previousUserId && nextUserId !== previousUserId) {
          authAttemptRef.current += 1;
          activeUserIdRef.current = null;
          queryClientInstance.clear();
          setUser(null);
          setIsAuthenticated(false);
          setIsLoadingAuth(true);

          if (IS_NATIVE) {
            setTimeout(() => {
              import("@/offline")
                .then(({ wipeOnLogout }) => wipeOnLogout(previousUserId))
                .catch((error) => console.error("Could not clear previous offline user data:", error));
            }, 0);
          }
        }

        if (nextUserId && nextUserId !== activeUserIdRef.current) {
          setTimeout(() => checkUserAuth(nextUserId), 0);
        }
      }
    });

    return () => data?.subscription?.unsubscribe();
  }, []);

  const checkAppState = async () => {
    setAuthError(null);
    try {
      const { data } = await supabase.auth.getSession();
      // En Android, sin internet la sesión caducada no se puede renovar: se usa la guardada en el dispositivo.
      if (data.session || (IS_NATIVE && readStoredSession())) {
        await checkUserAuth(data.session?.user?.id ?? readStoredSession()?.user?.id ?? null);
      } else {
        activeUserIdRef.current = null;
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setAuthChecked(true);
      }
    } catch (error) {
      console.error("App state check failed:", error);
      setAuthError({ type: "unknown", message: error.message || "Failed to load app" });
      setIsLoadingAuth(false);
    } finally {
      setIsLoadingPublicSettings(false);
    }
  };

  const checkUserAuth = async (expectedUserId = null) => {
    const attempt = ++authAttemptRef.current;
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      if (attempt !== authAttemptRef.current) return;

      if (expectedUserId && currentUser.id !== expectedUserId) {
        activeUserIdRef.current = null;
        queryClientInstance.clear();
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setAuthChecked(true);
        return;
      }

      if (activeUserIdRef.current && activeUserIdRef.current !== currentUser.id) {
        queryClientInstance.clear();
      }
      activeUserIdRef.current = currentUser.id;
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      setAuthError(null);
    } catch (error) {
      if (attempt !== authAttemptRef.current) return;
      console.error("User auth check failed:", error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      if (error.status === 401 || error.status === 403) {
        activeUserIdRef.current = null;
        queryClientInstance.clear();
        setUser(null);
        setAuthError({ type: "auth_required", message: "Authentication required" });
      } else if (error.type === "profile_error") {
        setAuthError({ type: "profile_error", message: error.message });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    authAttemptRef.current += 1;
    activeUserIdRef.current = null;
    queryClientInstance.clear();
    setUser(null);
    setIsAuthenticated(false);
    void base44.auth.logout(shouldRedirect ? "/login" : undefined).catch((error) => {
      console.error("Could not complete sign out:", error);
    });
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin();
  };

  // Vuelve a leer los datos del usuario sin mostrar la pantalla de carga (se usa al guardar el perfil).
  const refreshUser = async () => {
    try {
      const refreshedUser = await base44.auth.me();
      if (activeUserIdRef.current && activeUserIdRef.current !== refreshedUser.id) {
        queryClientInstance.clear();
      }
      activeUserIdRef.current = refreshedUser.id;
      setUser(refreshedUser);
    } catch (error) {
      console.error("Could not refresh user:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
