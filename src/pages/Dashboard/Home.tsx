// src/pages/Home.tsx (ajusta la ruta según tu proyecto)
import PageMeta from "../../components/common/PageMeta";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import { useDashboard } from "../../hooks/useDashboard";

export default function Home() {
  const { loading, error, overview, visitsByDay, visitsByStatus } = useDashboard(30);

  console.log("DASHBOARD DATA", { overview, visitsByDay, visitsByStatus, loading, error });

  if (loading) {
    return (
      <>
        <PageMeta title="Dashboard" description="" />
        <div className="rounded-md border p-4">Cargando dashboard…</div>
      </>
    );
  }

  if (error || !overview) {
    return (
      <>
        <PageMeta title="Dashboard" description="" />
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          Error cargando dashboard: {error ?? "sin datos"}
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Dashboard" description="" />

      {/* Cards de arriba */}
      <EcommerceMetrics
        totalCustomers={overview.summary.total_customers}
        activeCustomers={overview.summary.total_customers} // por ahora usamos el mismo
        activeSubscriptions={overview.summary.active_subscriptions}
      />

      {/* Gráficos */}
      <div className="mt-6 grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-8">
          <MonthlySalesChart data={visitsByDay} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <StatisticsChart data={visitsByStatus} />
        </div>
      </div>

      {/* Tabla de últimos días */}
      <div className="mt-6">
        <RecentOrders
          visitsByDay={visitsByDay}
          lastVisits={overview.last_visits}
        />
      </div>
    </>
  );
}
