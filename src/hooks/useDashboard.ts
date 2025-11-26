// src/hooks/useDashboard.ts
import { useEffect, useState } from "react";
import {
  fetchDashboardOverview,
  type DashboardOverview,
} from "../api/analytics";

interface UseDashboardResult {
  data: DashboardOverview | null;
  loading: boolean;
  error: boolean;
  reload: () => void;
}

export function useDashboard(): UseDashboardResult {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(false);

      // OJO: este token es el access token JWT que ya usas
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No hay token en localStorage");
        setError(true);
        setLoading(false);
        return;
      }

      // AQUÍ estaba uno de los errores: hay que pasar solo el string
      const response = await fetchDashboardOverview(token);
      setData(response);
    } catch (e) {
      console.error("Error cargando dashboard:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Cargamos al montar el componente
    loadDashboard();
  }, []);

  return { data, loading, error, reload: loadDashboard };
}
