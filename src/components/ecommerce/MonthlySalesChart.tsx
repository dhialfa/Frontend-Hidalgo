// src/components/ecommerce/MonthlySalesChart.tsx
import { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import type { VisitsByDayItem } from "../../api/analytics.api";

type Props = {
  loading: boolean;
  series: VisitsByDayItem[];
};

function formatDateLabel(isoDate: string) {
  // isoDate = "2025-11-20"
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
  });
}

export default function MonthlySalesChart({ loading, series }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const { options, chartSeries } = useMemo(() => {
    const categories = series.map((item) => formatDateLabel(item.date));
    const data = series.map((item) => item.count);

    const opts: ApexOptions = {
      colors: ["#465fff"],
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "bar",
        height: 180,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "39%",
          borderRadius: 5,
          borderRadiusApplication: "end",
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 4,
        colors: ["transparent"],
      },
      xaxis: {
        categories,
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      legend: {
        show: true,
        position: "top",
        horizontalAlign: "left",
        fontFamily: "Outfit",
      },
      yaxis: {
        title: {
          text: undefined,
        },
      },
      grid: {
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        x: {
          show: true,
        },
        y: {
          formatter: (val: number) => `${val} visitas`,
        },
      },
    };

    const chartSeries = [
      {
        name: "Visitas",
        data,
      },
    ];

    return { options: opts, chartSeries };
  }, [series]);

  function toggleDropdown() {
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Visitas por día
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

      {/* Contenido */}
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] pl-2 xl:min-w-full">
          {loading ? (
            <div className="h-44 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ) : series.length === 0 ? (
            <div className="flex h-44 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              No hay visitas registradas en el rango seleccionado.
            </div>
          ) : (
            <Chart
              options={options}
              series={chartSeries}
              type="bar"
              height={180}
            />
          )}
        </div>
      </div>
    </div>
  );
}
