// src/components/ecommerce/EcommerceMetrics.tsx
import {
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";

export type EcommerceMetricsProps = {
  /** Total de clientes en el sistema */
  totalCustomers: number;
  /** Clientes activos (con active=true, por ejemplo) */
  activeCustomers: number;
  /** Cantidad de suscripciones activas */
  activeSubscriptions: number;
};

export default function EcommerceMetrics({
  totalCustomers,
  activeCustomers,
  activeSubscriptions,
}: EcommerceMetricsProps) {
  const activePercent =
    totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0;

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
              Clientes activos
            </span>
            <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {activeCustomers}
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Total clientes: {totalCustomers}
            </p>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            {activePercent.toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* Suscripciones */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <BoxIconLine className="size-6 text-gray-800 dark:text-white/90" />
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Suscripciones activas
            </span>
            <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
              {activeSubscriptions}
            </h4>
          </div>

          <Badge color="success">
            + Hoy
          </Badge>
        </div>
      </div>
    </div>
  );
}
