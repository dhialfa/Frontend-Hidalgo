// src/components/ecommerce/EcommerceMetrics.tsx
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import type { DashboardTotals } from "../../api/analytics.api";

type Props = {
  loading: boolean;
  totals?: DashboardTotals | null;
};

export default function EcommerceMetrics({ loading, totals }: Props) {
  // Skeleton mientras carga
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl bg-gray-100 animate-pulse dark:bg-gray-800"
          />
        ))}
      </div>
    );
  }

  // Si no hay datos (error o sin respuesta)
  if (!totals) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03]">
        No hay datos de métricas disponibles.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Clientes */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <GroupIcon className="size-6 text-gray-800 dark:text-white/90" />
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Clientes
            </span>
            <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {totals.total_customers}
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Activos:{" "}
              <span className="font-semibold">
                {totals.active_customers}
              </span>
            </p>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            Total
          </Badge>
        </div>
      </div>

      {/* Visitas */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <BoxIconLine className="size-6 text-gray-800 dark:text-white/90" />
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Visitas completadas (rango)
            </span>
            <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {totals.visits_completed_range}
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Hoy:{" "}
              <span className="font-semibold">
                {totals.visits_completed_today}
              </span>
            </p>
          </div>

          <Badge color={totals.visits_completed_today > 0 ? "success" : "error"}>
            {totals.visits_completed_today > 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            Hoy
          </Badge>
        </div>
      </div>
    </div>
  );
}
