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
  // OJO: barra final para evitar 301/404 en DRF
  baseURL: `${URL}/api/users`,
});

// GET /api/users/
export const getAllUsers = () =>
  UserApi.get<User[]>("/");

// GET /api/users/:id/
export const getUser = (id: number | string) =>
  UserApi.get<User>(`${id}/`);

// POST /api/users/
export const createUser = (user: CreateUserDTO) =>
  UserApi.post<User>("/", user);

// PUT /api/users/:id/
export const updateUser = (id: number | string, user: UpdateUserDTO) =>
  UserApi.put<User>(`${id}/`, user);

// DELETE /api/users/:id/
export const deleteUser = (id: number | string) =>
  UserApi.delete<void>(`${id}/`);
