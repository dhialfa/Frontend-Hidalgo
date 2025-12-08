// src/routes/PrivateRoute.tsx
import { Navigate, Outlet } from "react-router";
import { isAuthenticated } from "../api/auth/auth.api";

export default function PrivateRoute() {
  const auth = isAuthenticated();
  if (!auth) {
    return <Navigate to="/signin" replace />;
  }
  return <Outlet />;
}
