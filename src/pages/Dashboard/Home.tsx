import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import { useDashboard } from "../../hooks/useDashboard";

export default function Home() {
  const { data, loading, error, reload } = useDashboard();

  if (loading) {
    return (
      <>
        <PageMeta
          title="Computadores Hidalgo - Soporte"
          description="App de registro de visitas"
        />
        <p className="p-4">Cargando estadísticas...</p>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageMeta
          title="Computadores Hidalgo - Soporte"
          description="App de registro de visitas"
        />
        <div className="p-4 text-red-500 space-y-3">
          <p>No se pudieron cargar las estadísticas del dashboard.</p>
          <button
            type="button"
            onClick={reload}
            className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Reintentar
          </button>
        </div>
      </>
    );
  }

  const { totals, charts } = data;

  return (
    <>
      <PageMeta
        title="Computadores Hidalgo - Soporte"
        description="App de registro de visitas"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Métricas principales */}
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics
            totalCustomers={totals.total_customers}
            activeCustomers={totals.active_customers}
            activeSubscriptions={totals.active_subscriptions}
          />

          <MonthlySalesChart visitsByDay={charts.visits_by_day} />
        </div>

        {/* Target / ingresos estimados */}
        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget
            estimatedMonthlyRevenue={totals.estimated_monthly_revenue}
            plannedToday={totals.visits_planned_today}
            completedToday={totals.visits_completed_today}
          />
        </div>

        {/* Gráfico por estado de visita */}
        <div className="col-span-12">
          <StatisticsChart visitsByStatus={charts.visits_by_status} />
        </div>

        {/* Demografía sencilla (activos vs total) */}
        <div className="col-span-12 xl:col-span-5">
          <DemographicCard
            totalCustomers={totals.total_customers}
            activeCustomers={totals.active_customers}
          />
        </div>

        {/* “Últimas visitas” = visitas por día (top 5) */}
        <div className="col-span-12 xl:col-span-7">
          <RecentOrders visitsByDay={charts.visits_by_day} />
        </div>
      </div>
    </>
  );
}
