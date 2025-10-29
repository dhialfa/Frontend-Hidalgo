// src/api/tasksCompleted.ts
import axios, { AxiosInstance } from "axios";

/** Usa tu .env: VITE_API_URL=http://localhost:8000 */
const API = import.meta.env?.VITE_API_URL ?? "http://localhost:8000";

/* ====================== Tipos ====================== */
export interface TaskCompleted {
  id: number;
  visit: number;
  plan_task?: number | null;
  name: string;
  description?: string;
  hours?: number;
  completada: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTaskCompletedDTO {
  visit: number | string;
  plan_task?: number | null;
  name: string;
  description?: string;
  hours?: number;
  completada?: boolean;
}

export type UpdateTaskCompletedDTO = Partial<CreateTaskCompletedDTO>;

/** Respuesta paginada estándar DRF */
export type PageResp<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

/* ====================== Axios ====================== */
const TasksCompletedApi: AxiosInstance = axios.create({
  baseURL: `${API}/api/task-completed/`, // barra final importante
});

/* ====================== Listado paginado ====================== */
/** GET /api/task-completed/?page=&page_size=&ordering=&search=... */
export const getTasksCompleted = async (params: Record<string, any> = {}) => {
  const res = await TasksCompletedApi.get<PageResp<TaskCompleted>>("", { params });
  return res.data;
};

/** Navegar usando URL absoluta de DRF (next/previous) */
export const getTasksCompletedByUrl = async (url: string) => {
  const res = await axios.get<PageResp<TaskCompleted>>(url);
  return res.data;
};

/* ====================== CRUD ====================== */
// GET /api/task-completed/{id}/
export const getTaskCompleted = (id: number | string) =>
  TasksCompletedApi.get<TaskCompleted>(`${id}/`);

// POST /api/task-completed/
export const createTaskCompleted = (payload: CreateTaskCompletedDTO) =>
  TasksCompletedApi.post<TaskCompleted>("", payload);

// PATCH /api/task-completed/{id}/
export const patchTaskCompleted = (id: number | string, payload: UpdateTaskCompletedDTO) =>
  TasksCompletedApi.patch<TaskCompleted>(`${id}/`, payload);

// PUT /api/task-completed/{id}/
export const updateTaskCompleted = (id: number | string, payload: UpdateTaskCompletedDTO) =>
  TasksCompletedApi.put<TaskCompleted>(`${id}/`, payload);

// DELETE /api/task-completed/{id}/
export const deleteTaskCompleted = (id: number | string) =>
  TasksCompletedApi.delete<void>(`${id}/`);

/* ====================== Relacionales ====================== */
/** GET paginado /api/task-completed/by-visit/{visit_id}/?page=&page_size=&ordering= */
export const getTasksCompletedByVisitPaged = async (
  visitId: number | string,
  params: Record<string, any> = {}
) => {
  const res = await TasksCompletedApi.get<PageResp<TaskCompleted>>(
    `by-visit/${visitId}/`,
    { params }
  );
  return res.data;
};

/** Helper: trae TODAS las páginas por visita (útil para UI sin paginar) */
export const getTasksCompletedByVisitAll = async (
  visitId: number | string,
  params: Record<string, any> = {}
): Promise<TaskCompleted[]> => {
  const first = await getTasksCompletedByVisitPaged(visitId, {
    page: 1,
    page_size: params.page_size ?? 50,
    ...params,
  });
  let acc: TaskCompleted[] = [...first.results];
  let next = first.next;
  while (next) {
    const res = await axios.get<PageResp<TaskCompleted>>(next);
    acc = acc.concat(res.data.results);
    next = res.data.next;
  }
  return acc;
};

/* ====================== Acciones ====================== */
// POST /api/task-completed/{id}/restore/
export const restoreTaskCompleted = (id: number | string) =>
  TasksCompletedApi.post<TaskCompleted>(`${id}/restore/`);

/** Marca una tarea como completada (idempotente si tu API lo permite). */
export const markCompleted = (id: number | string, completed = true) =>
  patchTaskCompleted(id, { completada: completed });

/** Cambia el estado 'completada' a lo contrario (útil en la UI). */
export const toggleCompleted = async (item: TaskCompleted) => {
  const next = !item.completada;
  return markCompleted(item.id, next);
};
