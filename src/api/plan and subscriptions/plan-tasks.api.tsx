// src/api/plan/plan-tasks.api.ts
import axios, { AxiosInstance } from "axios";

const URL = import.meta.env?.VITE_API_URL ?? "http://localhost:8000";

/* =======================
   Tipos de datos
======================= */

export interface PlanTask {
  id: number;
  plan: number;
  name: string;
  description?: string;
  active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by?: number | null;
  updated_by?: number | null;
}

export interface CreatePlanTaskDTO {
  plan?: number;
  name: string;
  description?: string;
}

export type UpdatePlanTaskDTO = Partial<CreatePlanTaskDTO>;

/* =======================
   Cliente Axios
======================= */

const PlanTaskApi: AxiosInstance = axios.create({
  baseURL: `${URL}/api/plan-tasks`,
});

/* =======================
   CRUD BASE
======================= */

// GET /api/plan-tasks/
export const getAllPlanTasks = () =>
  PlanTaskApi.get<PlanTask[]>("/");

// GET /api/plan-tasks/{id}/
export const getPlanTask = (id: number | string) =>
  PlanTaskApi.get<PlanTask>(`/${id}/`);

// POST /api/plan-tasks/
export const createPlanTask = (payload: CreatePlanTaskDTO) =>
  PlanTaskApi.post<PlanTask>("/", payload);

// PUT /api/plan-tasks/{id}/    (mejor usa PATCH abajo)
export const updatePlanTask = (
  id: number | string,
  payload: UpdatePlanTaskDTO
) => PlanTaskApi.put<PlanTask>(`/${id}/`, payload);

// PATCH /api/plan-tasks/{id}/
export const partialUpdatePlanTask = (
  id: number | string,
  payload: UpdatePlanTaskDTO
) => PlanTaskApi.patch<PlanTask>(`/${id}/`, payload);

// DELETE /api/plan-tasks/{id}/
export const deletePlanTask = (id: number | string) =>
  PlanTaskApi.delete<void>(`/${id}/`);

// POST /api/plan-tasks/{id}/restore/
export const restorePlanTask = (id: number | string) =>
  PlanTaskApi.post<PlanTask>(`/${id}/restore/`);

/* =======================
   ENDPOINTS PERSONALIZADOS
======================= */

// GET /api/plan-tasks/by-plan/{plan_id}/
export const getTasksByPlan = (
  planId: number | string,
  onlyActive = false
) =>
  PlanTaskApi.get<PlanTask[]>(
    `/by-plan/${planId}/`,
    { params: onlyActive ? { active: "true" } : {} }
  );

// POST /api/plan-tasks/by-plan/{plan_id}/
export const createTaskByPlan = (
  planId: number | string,
  payload: Omit<CreatePlanTaskDTO, "plan">
) =>
  // IMPORTANTE: enviar plan en el body (muchos backends lo piden)
  PlanTaskApi.post<PlanTask>(`/by-plan/${planId}/`, { ...payload, plan: Number(planId) });
