// src/api/evidences.ts
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const URL = "http://localhost:8000";

// ====================== Tipos ======================
export interface Evidence {
  id: number;
  visit: number;                   // FK a la visita
  file: string;                    // URL absoluta del archivo
  description?: string;
  subido_en: string;               // ISO datetime
}

// Para crear (archivo requerido)
export interface CreateEvidenceDTO {
  visit: number | string;
  file: File | Blob;
  description?: string;
}

// Para actualizar (archivo opcional)
export interface UpdateEvidenceDTO {
  visit?: number | string;
  file?: File | Blob;
  description?: string;
}

const EvidenceApi: AxiosInstance = axios.create({
  baseURL: `${URL}/api/evidences`,
});

// ====================== CRUD ======================

// GET /evidences/
export const getAllEvidences = () =>
  EvidenceApi.get<Evidence[]>("/");

// GET /evidences/{id}/
export const getEvidence = (id: number | string) =>
  EvidenceApi.get<Evidence>(`${id}/`);

// POST /evidences/
export const createEvidence = (payload: CreateEvidenceDTO) => {
  const form = new FormData();
  form.append("visit", String(payload.visit));
  form.append("file", payload.file);
  if (payload.description) form.append("description", payload.description);

  const cfg: AxiosRequestConfig = {
    headers: { "Content-Type": "multipart/form-data" },
  };
  return EvidenceApi.post<Evidence>("/", form, cfg);
};

// PUT /evidences/{id}/
export const updateEvidence = (id: number | string, payload: UpdateEvidenceDTO) => {
  if (payload.file instanceof File || payload.file instanceof Blob) {
    const form = new FormData();
    if (payload.visit != null) form.append("visit", String(payload.visit));
    form.append("file", payload.file);
    if (payload.description) form.append("description", payload.description);
    const cfg: AxiosRequestConfig = {
      headers: { "Content-Type": "multipart/form-data" },
    };
    return EvidenceApi.put<Evidence>(`${id}/`, form, cfg);
  }
  const { file, ...json } = payload;
  return EvidenceApi.put<Evidence>(`${id}/`, json);
};

// PATCH /evidences/{id}/
export const patchEvidence = (id: number | string, payload: UpdateEvidenceDTO) => {
  if (payload.file instanceof File || payload.file instanceof Blob) {
    const form = new FormData();
    if (payload.visit != null) form.append("visit", String(payload.visit));
    form.append("file", payload.file);
    if (payload.description) form.append("description", payload.description);
    const cfg: AxiosRequestConfig = {
      headers: { "Content-Type": "multipart/form-data" },
    };
    return EvidenceApi.patch<Evidence>(`${id}/`, form, cfg);
  }
  const { file, ...json } = payload;
  return EvidenceApi.patch<Evidence>(`${id}/`, json);
};

// DELETE /evidences/{id}/
export const deleteEvidence = (id: number | string) =>
  EvidenceApi.delete<void>(`${id}/`);

// ====================== RELACIONALES ======================

// GET /evidences/by-visit/{visit_id}/
export const getEvidencesByVisit = (visitId: number | string) =>
  EvidenceApi.get<Evidence[]>(`/by-visit/${visitId}/`);

// POST /evidences/by-visit/{visit_id}/
export const createEvidenceByVisit = (visitId: number | string, payload: Omit<CreateEvidenceDTO, "visit">) => {
  const form = new FormData();
  form.append("file", payload.file);
  if (payload.description) form.append("description", payload.description);

  const cfg: AxiosRequestConfig = {
    headers: { "Content-Type": "multipart/form-data" },
  };
  return EvidenceApi.post<Evidence>(`/by-visit/${visitId}/`, form, cfg);
};

// ====================== ACCIONES ======================

// POST /evidences/{id}/restore/
export const restoreEvidence = (id: number | string) =>
  EvidenceApi.post<Evidence>(`${id}/restore/`);

// ====================== HELPERS ======================

// Convierte la lista a formato para carrusel de imágenes
export const toCarouselItems = (list: Evidence[]) =>
  list.map((e) => ({
    id: e.id,
    src: e.file,
    alt: e.description ?? `Evidence ${e.id}`,
    caption: e.description,
    date: e.subido_en,
  }));
