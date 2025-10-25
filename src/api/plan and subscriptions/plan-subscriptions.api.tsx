// src/api/plan/plan-subscriptions.api.ts
import axios, { AxiosInstance } from "axios";

const URL = import.meta.env?.VITE_API_URL ?? "http://localhost:8000";

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

const PlanSubsApi: AxiosInstance = axios.create({
  baseURL: `${URL}/api/plan-subscriptions`,
});

/* =======================
   CRUD base
======================= */

// GET /api/plan-subscriptions/
export const getAllPlanSubscriptions = (params?: { status?: string; customer?: number | string; plan?: number | string }) =>
  PlanSubsApi.get<PlanSubscription[]>("/", { params });

// GET /api/plan-subscriptions/{id}/
export const getPlanSubscription = (id: number | string) =>
  PlanSubsApi.get<PlanSubscription>(`/${id}/`);

// POST /api/plan-subscriptions/
export const createPlanSubscription = (payload: CreatePlanSubscriptionDTO) =>
  PlanSubsApi.post<PlanSubscription>("/", payload);

// PATCH /api/plan-subscriptions/{id}/
export const partialUpdatePlanSubscription = (id: number | string, payload: UpdatePlanSubscriptionDTO) =>
  PlanSubsApi.patch<PlanSubscription>(`/${id}/`, payload);

// DELETE /api/plan-subscriptions/{id}/
export const deletePlanSubscription = (id: number | string) =>
  PlanSubsApi.delete<void>(`/${id}/`);

// POST /api/plan-subscriptions/{id}/restore/
export const restorePlanSubscription = (id: number | string) =>
  PlanSubsApi.post<PlanSubscription>(`/${id}/restore/`);

/* =======================
   Endpoints personalizados
======================= */

// GET /api/plan-subscriptions/by-customer/{customer_id}/?status=active
export const getSubscriptionsByCustomer = (customerId: number | string, status?: string) =>
  PlanSubsApi.get<PlanSubscription[]>(`/by-customer/${customerId}/`, { params: status ? { status } : {} });

// POST /api/plan-subscriptions/by-customer/{customer_id}/  (NO enviar 'customer' en body)
export const createSubscriptionByCustomer = (customerId: number | string, payload: Omit<CreatePlanSubscriptionDTO, "customer">) =>
  PlanSubsApi.post<PlanSubscription>(`/by-customer/${customerId}/`, payload);

// GET /api/plan-subscriptions/by-plan/{plan_id}/?status=active
export const getSubscriptionsByPlan = (planId: number | string, status?: string) =>
  PlanSubsApi.get<PlanSubscription[]>(`/by-plan/${planId}/`, { params: status ? { status } : {} });

// POST /api/plan-subscriptions/by-plan/{plan_id}/  (NO enviar 'plan' en body)
export const createSubscriptionByPlan = (planId: number | string, payload: Omit<CreatePlanSubscriptionDTO, "plan">) =>
  PlanSubsApi.post<PlanSubscription>(`/by-plan/${planId}/`, payload);

// Acción rápida opcional
export const cancelSubscription = (id: number | string) =>
  PlanSubsApi.post<{ detail: string }>(`/${id}/cancel/`);
