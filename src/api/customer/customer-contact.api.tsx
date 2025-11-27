// src/api/customer-contact.ts
import axios, { AxiosInstance } from "axios";
import { getAccessToken } from "../auth/auth.api";

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
  customer?: number;
  name: string;
  email: string;
  phone?: string;
  is_main?: boolean;
  active?: boolean;
}
export type UpdateContactDTO = Partial<CreateContactDTO>;

export type PageResp<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ListCustomerContactsParams = {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  active?: boolean;
  is_main?: boolean;
  customer?: number | string;
};

/* =====================
 * Axios instance
 * ===================== */
const CustomerContactApi: AxiosInstance = axios.create({
  baseURL: `${API}/api/customer-contact/`,
});

CustomerContactApi.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    const cfg: any = config;
    cfg.headers = cfg.headers || {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* =====================
 * Listado
 * ===================== */

export const getCustomerContacts = async (
  params: ListCustomerContactsParams = {},
) => {
  const res = await CustomerContactApi.get<PageResp<CustomerContact>>("", {
    params,
  });
  return res.data; // 👈 aquí devolvemos data
};

export const getCustomerContactsByUrl = async (url: string) => {
  // si `url` es absoluto de DRF, mejor usar axios directo:
  const res = await axios.get<PageResp<CustomerContact>>(url);
  return res.data;
};

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
  return res.data; // 👈 data
};

export const getContactsByCustomerByUrl = async (url: string) => {
  const res = await axios.get<PageResp<CustomerContact>>(url);
  return res.data;
};

/* =====================
 * CRUD
 * ===================== */

export const getAllCustomerContacts = async () => {
  const res = await CustomerContactApi.get<CustomerContact[]>("");
  return res.data;
};

export const getCustomerContact = async (id: number | string) => {
  const res = await CustomerContactApi.get<CustomerContact>(`${id}/`);
  return res.data;
};

export const createCustomerContact = async (payload: CreateContactDTO) => {
  const res = await CustomerContactApi.post<CustomerContact>("", payload);
  return res.data; // 👈 data
};

export const updateCustomerContact = async (
  id: number | string,
  payload: UpdateContactDTO,
) => {
  const res = await CustomerContactApi.patch<CustomerContact>(`${id}/`, payload);
  return res.data; // 👈 data
};

export const deleteCustomerContact = async (id: number | string) => {
  await CustomerContactApi.delete<void>(`${id}/`);
};

// POST /api/customer-contact/by-customer/:id/
export const createContactByCustomer = async (
  customerId: number | string,
  payload: Omit<CreateContactDTO, "customer">,
) => {
  const res = await CustomerContactApi.post<CustomerContact>(
    `by-customer/${customerId}/`,
    payload,
  );
  return res.data; // 👈 data
};
