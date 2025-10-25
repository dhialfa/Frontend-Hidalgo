// src/api/plans.ts
import axios, { AxiosInstance } from "axios";

const URL = "http://localhost:8000";

// Ajusta estos campos a lo que devuelve tu backend
export interface Plan {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
  price?: string | number;
  active: boolean;
}

// Para crear/actualizar (puedes ajustar opcionales)
export interface CreatePlanDTO {
  name: string;
  description?: string;
  price?: number;
  active?: boolean;
}
export type UpdatePlanDTO = Partial<CreatePlanDTO>;

const PlanApi: AxiosInstance = axios.create({
  baseURL: `${URL}/api/plans`,
});

// GET /api/plans/
export const getAllPlans = () =>
  PlanApi.get<Plan[]>("/");

// GET /api/plans/:id/
export const getPlan = (id: number | string) =>
  PlanApi.get<Plan>(`${id}/`);

// POST /api/plans/
export const createPlan = (plan: CreatePlanDTO) =>
  PlanApi.post<Plan>("/", plan);

// PUT /api/plans/:id/
export const updatePlan = (id: number | string, plan: UpdatePlanDTO) =>
  PlanApi.put<Plan>(`${id}/`, plan);

// DELETE /api/plans/:id/
export const deletePlan = (id: number | string) =>
  PlanApi.delete<void>(`${id}/`);
