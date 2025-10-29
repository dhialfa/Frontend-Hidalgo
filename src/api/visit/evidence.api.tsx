// src/api/evidences.ts
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const API = import.meta.env?.VITE_API_URL ?? "http://localhost:8000";

/* ====================== Tipos ====================== */
export interface Evidence {
  id: number;
  visit: number;                   // FK a la visita
  file: string;                    // URL absoluta del archivo
  description?: string;
  subido_en: string;               // ISO datetime
}

export interface CreateEvidenceDTO {
  visit: number | string;
  file: File | Blob;
  description?: string;
}

export interface UpdateEvidenceDTO {
  visit?: number | string;
  file?: File | Blob;
  description?: string;
}

/** Respuesta paginada estándar DRF */
export type PageResp<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

const EvidenceApi: AxiosInstance = axios.create({
  baseURL: `${API}/api/evidence/`, // plural + barra final
});

/* ====================== CRUD ====================== */

// GET /api/evidences/?page=&page_size=&ordering=&search=
export const getEvidences = async (params: Record<string, any> = {}) => {
  const res = await EvidenceApi.get<PageResp<Evidence>>("", { params });
  return res.data;
};

// GET /api/evidences/{id}/
export const getEvidence = (id: number | string) =>
  EvidenceApi.get<Evidence>(`${id}/`);

// POST /api/evidences/
export const createEvidence = (payload: CreateEvidenceDTO) => {
  const form = new FormData();
  form.append("visit", String(payload.visit));
  form.append("file", payload.file);
  if (payload.description) form.append("description", payload.description);
  const cfg: AxiosRequestConfig = { headers: { "Content-Type": "multipart/form-data" } };
  return EvidenceApi.post<Evidence>("", form, cfg);
};

// PUT /api/evidences/{id}/
export const updateEvidence = (id: number | string, payload: UpdateEvidenceDTO) => {
  if (payload.file instanceof File || payload.file instanceof Blob) {
    const form = new FormData();
    if (payload.visit != null) form.append("visit", String(payload.visit));
    form.append("file", payload.file);
    if (payload.description) form.append("description", payload.description);
    const cfg: AxiosRequestConfig = { headers: { "Content-Type": "multipart/form-data" } };
    return EvidenceApi.put<Evidence>(`${id}/`, form, cfg);
  }
  const { file, ...json } = payload;
  return EvidenceApi.put<Evidence>(`${id}/`, json);
};

// PATCH /api/evidences/{id}/
export const patchEvidence = (id: number | string, payload: UpdateEvidenceDTO) => {
  if (payload.file instanceof File || payload.file instanceof Blob) {
    const form = new FormData();
    if (payload.visit != null) form.append("visit", String(payload.visit));
    form.append("file", payload.file);
    if (payload.description) form.append("description", payload.description);
    const cfg: AxiosRequestConfig = { headers: { "Content-Type": "multipart/form-data" } };
    return EvidenceApi.patch<Evidence>(`${id}/`, form, cfg);
  }
  const { file, ...json } = payload;
  return EvidenceApi.patch<Evidence>(`${id}/`, json);
};

// DELETE /api/evidences/{id}/
export const deleteEvidence = (id: number | string) =>
  EvidenceApi.delete<void>(`${id}/`);

/* ====================== RELACIONALES ====================== */

// GET paginado /api/evidences/by-visit/{visit_id}/?page=&page_size=
export const getEvidencesByVisitPaged = async (
  visitId: number | string,
  params: Record<string, any> = {}
) => {
  const res = await EvidenceApi.get<PageResp<Evidence>>(`by-visit/${visitId}/`, { params });
  return res.data;
};

/** Helper: trae TODAS las páginas (ideal para carrusel sin paginación) */
export const getEvidencesByVisitAll = async (
  visitId: number | string,
  params: Record<string, any> = {}
): Promise<Evidence[]> => {
  const first = await getEvidencesByVisitPaged(visitId, {
    page: 1,
    page_size: params.page_size ?? 50,
    ...params,
  });
  let acc: Evidence[] = [...first.results];
  let next = first.next;
  while (next) {
    const res = await axios.get<PageResp<Evidence>>(next);
    acc = acc.concat(res.data.results);
    next = res.data.next;
  }
  return acc;
};

/* ====================== ACCIONES ====================== */

// POST /api/evidences/{id}/restore/
export const restoreEvidence = (id: number | string) =>
  EvidenceApi.post<Evidence>(`${id}/restore/`);

/* ====================== HELPERS ====================== */

export const toCarouselItems = (list: Evidence[]) =>
  list.map((e) => ({
    id: e.id,
    src: e.file,
    alt: e.description ?? `Evidence ${e.id}`,
    caption: e.description,
    date: e.subido_en,
  }));
