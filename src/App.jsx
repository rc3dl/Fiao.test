import React from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './pages/PageNotFound';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProfileGate from '@/components/ProfileGate';
import { ThemeProvider } from '@/contexts/ThemeContext';
import TourProvider from '@/tour/TourProvider';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import Home from '@/pages/Home';
import Credit from '@/pages/Credit';
import Products from '@/pages/Products';
import Clients from '@/pages/Clients';
import Reports from '@/pages/Reports';
import Contact from '@/pages/Contact';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import Setup from '@/pages/Setup';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import { IS_NATIVE } from '@/native/useIsNative';
import MobileShell from '@/native/MobileShell';

// Marketing landing for guests, dashboard for logged-in users.
function IndexRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  // En la app Android no se muestra la página de marketing: se entra directo al login.
  return IS_NATIVE ? <Navigate to="/login" replace /> : <Home />;
}

// Falló la lectura del perfil (red, permisos o esquema): se avisa y se permite reintentar.
const ProfileLoadError = ({ message }) => {
  const { checkAppState } = useAuth();
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
      <p role="alert" className="text-sm">{t("We could not load your profile.")} {message}</p>
      <button type="button" className="fiao-btn px-4" onClick={() => checkAppState()}>{t("Retry")}</button>
    </div>
  );
};

const RedirectToLogin = ({ go }) => {
  React.useEffect(() => { go(); }, [go]);
  return null;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    if (IS_NATIVE) return null;
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'profile_error') return <ProfileLoadError message={authError.message} />;
    if (authError.type === 'auth_required') return <RedirectToLogin go={navigateToLogin} />;
  }

  return (
    <Routes>
      <Route path="/" element={<IndexRoute />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/setup" element={<Setup />} />
        <Route element={<ProfileGate />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/credit" element={<Credit />} />
          <Route path="/products" element={<Products />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/contact" element={<Contact />} />
        </Route>
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router basename={import.meta.env.BASE_URL}>
              <TourProvider>
                <ScrollToTop />
                <AuthenticatedApp />
                {IS_NATIVE && <MobileShell />}
              </TourProvider>
            </Router>
            <Toaster />
          </QueryClientProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
