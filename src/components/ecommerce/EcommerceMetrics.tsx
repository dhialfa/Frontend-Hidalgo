import {
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";

type Props = {
  totalCustomers: number;
  activeCustomers: number;
  activeSubscriptions: number;
};

export default function EcommerceMetrics({
  totalCustomers,
  activeCustomers,
  activeSubscriptions,
}: Props) {
  const activePercent =
    totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Clientes */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Clientes activos
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {activeCustomers}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Suscripciones activas
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
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
