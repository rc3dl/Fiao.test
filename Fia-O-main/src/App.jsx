import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './pages/PageNotFound';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProfileGate from '@/components/ProfileGate';   // debajo de: import ProtectedRoute ...
import { ThemeProvider } from '@/contexts/ThemeContext';
import TourProvider from '@/tour/TourProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Home from '@/pages/Home';
import Credit from '@/pages/Credit';
import Products from '@/pages/Products';
import Clients from '@/pages/Clients';
import Reports from '@/pages/Reports';
import Contact from '@/pages/Contact';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import Setup from '@/pages/Setup';                    // debajo de: import Profile ...
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import { Navigate } from 'react-router-dom';
import { IS_NATIVE } from '@/native/useIsNative';
import MobileShell from '@/native/MobileShell';

// Marketing landing for guests, dashboard for logged-in users.
function IndexRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  // En la app Android no se muestra la página de marketing: se entra directo al login.
  return IS_NATIVE ? <Navigate to="/login" replace /> : <Home />;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    if (IS_NATIVE) return null; // la presentación animada cubre la carga
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Marketing landing for guests; redirects to dashboard when logged in */}
      <Route path="/" element={<IndexRoute />} />

          {/* App pages (require login) */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        {/* Primera vez: se pide la información del negocio antes de entrar a la app */}
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

      {/* Auth routes */}
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
  )
}

export default App