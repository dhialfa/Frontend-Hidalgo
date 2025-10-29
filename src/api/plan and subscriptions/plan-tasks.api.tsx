// src/api/plan/plan-tasks.api.ts
import axios, { AxiosInstance } from "axios";

/** Usa tu .env: VITE_API_URL=http://localhost:8000 */
const API = import.meta.env?.VITE_API_URL ?? "http://localhost:8000";

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

/** Respuesta paginada estándar DRF */
export type PageResp<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

/** Parámetros de listado (paginación + filtros comunes) */
export type ListPlanTasksParams = {
  page?: number;        // ?page=1
  page_size?: number;   // ?page_size=25
  search?: string;      // ?search=texto
  ordering?: string;    // ?ordering=name | -name | created_at | -created_at ...
  active?: boolean;     // ?active=true/false
  plan?: number;        // ?plan=ID (si tu ViewSet lo soporta como filtro)
};

/* =======================
   Cliente Axios
======================= */

const PlanTaskApi: AxiosInstance = axios.create({
  baseURL: `${API}/api/plan-tasks/`, // barra final como en users.ts
});

/* =======================
   Helpers
======================= */

const ensureId = (id: number | string) => {
  if (id === null || id === undefined || id === "") {
    throw new Error("El id es requerido.");
  }
  return id;
};

/* =======================
   Listado PAGINADO
======================= */

/** GET /api/plan-tasks/?page=&page_size=&search=&ordering=&active=&plan= */
export const getPlanTasks = async (params: ListPlanTasksParams = {}) => {
  const res = await PlanTaskApi.get<PageResp<PlanTask>>("", { params });
  return res.data; // ⬅️ devolvemos data (no AxiosResponse), igual que users.ts
};

/** Navegar usando URL absoluta de DRF (next/previous) */
export const getPlanTasksByUrl = async (url: string) => {
  const res = await axios.get<PageResp<PlanTask>>(url);
  return res.data;
};

/* =======================
   CRUD BASE
======================= */

// (Opcional) SIN paginar — mantenlo si en algún sitio lo consumes así
export const getAllPlanTasks = () => PlanTaskApi.get<PlanTask[]>("");

// GET /api/plan-tasks/{id}/
export const getPlanTask = (id: number | string) =>
  PlanTaskApi.get<PlanTask>(`${ensureId(id)}/`);

// POST /api/plan-tasks/
export const createPlanTask = (payload: CreatePlanTaskDTO) =>
  PlanTaskApi.post<PlanTask>("", payload);

// PUT /api/plan-tasks/{id}/
export const updatePlanTask = (id: number | string, payload: UpdatePlanTaskDTO) =>
  PlanTaskApi.put<PlanTask>(`${ensureId(id)}/`, payload);

// PATCH /api/plan-tasks/{id}/
export const partialUpdatePlanTask = (id: number | string, payload: UpdatePlanTaskDTO) =>
  PlanTaskApi.patch<PlanTask>(`${ensureId(id)}/`, payload);

// DELETE /api/plan-tasks/{id}/
export const deletePlanTask = (id: number | string) =>
  PlanTaskApi.delete<void>(`${ensureId(id)}/`);

// POST /api/plan-tasks/{id}/restore/
export const restorePlanTask = (id: number | string) =>
  PlanTaskApi.post<PlanTask>(`${ensureId(id)}/restore/`);

/* =======================
   ENDPOINTS PERSONALIZADOS
======================= */

/** NO paginado (como lo tenías):
 *  GET /api/plan-tasks/by-plan/{plan_id}/?active=true
 */
export const getTasksByPlan = (planId: number | string, onlyActive = false) =>
  PlanTaskApi.get<PlanTask[]>(`by-plan/${planId}/`, {
    params: onlyActive ? { active: "true" } : {},
  });

/** Paginado (si tu backend lo expone igual pero con DRF pagination):
 *  GET /api/plan-tasks/by-plan/{plan_id}/?page=&page_size=&search=&ordering=&active=
 */
export const getTasksByPlanPaged = async (
  planId: number | string,
  params: Omit<ListPlanTasksParams, "plan"> = {}
) => {
  const res = await PlanTaskApi.get<PageResp<PlanTask>>(`by-plan/${planId}/`, {
    params,
  });
  return res.data;
};

/** Crear tarea ligada a plan:
 *  POST /api/plan-tasks/by-plan/{plan_id}/  (incluye plan en el body)
 */
export const createTaskByPlan = (
  planId: number | string,
  payload: Omit<CreatePlanTaskDTO, "plan">
) => PlanTaskApi.post<PlanTask>(`by-plan/${planId}/`, {
  ...payload,
  plan: Number(planId),
});
