import axios from "axios";
import { getAccessToken } from "./auth/auth.api";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface VisitsByDay {
  date: string; // "YYYY-MM-DD"
  count: number;
}

export interface VisitsByStatusItem {
  status: string;
  count: number;
}

export interface LastVisitItem {
  id: number;
  customer_name: string;
  plan_name: string;
  status: string;
  start: string; // ISO
  end: string | null;
}

export interface DashboardSummary {
  total_customers: number;
  active_subscriptions: number;
  total_plans: number;
  upcoming_visits: number;
}

export interface DashboardOverviewResponse {
  summary: DashboardSummary;
  visits_by_status: VisitsByStatusItem[];
  last_visits: LastVisitItem[];
}

const client = axios.create({
  baseURL: API,
});

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function getDashboardOverview() {
  const res = await client.get<DashboardOverviewResponse>("/api/dashboard/overview/");
  return res.data;
}

export async function getVisitsByDay(days = 30) {
  const res = await client.get<VisitsByDay[]>("/api/dashboard/visits-by-day/", {
    params: { days },
  });
  return res.data;
}

export async function getVisitsByStatus(days = 30) {
  const res = await client.get<VisitsByStatusItem[]>("/api/dashboard/visits-by-status/", {
    params: { days },
  });
  return res.data;
}
