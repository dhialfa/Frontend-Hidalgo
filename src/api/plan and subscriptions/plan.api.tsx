// ../../api/plan and subscriptions/plan.api
import axios, { AxiosInstance } from "axios";

/** Usa tu .env: VITE_API_URL=http://localhost:8000 */
const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/* =========================
 * Tipos
 * ========================= */
export interface Plan {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
  price?: string | number;
  active: boolean;
}

/** Respuesta paginada estándar DRF */
export type PageResp<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

/** Parámetros de listado (paginación + filtros comunes) */
export type PlanListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string; // "name", "-name", "price", "-price"
  active?: boolean;
};

/* =========================
 * Axios instance
 * ========================= */
const PlanApi: AxiosInstance = axios.create({
  baseURL: `${API}/api/plans/`, // ⚠️ barra final como en users.ts
  // timeout: 15000,
});

/* =========================
 * Listado paginado
 * ========================= */

/** GET /api/plans/?page=&page_size=&search=&ordering=&active= */
export const getPlans = async (params: PlanListParams = {}) => {
  const res = await PlanApi.get<PageResp<Plan>>("", { params });
  return res.data; // ⬅️ Igual que getUsers: devolvemos data, no AxiosResponse
};

/* =========================
 * CRUD (si los usas)
 * ========================= */

export const getAllPlans = () => PlanApi.get<Plan[]>(""); // no paginado, opcional

export const getPlan = (id: number | string) =>
  PlanApi.get<Plan>(`${id}/`);

export const createPlan = (payload: Partial<Plan>) =>
  PlanApi.post<Plan>("", payload);

export const updatePlan = (id: number | string, payload: Partial<Plan>) =>
  PlanApi.put<Plan>(`${id}/`, payload);

export const deletePlan = (id: number | string) =>
  PlanApi.delete<void>(`${id}/`);
