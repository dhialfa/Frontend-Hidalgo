// src/api/visits.ts
import axios, { AxiosInstance } from "axios";
import { getAccessToken } from "../auth/auth.api";

const API = import.meta.env?.VITE_API_URL ?? "http://localhost:8000";

// =========================
// Tipos
// =========================

export type VisitStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "canceled";

export interface Visit {
  id: number;
  subscription: number;            // id de la suscripción
  user: number;                    // id del técnico/usuario
  start: string;                   // ISO
  end: string | null;              // ISO | null
  status: VisitStatus;
  site_address: string;
  notes: string;
  cancel_reason: string;
  created_at: string;              // ISO
  updated_at: string;              // ISO

  // Relaciones (ajusta si el serializer embebe objetos)
  assessment: any | null;
  evidences: any[];
  tasks_completed: any[];
  materials_used: any[];
}

// Respuesta paginada típica de DRF
export interface VisitList {
  count: number;
  next: string | null;
  previous: string | null;
  results: Visit[];
}

// Parámetros de listado/filtrado
export interface VisitListParams {
  customer?: number | string;
  subscription?: number | string;
  user?: number | string;
  status?: VisitStatus;
  search?: string;
  ordering?: string;   // "-start", "start", "-status", etc.
  page?: number;
  page_size?: number;
  // Si luego agregas filtros por fecha en el backend:
  start__gte?: string;
  start__lte?: string;
}

// =========================
// Axios instance
// =========================

const VisitApi: AxiosInstance = axios.create({
  // router del backend: /api/visit/
  baseURL: `${API}/api/visit/`,
});

// 🔐 Interceptor: mete el JWT en TODOS los requests de visitas
VisitApi.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ======================== LISTADO / FILTROS ========================

/**
 * Lista visitas (paginadas o no, según tu backend).
 */
export const getVisits = (params?: VisitListParams) =>
  VisitApi.get<VisitList | Visit[]>("", { params });

/**
 * Lista SOLO las visitas del usuario autenticado.
 * GET /api/visit/my-visits/
 */
export const getMyVisits = (params?: VisitListParams) =>
  VisitApi.get<VisitList | Visit[]>("my-visits/", { params });

/**
 * Visitas por cliente (si tu backend tiene este endpoint).
 */
export const getVisitsByCustomer = (
  customerId: number | string,
  params?: VisitListParams,
) =>
  VisitApi.get<VisitList | Visit[]>(
    `by-customer/${customerId}/`,
    { params },
  );

// Helpers rápidos por estado (globales)
export const getScheduledVisits = () =>
  VisitApi.get<VisitList | Visit[]>("", {
    params: { status: "scheduled" },
  });

export const getInProgressVisits = () =>
  VisitApi.get<VisitList | Visit[]>("", {
    params: { status: "in_progress" },
  });

export const getCompletedVisits = () =>
  VisitApi.get<VisitList | Visit[]>("", {
    params: { status: "completed" },
  });

export const getCanceledVisits = () =>
  VisitApi.get<VisitList | Visit[]>("", {
    params: { status: "canceled" },
  });

// ======================== CRUD ========================

export const getAllVisits = () =>
  VisitApi.get<VisitList | Visit[]>("");

export const getVisit = (id: number | string) =>
  VisitApi.get<Visit>(`${id}/`);

/**
 * Crear visita.
 * payload puede ser parcial, pero el backend exigirá los campos requeridos.
 */
export const createVisit = (payload: Partial<Visit>) =>
  VisitApi.post<Visit>("", payload);

/**
 * Update completo (PUT).
 */
export const updateVisit = (
  id: number | string,
  payload: Partial<Visit>,
) => VisitApi.put<Visit>(`${id}/`, payload);

/**
 * Update parcial (PATCH).
 */
export const patchVisit = (
  id: number | string,
  payload: Partial<Visit>,
) => VisitApi.patch<Visit>(`${id}/`, payload);

export const deleteVisit = (id: number | string) =>
  VisitApi.delete<void>(`${id}/`);

// ======================== RELACIONALES ========================

export const getVisitsBySubscription = (
  subscriptionId: number | string,
  params?: VisitListParams,
) =>
  VisitApi.get<VisitList | Visit[]>(
    `by-subscription/${subscriptionId}/`,
    { params },
  );

/**
 * Crear visita ligada a una suscripción específica.
 */
export const createVisitBySubscription = (
  subscriptionId: number | string,
  payload: Partial<Visit>,
) =>
  VisitApi.post<Visit>(
    `by-subscription/${subscriptionId}/`,
    payload,
  );

/**
 * Visitas filtradas por usuario (pensado para admin/supervisor).
 * Usa el filtro estándar ?user=ID del ViewSet.
 * GET /api/visit/?user=ID
 */
export const getVisitsByUser = (
  userId: number | string,
  params?: VisitListParams,
) =>
  VisitApi.get<VisitList | Visit[]>("", {
    params: { ...(params || {}), user: userId },
  });

// ======================== ACCIONES ========================

/**
 * Marca la visita como "in_progress" desde el backend.
 */
export const startVisitNow = (id: number | string) =>
  VisitApi.post<{ detail: string }>(`${id}/start_now/`);

/**
 * Marca la visita como COMPLETED usando la acción `complete`.
 */
export const completeVisit = (id: number | string) =>
  VisitApi.post<{ detail: string }>(`${id}/complete/`);

/**
 * Cancela la visita indicando un motivo.
 */
export const cancelVisit = (
  id: number | string,
  cancel_reason = "",
) =>
  VisitApi.post<{ detail: string }>(`${id}/cancel/`, {
    cancel_reason,
  });

/**
 * Restaura una visita cancelada/eliminada.
 */
export const restoreVisit = (id: number | string) =>
  VisitApi.post<{ detail: string }>(`${id}/restore/`);
