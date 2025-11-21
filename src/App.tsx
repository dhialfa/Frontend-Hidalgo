// src/App.tsx
import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router";

import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Visits/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import CustomerTable from "./pages/Customers/CustomerTable";
import VisitsPage from "./pages/Visits/VisitsPage";
import UserPage from "./pages/Users/UserTable"; 
import Blank from "./pages/Blank";
import PlanPage from "./pages/Plans/PlanPage";
import SubscriptionsPage from "./pages/Subscriptions/SubscriptionsPage";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";

import PrivateRoute from "./routes/PrivateRoute";

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

        <Routes>
          {/* Ruta pública */}
          <Route path="/signin" element={<SignIn />} />

          {/* Rutas protegidas por login */}
          <Route element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route index path="/" element={<Home />} />

              <Route path="/users" element={<UserPage />} />

              <Route path="/calendar" element={<Calendar />} />
              <Route path="/customers" element={<CustomerTable />} />
              <Route path="/plans" element={<PlanPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/visit" element={<VisitsPage />} />

              <Route path="/blank" element={<Blank />} />

              {/* Forms */}
              <Route path="/form-elements" element={<FormElements />} />

              {/* Tables */}
              <Route path="/basic-tables" element={<BasicTables />} />

              {/* Ui Elements */}
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/avatars" element={<Avatars />} />
              <Route path="/badge" element={<Badges />} />
              <Route path="/buttons" element={<Buttons />} />
              <Route path="/images" element={<Images />} />
              <Route path="/videos" element={<Videos />} />

              {/* Charts */}
              <Route path="/line-chart" element={<LineChart />} />
              <Route path="/bar-chart" element={<BarChart />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
