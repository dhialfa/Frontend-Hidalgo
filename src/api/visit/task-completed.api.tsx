// src/api/tasksCompleted.ts
import axios, { AxiosInstance } from "axios";

const URL = "http://localhost:8000";

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

// Para crear
export interface CreateTaskCompletedDTO {
  visit: number | string;
  plan_task?: number | null;
  name: string;
  description?: string;
  hours?: number;
  completada?: boolean;          
}

// Para actualizar (parcial)
export type UpdateTaskCompletedDTO = Partial<CreateTaskCompletedDTO>;

const TasksCompletedApi: AxiosInstance = axios.create({
  baseURL: `${URL}/api/task-completed`,
});

// ====================== CRUD ======================

// GET /tasks-completed/
export const getAllTasksCompleted = () =>
  TasksCompletedApi.get<TaskCompleted[]>("/");

// GET /tasks-completed/{id}/
export const getTaskCompleted = (id: number | string) =>
  TasksCompletedApi.get<TaskCompleted>(`${id}/`);

// POST /tasks-completed/
export const createTaskCompleted = (payload: CreateTaskCompletedDTO) =>
  TasksCompletedApi.post<TaskCompleted>("/", payload);

// PUT /tasks-completed/{id}/
export const updateTaskCompleted = (
  id: number | string,
  payload: UpdateTaskCompletedDTO
) => TasksCompletedApi.put<TaskCompleted>(`${id}/`, payload);

// PATCH /tasks-completed/{id}/
export const patchTaskCompleted = (
  id: number | string,
  payload: UpdateTaskCompletedDTO
) => TasksCompletedApi.patch<TaskCompleted>(`${id}/`, payload);

// DELETE /tasks-completed/{id}/
export const deleteTaskCompleted = (id: number | string) =>
  TasksCompletedApi.delete<void>(`${id}/`);

// ====================== RELACIONALES ======================

// GET /tasks-completed/by-visit/{visit_id}/
export const getTasksCompletedByVisit = (visitId: number | string) =>
  TasksCompletedApi.get<TaskCompleted[]>(`/by-visit/${visitId}/`);

// POST /tasks-completed/by-visit/{visit_id}/
export const createTaskCompletedByVisit = (
  visitId: number | string,
  payload: Omit<CreateTaskCompletedDTO, "visit">
) => TasksCompletedApi.post<TaskCompleted>(`/by-visit/${visitId}/`, payload);

// ====================== ACCIONES ======================

// POST /tasks-completed/{id}/restore/
export const restoreTaskCompleted = (id: number | string) =>
  TasksCompletedApi.post<TaskCompleted>(`${id}/restore/`);

// ====================== HELPERS UI ======================

/** Marca una tarea como completada (idempotente si tu API lo permite). */
export const markCompleted = (id: number | string, completed = true) =>
  patchTaskCompleted(id, { completada: completed });

/** Cambia el estado de completada a lo contrario (útil en la UI). */
export const toggleCompleted = async (item: TaskCompleted) => {
  const next = !item.completada;
  return markCompleted(item.id, next);
};
