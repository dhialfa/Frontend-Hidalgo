// src/hooks/useDashboard.ts
import { useEffect, useState } from "react";
import {
  getDashboardOverview,
  getVisitsByDay,
  getVisitsByStatus,
  type DashboardOverviewResponse,
  type VisitsByDay,
  type VisitsByStatusItem,
} from "../api/analytics";

interface DashboardState {
  loading: boolean;
  error: string | null;
  overview: DashboardOverviewResponse | null;
  visitsByDay: VisitsByDay[];
  visitsByStatus: VisitsByStatusItem[];
}

export function useDashboard(days = 30): DashboardState {
  const [state, setState] = useState<DashboardState>({
    loading: true,
    error: null,
    overview: null,
    visitsByDay: [],
    visitsByStatus: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [overview, visitsByDay, visitsByStatus] = await Promise.all([
          getDashboardOverview(),
          getVisitsByDay(days),
          getVisitsByStatus(days),
        ]);

        if (cancelled) return;

        setState({
          loading: false,
          error: null,
          overview,
          visitsByDay,
          visitsByStatus,
        });
      } catch (err: any) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err?.message ?? "Error cargando dashboard",
        }));
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [days]);

  return state;
}
