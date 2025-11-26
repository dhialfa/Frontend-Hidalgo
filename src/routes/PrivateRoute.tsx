// src/routes/PrivateRoute.tsx
import { Navigate, Outlet } from "react-router";
import { isAuthenticated } from "../api/auth/auth.api";

export default function PrivateRoute() {
  const auth = isAuthenticated();

  if (!auth) {
    // No hay token, mandar al login
    return <Navigate to="/signin" replace />;
  }

  // Autenticado: renderiza las rutas hijas
  return <Outlet />;
}
