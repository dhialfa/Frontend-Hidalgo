// src/api/customer-contact.ts
import axios, { AxiosInstance } from "axios";
import { getAccessToken } from "../auth/auth.api"; // 👈 ajusta la ruta si tu auth.ts está en otro lado

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/* =====================
 * Tipos
 * ===================== */
export interface CustomerContact {
  id: number;
  created_at: string;
  updated_at: string;
  customer: number;     // id del cliente
  name: string;
  email: string;
  phone: string;
  is_main: boolean;
  active: boolean;
  created_by?: number | null;
  updated_by?: number | null;
}

export interface CreateContactDTO {
  customer?: number;    // opcional si usas /by-customer/:id/
  name: string;
  email: string;
  phone?: string;       // opcional para calzar con tu modal (puede ir vacío)
  is_main?: boolean;
  active?: boolean;
}
export type UpdateContactDTO = Partial<CreateContactDTO>;

/** Respuesta paginada DRF */
export type PageResp<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

/** Parámetros de listado */
export type ListCustomerContactsParams = {
  page?: number;          // ?page=1
  page_size?: number;     // ?page_size=25
  search?: string;        // ?search=...
  ordering?: string;      // ?ordering=name | -name | email | -email
  // filtros expuestos en tu ViewSet/filterset_fields
  active?: boolean;
  is_main?: boolean;
  customer?: number | string;
};

/* =====================
 * Axios instance
 * ===================== */
// importante terminar con slash, igual que en tu ejemplo
const CustomerContactApi: AxiosInstance = axios.create({
  baseURL: `${API}/api/customer-contact/`,
  // timeout: 15000,
});

// 👉 Interceptor para meter el JWT en TODOS los requests
CustomerContactApi.interceptors.request.use((config) => {
  const token = getAccessToken();
  // console.log("[CustomerContactApi] token:", token);

  if (token) {
    const cfg: any = config;
    cfg.headers = cfg.headers || {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* =====================
 * Listado paginado (global)
 * ===================== */

// GET /api/customer-contact/?page=&page_size=&search=&ordering=...
export const getCustomerContacts = async (
  params: ListCustomerContactsParams = {},
) => {
  const res = await CustomerContactApi.get<PageResp<CustomerContact>>("", {
    params,
  });
  return res.data;
};

// Para consumir res.next / res.previous (URL absoluta de DRF)
export const getCustomerContactsByUrl = async (url: string) => {
  const res = await CustomerContactApi.get<PageResp<CustomerContact>>(url);
  return res.data;
};

/* =====================
 * Listado paginado por cliente
 * ===================== */

// GET /api/customer-contact/by-customer/:id/?page=&page_size=&search=&ordering=...
export const getContactsByCustomer = async (
  customerId: number | string,
  params: ListCustomerContactsParams = {},
  onlyMain = false,
) => {
  const q = { ...(onlyMain ? { only_main: "true" } : {}), ...params };
  const res = await CustomerContactApi.get<PageResp<CustomerContact>>(
    `by-customer/${customerId}/`,
    { params: q },
  );
  return res.data;
};

// Seguir next/previous cuando vienes de by-customer (DRF te da URL absoluta igual)
export const getContactsByCustomerByUrl = async (url: string) => {
  const res = await CustomerContactApi.get<PageResp<CustomerContact>>(url);
  return res.data;
};

/* =====================
 * CRUD (compatibles con paginación global)
 * ===================== */

// Si desactivas paginación global en DRF, este endpoint devolvería un arreglo.
// Con paginación global, evita usarlo; usa getCustomerContacts().
export const getAllCustomerContacts = () =>
  CustomerContactApi.get<CustomerContact[]>("");

// GET /api/customer-contact/:id/
export const getCustomerContact = (id: number | string) =>
  CustomerContactApi.get<CustomerContact>(`${id}/`);

// POST /api/customer-contact/
export const createCustomerContact = (payload: CreateContactDTO) =>
  CustomerContactApi.post<CustomerContact>("", payload);

// PATCH /api/customer-contact/:id/  (recomendado para edición parcial)
export const updateCustomerContact = (
  id: number | string,
  payload: UpdateContactDTO,
) => CustomerContactApi.patch<CustomerContact>(`${id}/`, payload);

// DELETE /api/customer-contact/:id/
export const deleteCustomerContact = (id: number | string) =>
  CustomerContactApi.delete<void>(`${id}/`);

// POST /api/customer-contact/by-customer/:id/  (crear sin enviar customer en el body)
export const createContactByCustomer = (
  customerId: number | string,
  payload: Omit<CreateContactDTO, "customer">,
) =>
  CustomerContactApi.post<CustomerContact>(
    `by-customer/${customerId}/`,
    payload,
  );
