// src/api/plan/plan-subscriptions.api.ts
import axios, { AxiosInstance } from "axios";

const URL = import.meta.env?.VITE_API_URL ?? "http://localhost:8000";

/* =======================
   Tipos
======================= */

export interface PlanSubscription {
  id: number;
  customer: number;
  plan: number;
  start_date: string; // "YYYY-MM-DD"
  status: string;     // "active" | "inactive" | "cancelled" (según tu backend)
  notes?: string;
  active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  customer_info?: {
    id: number;
    name: string;
    identification?: string;
    email?: string;
    phone?: string;
  };
}

export interface CreatePlanSubscriptionDTO {
  customer?: number;  // si usás POST /by-customer no lo mandes en body
  plan?: number;      // si usás POST /by-plan no lo mandes en body
  start_date: string;
  status: string;
  notes?: string;
}
export type UpdatePlanSubscriptionDTO = Partial<CreatePlanSubscriptionDTO>;

/** Respuesta paginada DRF */
export type PageResp<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

/** Parámetros comunes de listado */
export type ListPlanSubsParams = {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;       // e.g. "start_date", "-start_date", "status", "-status"
  status?: string;         // si tu FilterSet lo soporta
  customer?: number;       // filtro directo ?customer=ID (si lo expones)
  plan?: number;           // filtro directo ?plan=ID (si lo expones)
  active?: boolean;        // si lo expones
};

/* =======================
   Axios
======================= */

const PlanSubsApi: AxiosInstance = axios.create({
  baseURL: `${URL}/api/plan-subscriptions/`, // barra final importante
});

/* =======================
   PAGINADO general
======================= */

/** GET /api/plan-subscriptions/?page=&page_size=&search=&ordering=&status=&customer=&plan= */
export const getPlanSubscriptions = async (params: ListPlanSubsParams = {}) => {
  const res = await PlanSubsApi.get<PageResp<PlanSubscription>>("", { params });
  return res.data; // ⬅️ devolvemos data (no AxiosResponse)
};

/** Navegar next/previous de DRF */
export const getPlanSubscriptionsByUrl = async (url: string) => {
  const res = await axios.get<PageResp<PlanSubscription>>(url);
  return res.data;
};

/* =======================
   CRUD base
======================= */

// (Opcional) SIN paginar
export const getAllPlanSubscriptions = (params?: {
  status?: string;
  customer?: number | string;
  plan?: number | string;
}) => PlanSubsApi.get<PlanSubscription[]>("", { params });

export const getPlanSubscription = (id: number | string) =>
  PlanSubsApi.get<PlanSubscription>(`${id}/`);

export const createPlanSubscription = (payload: CreatePlanSubscriptionDTO) =>
  PlanSubsApi.post<PlanSubscription>("", payload);

export const partialUpdatePlanSubscription = (
  id: number | string,
  payload: UpdatePlanSubscriptionDTO
) => PlanSubsApi.patch<PlanSubscription>(`${id}/`, payload);

export const deletePlanSubscription = (id: number | string) =>
  PlanSubsApi.delete<void>(`${id}/`);

export const restorePlanSubscription = (id: number | string) =>
  PlanSubsApi.post<PlanSubscription>(`${id}/restore/`);

/* =======================
   Endpoints personalizados
======================= */

/** NO paginado (como lo tenías):
 *  GET /api/plan-subscriptions/by-customer/{customer_id}/?status=active
 */
export const getSubscriptionsByCustomer = (
  customerId: number | string,
  status?: string
) =>
  PlanSubsApi.get<PlanSubscription[]>(`by-customer/${customerId}/`, {
    params: status ? { status } : {},
  });

/** NO paginado:
 *  POST /api/plan-subscriptions/by-customer/{customer_id}/
 *  (NO enviar 'customer' en body)
 */
export const createSubscriptionByCustomer = (
  customerId: number | string,
  payload: Omit<CreatePlanSubscriptionDTO, "customer">
) => PlanSubsApi.post<PlanSubscription>(`by-customer/${customerId}/`, payload);

/** NO paginado:
 *  GET /api/plan-subscriptions/by-plan/{plan_id}/?status=active
 */
export const getSubscriptionsByPlan = (planId: number | string, status?: string) =>
  PlanSubsApi.get<PlanSubscription[]>(`by-plan/${planId}/`, {
    params: status ? { status } : {},
  });

/** NO paginado:
 *  POST /api/plan-subscriptions/by-plan/{plan_id}/  (NO enviar 'plan' en body)
 */
export const createSubscriptionByPlan = (
  planId: number | string,
  payload: Omit<CreatePlanSubscriptionDTO, "plan">
) => PlanSubsApi.post<PlanSubscription>(`by-plan/${planId}/`, payload);

/** Acción rápida opcional */
export const cancelSubscription = (id: number | string) =>
  PlanSubsApi.post<{ detail: string }>(`${id}/cancel/`);

/* =======================
   Variantes PAGINADAS por cliente/plan
======================= */

/** GET paginado: /api/plan-subscriptions/by-customer/{customer_id}/?page=&page_size=&search=&ordering=&status= */
export const getSubscriptionsByCustomerPaged = async (
  customerId: number | string,
  params: Omit<ListPlanSubsParams, "customer" | "plan"> = {}
) => {
  const res = await PlanSubsApi.get<PageResp<PlanSubscription>>(
    `by-customer/${customerId}/`,
    { params }
  );
  return res.data;
};

/** GET paginado: /api/plan-subscriptions/by-plan/{plan_id}/?page=&page_size=&search=&ordering=&status= */
export const getSubscriptionsByPlanPaged = async (
  planId: number | string,
  params: Omit<ListPlanSubsParams, "customer" | "plan"> = {}
) => {
  const res = await PlanSubsApi.get<PageResp<PlanSubscription>>(
    `by-plan/${planId}/`,
    { params }
  );
  return res.data;
};
