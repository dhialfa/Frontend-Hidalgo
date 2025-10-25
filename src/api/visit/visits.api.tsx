// src/api/visits.ts
import axios, { AxiosInstance } from "axios";

const URL = "http://localhost:8000";

// Tipos
export type VisitStatus = "scheduled" | "in_progress" | "completed" | "canceled";

export interface Visit {
  id: number;
  subscription: number;            // id
  user: number;                    // id
  start: string;                   // ISO
  end: string | null;              // ISO | null
  status: VisitStatus;
  site_address: string;
  notes: string;
  cancel_reason: string;
  created_at: string;              // ISO
  updated_at: string;              // ISO
  // Relaciones (si tu serializer embebe objetos, puedes ajustar estos):
  assessment: any | null;
  evidences: any[];
  tasks_completed: any[];
  materials_used: any[];
}

// Para respuestas paginadas de DRF
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

const VisitApi: AxiosInstance = axios.create({
  // ⚠️ El router del backend está en singular: /api/visit
  baseURL: `${URL}/api/visit`,
});

// ======================== LISTADO / FILTROS ========================

export const getVisits = (params?: VisitListParams) =>
  VisitApi.get<VisitList | Visit[]>("/", { params });

export const getVisitsByCustomer = (customerId: number | string, params?: VisitListParams) =>
  VisitApi.get<VisitList | Visit[]>(`/by-customer/${customerId}/`, { params });

// Helpers rápidos
export const getScheduledVisits = () =>
  VisitApi.get<VisitList | Visit[]>("/", { params: { status: "scheduled" } });

export const getInProgressVisits = () =>
  VisitApi.get<VisitList | Visit[]>("/", { params: { status: "in_progress" } });

export const getCompletedVisits = () =>
  VisitApi.get<VisitList | Visit[]>("/", { params: { status: "completed" } });

export const getCanceledVisits = () =>
  VisitApi.get<VisitList | Visit[]>("/", { params: { status: "canceled" } });

// ======================== CRUD ========================

export const getAllVisits = () => VisitApi.get<VisitList | Visit[]>("/");

export const getVisit = (id: number | string) =>
  VisitApi.get<Visit>(`${id}/`);

export const createVisit = (payload: Partial<Visit>) =>
  VisitApi.post<Visit>("/", payload);

export const updateVisit = (id: number | string, payload: Partial<Visit>) =>
  VisitApi.put<Visit>(`${id}/`, payload);

export const patchVisit = (id: number | string, payload: Partial<Visit>) =>
  VisitApi.patch<Visit>(`${id}/`, payload);

export const deleteVisit = (id: number | string) =>
  VisitApi.delete<void>(`${id}/`);

// ======================== RELACIONALES ========================

export const getVisitsBySubscription = (subscriptionId: number | string, params?: VisitListParams) =>
  VisitApi.get<VisitList | Visit[]>(`/by-subscription/${subscriptionId}/`, { params });

export const createVisitBySubscription = (
  subscriptionId: number | string,
  payload: Partial<Visit>
) => VisitApi.post<Visit>(`/by-subscription/${subscriptionId}/`, payload);

export const getVisitsByUser = (userId: number | string, params?: VisitListParams) =>
  VisitApi.get<VisitList | Visit[]>(`/by-user/${userId}/`, { params });

// ======================== ACCIONES ========================

export const startVisitNow = (id: number | string) =>
  VisitApi.post<{ detail: string }>(`${id}/start_now/`);

export const completeVisit = (id: number | string) =>
  VisitApi.post<{ detail: string }>(`${id}/complete/`);

// Si tu endpoint acepta motivo de cancelación, pásalo:
export const cancelVisit = (id: number | string, cancel_reason = "") =>
  VisitApi.post<{ detail: string }>(`${id}/cancel/`, { cancel_reason });

export const restoreVisit = (id: number | string) =>
  VisitApi.post<{ detail: string }>(`${id}/restore/`);
