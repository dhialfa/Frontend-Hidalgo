// src/api/materialsUsed.ts
import axios, { AxiosInstance } from "axios";

const URL = "http://localhost:8000";

// ====================== Tipos ======================
export interface MaterialUsed {
  id: number;
  visit: number;                  // FK a la visita
  material?: number | null;       // (opcional) FK a catálogo de materiales
  name: string;                   // nombre libre si no usas catálogo
  description?: string;
  quantity: number;               // cantidad usada
  unit?: string;                  // p.ej. "m", "m²", "ud", "kg"
  unit_cost?: number;             // costo unitario
  total_cost?: number;            // costo total (si tu API lo calcula, puede venir ya lleno)
  created_at?: string;
  updated_at?: string;
}

export interface CreateMaterialUsedDTO {
  visit: number | string;
  material?: number | null;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_cost?: number;
  total_cost?: number;            // envíalo solo si tu API no lo calcula
}

export type UpdateMaterialUsedDTO = Partial<CreateMaterialUsedDTO>;

const MaterialsUsedApi: AxiosInstance = axios.create({
  baseURL: `${URL}/api/materials-used`,
});

// ====================== CRUD ======================

// GET /materials-used/
export const getAllMaterialsUsed = () =>
  MaterialsUsedApi.get<MaterialUsed[]>("/");

// GET /materials-used/{id}/
export const getMaterialUsed = (id: number | string) =>
  MaterialsUsedApi.get<MaterialUsed>(`${id}/`);

// POST /materials-used/
export const createMaterialUsed = (payload: CreateMaterialUsedDTO) =>
  MaterialsUsedApi.post<MaterialUsed>("/", payload);

// PUT /materials-used/{id}/
export const updateMaterialUsed = (
  id: number | string,
  payload: UpdateMaterialUsedDTO
) => MaterialsUsedApi.put<MaterialUsed>(`${id}/`, payload);

// PATCH /materials-used/{id}/
export const patchMaterialUsed = (
  id: number | string,
  payload: UpdateMaterialUsedDTO
) => MaterialsUsedApi.patch<MaterialUsed>(`${id}/`, payload);

// DELETE /materials-used/{id}/
export const deleteMaterialUsed = (id: number | string) =>
  MaterialsUsedApi.delete<void>(`${id}/`);

// ====================== RELACIONALES ======================

// GET /materials-used/by-visit/{visit_id}/
export const getMaterialsUsedByVisit = (visitId: number | string) =>
  MaterialsUsedApi.get<MaterialUsed[]>(`/by-visit/${visitId}/`);

// POST /materials-used/by-visit/{visit_id}/
export const createMaterialUsedByVisit = (
  visitId: number | string,
  payload: Omit<CreateMaterialUsedDTO, "visit">
) => MaterialsUsedApi.post<MaterialUsed>(`/by-visit/${visitId}/`, payload);

// ====================== ACCIONES ======================

// POST /materials-used/{id}/restore/
export const restoreMaterialUsed = (id: number | string) =>
  MaterialsUsedApi.post<MaterialUsed>(`${id}/restore/`);

// ====================== HELPERS UI ======================

/** Calcula total localmente si necesitas pre-visualizarlo en la UI */
export const computeTotal = (m: { quantity?: number; unit_cost?: number }) =>
  (Number(m.quantity) || 0) * (Number(m.unit_cost) || 0);
