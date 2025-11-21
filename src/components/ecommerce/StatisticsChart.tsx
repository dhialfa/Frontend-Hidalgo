// src/components/ecommerce/StatisticsChart.tsx
import { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import type { VisitsByStatusItem } from "../../api/analytics.api";

type Props = {
  loading: boolean;
  visitsByStatus: VisitsByStatusItem[];
};

export default function StatisticsChart({ loading, visitsByStatus }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const { options, chartSeries } = useMemo(() => {
    const labels = visitsByStatus.map((item) => item.status);
    const data = visitsByStatus.map((item) => item.count);

    const opts: ApexOptions = {
      chart: {
        type: "donut",
        height: 320,
        fontFamily: "Outfit, sans-serif",
      },
      labels,
      legend: {
        position: "bottom",
        fontFamily: "Outfit, sans-serif",
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(1)}%`,
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val} visitas`,
        },
      },
      // si quieres controlar colores, ponlos aquí
      // colors: ["#465FFF", "#22C55E", "#F97316", "#EF4444"],
    };

    const series = data;

    return { options: opts, chartSeries: series };
  }, [visitsByStatus]);

  function toggleDropdown() {
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Visitas por estado
        </h3>
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

      {loading ? (
        <div className="h-72 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      ) : visitsByStatus.length === 0 ? (
        <div className="flex h-72 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          No hay datos de visitas por estado en el rango seleccionado.
        </div>
      ) : (
        <div className="max-w-full">
          <Chart
            options={options}
            series={chartSeries}
            type="donut"
            height={320}
          />
        </div>
      )}
    </div>
  );
}
