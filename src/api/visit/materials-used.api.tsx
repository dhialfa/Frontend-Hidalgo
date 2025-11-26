// src/api/materialsUsed.ts
import axios, { AxiosInstance } from "axios";
import { getAccessToken } from "../auth/auth.api"; // 👈 ajusta la ruta si tu auth.ts está en otro lado

const API = import.meta.env?.VITE_API_URL ?? "http://localhost:8000";

/* ====================== Tipos ====================== */
export interface MaterialUsed {
  id: number;
  visit: number;                 // FK a la visita
  description: string;
  unit: string | number;         // suele venir como string/decimal desde DRF
  unit_cost: string | number;    // idem
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreateMaterialUsedDTO {
  visit: number | string;
  description: string;
  unit: string | number;
  unit_cost: string | number;
}

export interface UpdateMaterialUsedDTO {
  visit?: number | string;
  description?: string;
  unit?: string | number;
  unit_cost?: string | number;
}

/** Respuesta paginada estándar DRF */
export type PageResp<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

/* Helpers */
const normalizePayload = <
  T extends { unit?: any; unit_cost?: any; visit?: any }
>(p: T): T => {
  const out: any = { ...p };
  if (out.unit !== undefined && out.unit !== null)
    out.unit = String(out.unit);
  if (out.unit_cost !== undefined && out.unit_cost !== null)
    out.unit_cost = String(out.unit_cost);
  if (out.visit !== undefined && out.visit !== null)
    out.visit = Number(out.visit);
  return out;
};

/** Total local (cantidad * costo) */
export const computeTotal = (m: {
  unit?: number | string;
  unit_cost?: number | string;
}) => (Number(m.unit) || 0) * (Number(m.unit_cost) || 0);

const MaterialsApi: AxiosInstance = axios.create({
  baseURL: `${API}/api/material-used/`, // plural + barra final
});

// 🔐 Interceptor: mete el JWT en TODOS los requests de este módulo
MaterialsApi.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    const cfg: any = config;
    cfg.headers = cfg.headers || {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ====================== CRUD ====================== */

// GET /api/materials-used/?page=&page_size=&ordering=&search=
export const getMaterialsUsed = async (params: Record<string, any> = {}) => {
  const res = await MaterialsApi.get<PageResp<MaterialUsed>>("", { params });
  return res.data;
};

// GET /api/materials-used/{id}/
export const getMaterialUsed = (id: number | string) =>
  MaterialsApi.get<MaterialUsed>(`${id}/`);

// POST /api/materials-used/
export const createMaterialUsed = (payload: CreateMaterialUsedDTO) =>
  MaterialsApi.post<MaterialUsed>("", normalizePayload(payload));

// PUT /api/materials-used/{id}/
export const updateMaterialUsed = (
  id: number | string,
  payload: UpdateMaterialUsedDTO,
) =>
  MaterialsApi.put<MaterialUsed>(
    `${id}/`,
    normalizePayload(payload),
  );

// PATCH /api/materials-used/{id}/
export const patchMaterialUsed = (
  id: number | string,
  payload: UpdateMaterialUsedDTO,
) =>
  MaterialsApi.patch<MaterialUsed>(
    `${id}/`,
    normalizePayload(payload),
  );

// DELETE /api/materials-used/{id}/
export const deleteMaterialUsed = (id: number | string) =>
  MaterialsApi.delete<void>(`${id}/`);

/* ====================== RELACIONALES ====================== */

// GET paginado /api/materials-used/by-visit/{visit_id}/?page=&page_size=
export const getMaterialsUsedByVisitPaged = async (
  visitId: number | string,
  params: Record<string, any> = {},
) => {
  const res = await MaterialsApi.get<PageResp<MaterialUsed>>(
    `by-visit/${visitId}/`,
    { params },
  );
  return res.data;
};

/** Helper: trae TODAS las páginas (útil si no quieres paginar en el modal) */
export const getMaterialsUsedByVisitAll = async (
  visitId: number | string,
  params: Record<string, any> = {},
): Promise<MaterialUsed[]> => {
  const first = await getMaterialsUsedByVisitPaged(visitId, {
    page: 1,
    page_size: params.page_size ?? 50,
    ...params,
  });

  let acc: MaterialUsed[] = [...first.results];
  let next = first.next;

  while (next) {
    // usamos MaterialsApi para seguir enviando Authorization
    const res = await MaterialsApi.get<PageResp<MaterialUsed>>(next);
    acc = acc.concat(res.data.results);
    next = res.data.next;
  }

  return acc;
};

/* ====================== ACCIONES ====================== */

// POST /api/materials-used/{id}/restore/
export const restoreMaterialUsed = (id: number | string) =>
  MaterialsApi.post<MaterialUsed>(`${id}/restore/`);
