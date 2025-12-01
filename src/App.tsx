// src/App.tsx
import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router";
import { Toaster } from "sonner";

import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import Calendar from "./pages/Visits/Calendar";
import VisitsPage from "./pages/Visits/VisitsPage";
import UserPage from "./pages/Users/UserTable"; 
import PlanPage from "./pages/Plans/PlanPage";
import SubscriptionsPage from "./pages/Subscriptions/SubscriptionsPage";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import PrivateRoute from "./routes/PrivateRoute";
import CustomersPage from "./pages/Customers/CustomerPage";
import ResetPassword from "./pages/AuthPages/ResetPassword";

// helpers de auth (inactividad)
import {
  touchActivity,
  hasSessionExpiredByInactivity,
  clearAuth,
} from "./api/auth/auth.api";

// provider de autenticación (usuario + rol)
import { AuthProvider } from "./auth/AuthContext";

function AuthActivityWatcher() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleActivity = () => {
      touchActivity();
    };

    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("mousemove", handleActivity);

    touchActivity();

    const intervalId = window.setInterval(() => {
      if (hasSessionExpiredByInactivity()) {
        clearAuth();
        navigate("/signin", { replace: true });
      }
    }, 30 * 1000);

    return () => {
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("mousemove", handleActivity);
      window.clearInterval(intervalId);
    };
  }, [navigate]);

  useEffect(() => {
    touchActivity();
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <AuthActivityWatcher />

        <Toaster
          position="bottom-right"
          richColors
          closeButton
        />

        <Routes>
          {/* Ruta pública */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Rutas protegidas por login */}
          <Route element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route index path="/" element={<Home />} />
              <Route path="/users" element={<UserPage />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/plans" element={<PlanPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/visit" element={<VisitsPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
