// src/api/users.ts
import axios, { AxiosInstance } from "axios";

/** Usa tu .env: VITE_API_URL=http://localhost:8000 */
const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/* =========================
 * Tipos
 * ========================= */
export interface User {
  id: number;
  created_at?: string;
  updated_at?: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  rol?: string;
  is_staff?: boolean;
  is_active?: boolean;
  is_superuser?: boolean;
  last_login?: string;
  date_joined?: string;
}

/** Respuesta paginada estándar DRF */
export type PageResp<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

/** Parámetros de listado (paginación + filtros comunes) */
export type ListUsersParams = {
  page?: number;            // ?page=1
  page_size?: number;       // ?page_size=25
  search?: string;          // ?search=<texto>
  ordering?: string;        // ?ordering=username o ?ordering=-date_joined
  // agrega aquí filtros específicos si tu ViewSet los expone (e.g., is_active)
  is_active?: boolean;
  is_staff?: boolean;
  rol?: string;
};

export interface CreateUserDTO {
  username: string;
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  rol?: string;
  is_staff?: boolean;
  is_active?: boolean;
  is_superuser?: boolean;
}
export type UpdateUserDTO = Partial<CreateUserDTO>;

/* =========================
 * Axios instance
 * ========================= */
const UserApi: AxiosInstance = axios.create({
  baseURL: `${API}/api/users/`, // barra final importante
  // timeout: 15000,
});

// Si usas auth por JWT, puedes añadir:
// UserApi.interceptors.request.use((config) => {
//   const token = localStorage.getItem("access");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

/* =========================
 * Helpers
 * ========================= */
const ensureId = (id: number | string) => {
  if (id === null || id === undefined || id === "") {
    throw new Error("El id de usuario es requerido.");
  }
  return id;
};

/* =========================
 * Listado paginado
 * ========================= */

/** GET /api/users/?page=&page_size=&search=&ordering=... */
export const getUsers = async (params: ListUsersParams = {}) => {
  const res = await UserApi.get<PageResp<User>>("", { params });
  return res.data;
};

/** Navegar usando URL absoluta de DRF (next/previous) */
export const getUsersByUrl = async (url: string) => {
  // Permite consumir directly res.next/res.previous de DRF
  const res = await axios.get<PageResp<User>>(url);
  return res.data;
};

/* =========================
 * CRUD
 * ========================= */

// (No paginado) GET /api/users/  — devuelto como arreglo si desactivas paginación
export const getAllUsers = () => UserApi.get<User[]>("");

// GET /api/users/:id/
export const getUser = (id: number | string) =>
  UserApi.get<User>(`${ensureId(id)}/`);

// POST /api/users/
export const createUser = (user: CreateUserDTO) =>
  UserApi.post<User>("", user);

// PATCH /api/users/:id/
export const updateUser = (id: number | string, user: UpdateUserDTO) =>
  UserApi.patch<User>(`${ensureId(id)}/`, user);

// PUT /api/users/:id/
export const replaceUser = (id: number | string, user: CreateUserDTO) =>
  UserApi.put<User>(`${ensureId(id)}/`, user);

// DELETE /api/users/:id/
export const deleteUser = (id: number | string) =>
  UserApi.delete<void>(`${ensureId(id)}/`);
