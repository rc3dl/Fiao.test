import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isProfileComplete } from "@/lib/settings";

// Portero: si el perfil aún no está completo, manda a /setup antes de dejar entrar a la app.
// Recuerda a qué página quería ir la persona para llevarla ahí al terminar.
export default function ProfileGate() {
  const { user } = useAuth();
  const location = useLocation();

  if (!isProfileComplete(user)) {
    return <Navigate to="/setup" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return <Outlet />;
}