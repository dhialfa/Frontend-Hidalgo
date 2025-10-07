// src/api/customers.ts
import axios, { AxiosInstance } from "axios";

const URL = "http://localhost:8000";

// Ajusta estos campos a lo que devuelve tu backend
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

// Para crear/actualizar (puedes ajustar opcionales)
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

const CustomerApi: AxiosInstance = axios.create({
  // OJO: barra final para evitar 301/404 en DRF
  baseURL: `${URL}/api/customers`,
});

// GET /api/customers/
export const getAllCustomers = () =>
  CustomerApi.get<Customer[]>("/");

// GET /api/customers/:id/
export const getCustomer = (id: number | string) =>
  CustomerApi.get<Customer>(`${id}/`);

// POST /api/customers/
export const createCustomer = (customer: CreateCustomerDTO) =>
  CustomerApi.post<Customer>("/", customer);

// PUT /api/customers/:id/
export const updateCustomer = (id: number | string, customer: UpdateCustomerDTO) =>
  CustomerApi.put<Customer>(`${id}/`, customer);

// DELETE /api/customers/:id/
export const deleteCustomer = (id: number | string) =>
  CustomerApi.delete<void>(`${id}/`);
