import axios, { AxiosInstance } from "axios";

const URL = import.meta.env?.VITE_API_URL ?? "http://localhost:8000";

export interface CustomerContact {
  id: number;
  customer: number; // id del cliente
  name: string;
  email: string;
  phone: string;
  is_main: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
}

export interface CreateContactDTO {
  customer?: number; // opcional: no se requiere cuando se usa /by-customer/:id/
  name: string;
  email: string;
  phone: string;
  is_main?: boolean;
}

export type UpdateContactDTO = Partial<CreateContactDTO>;

const CustomerContactApi: AxiosInstance = axios.create({
  baseURL: `${URL}/api/customer-contact`,
});

/* =======================
   CRUD BASE
======================= */

// GET /api/customer-contact/
export const getAllCustomerContacts = () =>
  CustomerContactApi.get<CustomerContact[]>("/");

// GET /api/customer-contact/:id/
export const getCustomerContact = (id: number | string) =>
  CustomerContactApi.get<CustomerContact>(`/${id}/`);

// POST /api/customer-contact/
export const createCustomerContact = (payload: CreateContactDTO) =>
  CustomerContactApi.post<CustomerContact>("/", payload);

// PUT /api/customer-contact/:id/
export const updateCustomerContact = (
  id: number | string,
  payload: UpdateContactDTO
) => CustomerContactApi.put<CustomerContact>(`/${id}/`, payload);

// DELETE /api/customer-contact/:id/
export const deleteCustomerContact = (id: number | string) =>
  CustomerContactApi.delete<void>(`/${id}/`);

/* =======================
   ENDPOINT PERSONALIZADO
======================= */

// GET /api/customer-contact/by-customer/:id/
export const getContactsByCustomer = (
  customerId: number | string,
  onlyMain = false
) =>
  CustomerContactApi.get<CustomerContact[]>(
    `/by-customer/${customerId}/`,
    { params: onlyMain ? { only_main: "true" } : {} }
  );

// POST /api/customer-contact/by-customer/:id/
export const createContactByCustomer = (
  customerId: number | string,
  payload: Omit<CreateContactDTO, "customer">
) =>
  CustomerContactApi.post<CustomerContact>(
    `/by-customer/${customerId}/`,
    payload
  );
