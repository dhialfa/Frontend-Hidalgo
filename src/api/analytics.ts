// src/api/analytics.ts
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

// ===== Tipos que vienen del backend =====
export interface DashboardTotals {
  total_customers: number;
  active_customers: number;
  active_subscriptions: number;
  visits_planned_today: number;
  visits_completed_today: number;
  visits_completed_range: number;
  estimated_monthly_revenue: number;
}

export interface VisitStatusCount {
  status: string;
  count: number;
}

export interface VisitsByDay {
  date: string;
  count: number;
}

export interface DashboardOverview {
  range: {
    from: string;
    to: string;
  };
  totals: DashboardTotals;
  charts: {
    visits_by_status: VisitStatusCount[];
    visits_by_day: VisitsByDay[];
  };
}

// ===== Llamada al endpoint del backend =====
export async function fetchDashboardOverview(
  token: string,
  params?: { from?: string; to?: string }
): Promise<DashboardOverview> {
  const res = await axios.get<DashboardOverview>(
    `${API_BASE_URL}/api/analytics/overview/`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params,
    }
  );

  return res.data;
}
