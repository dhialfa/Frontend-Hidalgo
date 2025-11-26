// src/components/ecommerce/MonthlyTarget.tsx
import { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import type {
  DashboardRange,
  DashboardTotals,
} from "../../api/analytics.api";

type Props = {
  loading: boolean;
  range?: DashboardRange;
  totals?: DashboardTotals | null;
};

export default function MonthlyTarget({ loading, range, totals }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // --- cálculo del porcentaje de cumplimiento ---
  const { percent, plannedToday, completedToday, revenue } = useMemo(() => {
    if (!totals) {
      return {
        percent: 0,
        plannedToday: 0,
        completedToday: 0,
        revenue: 0,
      };
    }

    const planned = totals.visits_planned_today || 0;
    const completed = totals.visits_completed_today || 0;

    let percent = 0;
    if (planned > 0) {
      percent = (completed / planned) * 100;
    } else if (completed > 0) {
      // si no hay planificadas pero sí completadas, lo dejamos como 100%
      percent = 100;
    }

    // clamp 0-100 por si acaso
    percent = Math.max(0, Math.min(100, percent));

    return {
      percent,
      plannedToday: planned,
      completedToday: completed,
      revenue: totals.estimated_monthly_revenue || 0,
    };
  }, [totals]);

  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: {
          size: "80%",
        },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -40,
            color: "#1D2939",
            formatter: function (val) {
              return `${val.toFixed(0)}%`;
            },
          },
        },
      },
    },
    fill: {
      type: "solid",
      colors: ["#465FFF"],
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Progreso"],
  };

  const series = [percent];

  function toggleDropdown() {
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  // --- loading / sin datos ---
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="rounded-2xl bg-white px-5 pt-5 pb-11 shadow-default dark:bg-gray-900 sm:px-6 sm:pt-6">
          <div className="h-6 w-40 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          <div className="mt-4 h-60 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-12 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              <div className="h-5 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!totals) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03]">
        No hay datos de progreso disponibles para el rango seleccionado.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="rounded-2xl bg-white px-5 pt-5 pb-11 shadow-default dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Progreso de visitas de hoy
            </h3>
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
              {range
                ? `Rango: ${range.from} a ${range.to}`
                : "Basado en las visitas planificadas vs completadas de hoy."}
            </p>
          </div>
          <div className="relative inline-block">
            <button className="dropdown-toggle" onClick={toggleDropdown}>
              <MoreDotIcon className="size-6 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
            </button>
            <Dropdown
              isOpen={isOpen}
              onClose={closeDropdown}
              className="w-40 p-2"
            >
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full rounded-lg text-left font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Ver detalle
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        <div className="relative">
          <div className="max-h-[330px]" id="chartDarkStyle">
            <Chart
              options={options}
              series={series}
              type="radialBar"
              height={330}
            />
          </div>

          <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
            {percent.toFixed(0)}% completado
          </span>
        </div>

        <p className="mx-auto mt-10 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
          Hoy hay{" "}
          <span className="font-semibold">{plannedToday}</span> visitas
          planificadas y se han completado{" "}
          <span className="font-semibold">{completedToday}</span>. Progreso
          basado en las visitas registradas en el sistema.
        </p>
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        <div>
          <p className="mb-1 text-center text-theme-xs text-gray-500 dark:text-gray-400 sm:text-sm">
            Target (hoy)
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {plannedToday}
          </p>
        </div>

        <div className="h-7 w-px bg-gray-200 dark:bg-gray-800" />

        <div>
          <p className="mb-1 text-center text-theme-xs text-gray-500 dark:text-gray-400 sm:text-sm">
            Revenue estimado
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            ₡{revenue.toLocaleString("es-CR")}
          </p>
        </div>

        <div className="h-7 w-px bg-gray-200 dark:bg-gray-800" />

        <div>
          <p className="mb-1 text-center text-theme-xs text-gray-500 dark:text-gray-400 sm:text-sm">
            Completadas hoy
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {completedToday}
          </p>
        </div>
      </div>
    </div>
  );
}
