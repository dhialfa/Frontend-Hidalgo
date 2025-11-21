// src/pages/Dashboard/Home.tsx  (ajusta la ruta si tu archivo se llama distinto)
import { useEffect, useState } from "react";

import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import PageMeta from "../../components/common/PageMeta";

import {
  getDashboardOverview,
  type DashboardOverviewResponse,
} from "../../api/analytics.api";

export default function Home() {
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const resp = await getDashboardOverview();
        if (mounted) {
          setData(resp);
          setError(null);
        }
      } catch (err) {
        console.error("Error cargando dashboard:", err);
        if (mounted) {
          setError("No se pudieron cargar los datos del tablero.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <PageMeta
        title="Computadores Hidalgo - Soporte"
        description="App de registro de visitas"
      />

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics loading={loading} totals={data?.totals ?? null} />

          <MonthlySalesChart
            loading={loading}
            series={data?.charts.visits_by_day ?? []}
          />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget
            loading={loading}
            range={data?.range}
            totals={data?.totals ?? null}
          />
        </div>

        <div className="col-span-12">
          <StatisticsChart
            loading={loading}
            visitsByStatus={data?.charts.visits_by_status ?? []}
          />
        </div>
      </div>
    </>
  );
}
