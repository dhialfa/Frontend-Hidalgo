// src/api/materialsUsed.ts
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const URL = "http://localhost:8000";

/* ====================== Tipos (acorde a tu backend actual) ====================== */
export interface MaterialUsed {
  id: number;
  visit: number;                  // FK a la visita
  description: string;            // descripción del material
  unit: string | number;          // cantidades usadas (viene como string desde el backend)
  unit_cost: string | number;     // costo unitario (también suele venir como string)
  created_at?: string;
  updated_at?: string;
}

export interface CreateMaterialUsedDTO {
  visit: number | string;
  description: string;
  unit: string | number;
  unit_cost: string | number;
}

export type UpdateMaterialUsedDTO = Partial<CreateMaterialUsedDTO>;

/* ====================== Axios Instance ====================== */
// OJO: plural correcto "materials-used"
const MaterialsUsedApi: AxiosInstance = axios.create({
  baseURL: `${URL}/api/material-used`,
});

/* ====================== Helpers ====================== */
function normalizePayload<T extends { unit?: any; unit_cost?: any }>(p: T): T {
  // Normaliza a string para evitar problemas con serializers que esperan string/decimal
  const out: any = { ...p };
  if (out.unit !== undefined && out.unit !== null) out.unit = String(out.unit);
  if (out.unit_cost !== undefined && out.unit_cost !== null) out.unit_cost = String(out.unit_cost);
  return out;
}

/** Calcula total localmente cuando unit representa cantidad y unit_cost el costo unitario */
export const computeTotal = (m: { unit?: number | string; unit_cost?: number | string }) =>
  (Number(m.unit) || 0) * (Number(m.unit_cost) || 0);

/* ====================== CRUD ====================== */

// GET /materials-used/
export const getAllMaterialsUsed = () =>
  MaterialsUsedApi.get<MaterialUsed[]>("/");

// GET /materials-used/{id}/
export const getMaterialUsed = (id: number | string) =>
  MaterialsUsedApi.get<MaterialUsed>(`${id}/`);

// POST /materials-used/  (incluye visit obligatoriamente)
export const createMaterialUsed = (payload: CreateMaterialUsedDTO) =>
  MaterialsUsedApi.post<MaterialUsed>("/", normalizePayload(payload));

// PUT /materials-used/{id}/  (incluye visit si tu backend lo exige para PUT)
export const updateMaterialUsed = (
  id: number | string,
  payload: UpdateMaterialUsedDTO
) => MaterialsUsedApi.put<MaterialUsed>(`${id}/`, normalizePayload(payload));

// PATCH /materials-used/{id}/  (alternativa más flexible)
export const patchMaterialUsed = (
  id: number | string,
  payload: UpdateMaterialUsedDTO
) => MaterialsUsedApi.patch<MaterialUsed>(`${id}/`, normalizePayload(payload));

// DELETE /materials-used/{id}/
export const deleteMaterialUsed = (id: number | string) =>
  MaterialsUsedApi.delete<void>(`${id}/`);

/* ====================== RELACIONALES ====================== */

export const getMaterialsUsedByVisit = (visitId: number | string, config?: AxiosRequestConfig) =>
  MaterialsUsedApi.get<MaterialUsed[]>("/", { params: { visit: visitId }, ...(config || {}) });

export const createMaterialUsedByVisit = (
  visitId: number | string,
  payload: Omit<CreateMaterialUsedDTO, "visit">
) =>
  MaterialsUsedApi.post<MaterialUsed>(
    "/",
    normalizePayload({ ...payload, visit: Number(visitId) })
  );

export const restoreMaterialUsed = (id: number | string) =>
  MaterialsUsedApi.post<MaterialUsed>(`${id}/restore/`);
