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

export type UpdateTaskCompletedPATCH = Partial<CreateTaskCompletedDTO>; // para PATCH

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
  // withCredentials: true, // <- habilítalo si usas cookies de sesión
});

/* ====================== Listado paginado ====================== */
export const getTasksCompleted = async (params: Record<string, any> = {}) => {
  const res = await TasksCompletedApi.get<PageResp<TaskCompleted>>("", { params });
  return res.data;
};

export const getTasksCompletedByUrl = async (url: string) => {
  const res = await axios.get<PageResp<TaskCompleted>>(url);
  return res.data;
};

/* ====================== CRUD ====================== */
export const getTaskCompleted = (id: number | string) =>
  TasksCompletedApi.get<TaskCompleted>(`${id}/`);

export const createTaskCompleted = (payload: CreateTaskCompletedDTO) =>
  TasksCompletedApi.post<TaskCompleted>("", payload);

// PATCH parcial (no exige 'visit')
export const updateTaskCompletedPatch = (
  id: number | string,
  payload: UpdateTaskCompletedPATCH
) => TasksCompletedApi.patch<TaskCompleted>(`${id}/`, payload);

// PUT completo (exige 'visit' y el resto de campos necesarios)
export const updateTaskCompleted = (
  id: number | string,
  payload: CreateTaskCompletedDTO
) => TasksCompletedApi.put<TaskCompleted>(`${id}/`, payload);

export const deleteTaskCompleted = (id: number | string) =>
  TasksCompletedApi.delete<void>(`${id}/`);

/* ====================== Relacionales ====================== */
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
export const restoreTaskCompleted = (id: number | string) =>
  TasksCompletedApi.post<TaskCompleted>(`${id}/restore/`);

export const markCompleted = (id: number | string, completed = true) =>
  updateTaskCompletedPatch(id, { completada: completed });

export const toggleCompleted = async (item: TaskCompleted) => {
  const next = !item.completada;
  return markCompleted(item.id, next);
};
