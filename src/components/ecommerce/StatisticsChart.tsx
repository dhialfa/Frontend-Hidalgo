// src/components/ecommerce/StatisticsChart.tsx
import { useMemo } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import ChartTab from "../common/ChartTab";
import type { VisitsByStatusItem } from "../../api/analytics";

type Props = { 
  data?: VisitsByStatusItem[];
};

export default function StatisticsChart({ data = [] }: Props) {
  const { categories, values, hasData } = useMemo(() => {
    // Inicializamos los 4 estados "oficiales" en español
    const totals: Record<string, number> = {
      Programadas: 0,
      "En progreso": 0,
      Completadas: 0,
      Canceladas: 0,
    };

    for (const item of data) {
      const raw = item.status; // "scheduled", "completed", "Completado", "canceled"
      const count = item.count ?? 0;

      let key: keyof typeof totals | null = null;

      switch (raw) {
        case "scheduled":
          key = "Programadas";
          break;
        case "in_progress":
          key = "En progreso";
          break;
        case "completed":
        case "Completado":
          key = "Completadas";
          break;
        case "canceled":
        case "cancelled":
          key = "Canceladas";
          break;
        default:
          key = null; 
      }

      if (key) {
        totals[key] += count;
      }
    }

    const categories = Object.keys(totals);
    const values = categories.map((label) => totals[label] ?? 0);
    const hasData = values.some((v) => v > 0);

    return {
      categories,
      values,
      hasData,
    };
  }, [data]);

  const options: ApexOptions = {
    legend: {
      show: false,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "straight",
      width: [2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
    },
    xaxis: {
      type: "category",
      categories: hasData ? categories : ["Sin datos"],
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
      },
      title: {
        text: "",
        style: { fontSize: "0px" },
      },
    },
  };

  const series = [
    {
      name: "Visitas",
      data: hasData ? values : [0],
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Visitas por estado
          </h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Programadas, en progreso, completadas y canceladas.
          </p>
        </div>
      </div>

      <div className="custom-scrollbar max-w-full overflow-x-auto">
        <div className="min-w-[600px] xl:min-w-full">
          <Chart options={options} series={series} type="area" height={310} />
        </div>
      </div>
    </div>
  );
}
