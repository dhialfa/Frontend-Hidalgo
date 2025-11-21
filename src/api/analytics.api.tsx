// src/api/dashboard.api.ts
import axios, { AxiosInstance, AxiosHeaders } from "axios";
import { getAccessToken } from "./auth/auth.api"; 

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/* ======================================
 * Tipos de respuesta del backend
 * (ajusta los nombres de campos si tu backend cambia)
 * ====================================== */

// Rango de fechas que devuelve el backend
export interface DashboardRange {
  from: string; // ISO date string (YYYY-MM-DD)
  to: string;   // ISO date string
}

// Totales para las cards del dashboard
export interface DashboardTotals {
  total_customers: number;
  active_customers: number;
  active_subscriptions: number;
  visits_planned_today: number;
  visits_completed_today: number;
  visits_completed_range: number;
  estimated_monthly_revenue: number; // si no lo usas, lo puedes quitar
}

// Item para gráfico de visitas por estado
export interface VisitsByStatusItem {
  status: string; // "PENDIENTE" | "EN_CURSO" | "COMPLETADA" | "CANCELADA" | etc.
  count: number;
}

// Item para gráfico de visitas por día (time series)
export interface VisitsByDayItem {
  date: string; // ISO date
  count: number;
}

// Respuesta general del endpoint /api/dashboard/overview/
export interface DashboardOverviewResponse {
  range: DashboardRange;
  totals: DashboardTotals;
  charts: {
    visits_by_status: VisitsByStatusItem[];
    visits_by_day: VisitsByDayItem[];
  };
}

/* ======================================
 * Parámetros de consulta
 * ====================================== */

export type DashboardOverviewParams = {
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
};

/* ======================================
 * Axios instance
 * ====================================== */

const DashboardApi: AxiosInstance = axios.create({
  baseURL: `${API}/api/dashboard/`, // importante terminar con slash
  // timeout: 15000,
});

// Interceptor para adjuntar el JWT sin romper tipos
DashboardApi.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }

    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

/* ======================================
 * Endpoints de dashboard
 * ====================================== */

/**
 * GET /api/dashboard/overview/?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Devuelve totales + datos para las gráficas principales.
 */
export const getDashboardOverview = async (
  params: DashboardOverviewParams = {},
) => {
  const res = await DashboardApi.get<DashboardOverviewResponse>("overview/", {
    params,
  });
  return res.data;
};

