// src/api/users.ts
import axios, { AxiosInstance } from "axios";

const URL = "http://localhost:8000";

// Ajusta estos campos a lo que devuelve tu backend
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

// Para crear/actualizar
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

const UserApi: AxiosInstance = axios.create({
  // IMPORTANTE: barra final para DRF y para que `${id}/` quede bien.
  baseURL: `${URL}/api/users/`,
  // opcional:
  // timeout: 10000,
});

// Helpers
const ensureId = (id: number | string) => {
  if (id === null || id === undefined || id === "") {
    throw new Error("El id de usuario es requerido.");
  }
  return id;
};

// GET /api/users/
export const getAllUsers = () => UserApi.get<User[]>("");

// GET /api/users/:id/
export const getUser = (id: number | string) =>
  UserApi.get<User>(`${ensureId(id)}/`);

// POST /api/users/
export const createUser = (user: CreateUserDTO) =>
  UserApi.post<User>("", user);

// PATCH /api/users/:id/  (edición parcial recomendada)
export const updateUser = (id: number | string, user: UpdateUserDTO) =>
  UserApi.patch<User>(`${ensureId(id)}/`, user);

// PUT /api/users/:id/  (reemplazo completo, si lo necesitas)
export const replaceUser = (id: number | string, user: CreateUserDTO) =>
  UserApi.put<User>(`${ensureId(id)}/`, user);

// DELETE /api/users/:id/
export const deleteUser = (id: number | string) =>
  UserApi.delete<void>(`${ensureId(id)}/`);
