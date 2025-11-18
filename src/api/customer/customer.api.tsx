// src/api/customers.ts
import axios, {
  AxiosInstance,
  AxiosHeaders,
} from "axios";
import { getAccessToken } from "../auth/auth.api"; // ajusta ruta si hace falta

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// =====================
// Tipos
// =====================
export interface Customer {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  identification: string;
  email: string;
  phone: string;
  direction: string;
  location: string;
  active: boolean;
}

export interface CreateCustomerDTO {
  name: string;
  identification: string;
  email?: string;
  phone?: string;
  direction?: string;
  location?: string;
  active?: boolean;
}
export type UpdateCustomerDTO = Partial<CreateCustomerDTO>;

// Respuesta paginada DRF
export type PageResp<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

// Parámetros de listado
export type ListCustomersParams = {
  page?: number;        // ?page=1
  page_size?: number;   // ?page_size=25
  search?: string;      // ?search=...
  ordering?: string;    // ?ordering=name | -name | identification | -identification
  active?: boolean;
  identification?: string;
};

// =====================
// Axios instance
// =====================
const CustomerApi: AxiosInstance = axios.create({
  baseURL: `${API}/api/customers/`, // importante terminar con slash
  // timeout: 15000,
});

// 👉 Interceptor para adjuntar el JWT sin romper tipos
CustomerApi.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    // Si no hay headers, creamos unos nuevos de tipo AxiosHeaders
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }

    // Usamos AxiosHeaders#set para que TS esté contento
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      // fallback por si viene como objeto plano (alguna versión rara)
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// =====================
// Listado paginado
// =====================

// GET /api/customers/?page=&page_size=&search=&ordering=...
export const getCustomers = async (params: ListCustomersParams = {}) => {
  const res = await CustomerApi.get<PageResp<Customer>>("", { params });
  return res.data;
};

// Para consumir res.next / res.previous (URL absoluta de DRF)
export const getCustomersByUrl = async (url: string) => {
  const res = await CustomerApi.get<PageResp<Customer>>(url);
  return res.data;
};

// =====================
// CRUD
// =====================

export const getAllCustomers = () => CustomerApi.get<Customer[]>("");

// GET /api/customers/:id/
export const getCustomer = (id: number | string) =>
  CustomerApi.get<Customer>(`${id}/`);

// POST /api/customers/
export const createCustomer = (customer: CreateCustomerDTO) =>
  CustomerApi.post<Customer>("", customer);

// PATCH /api/customers/:id/
export const updateCustomer = (
  id: number | string,
  customer: UpdateCustomerDTO,
) => CustomerApi.patch<Customer>(`${id}/`, customer);

// DELETE /api/customers/:id/
export const deleteCustomer = (id: number | string) =>
  CustomerApi.delete<void>(`${id}/`);
