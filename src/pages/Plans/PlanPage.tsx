// src/pages/Plans/PlanPage.tsx
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PlansGrid from "../../components/grids/gridPlans";

import { useAuth } from "../../auth/AuthContext";

export default function PlanPage() {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <>
        <PageMeta title="Planes" description="" />
        <PageBreadcrumb pageTitle="Planes" />
        <div className="rounded-md border p-4">Cargando…</div>
      </>
    );
  }

  if (role !== "admin") {
    return (
      <>
        <PageMeta title="Acceso denegado" description="" />
        <PageBreadcrumb pageTitle="Planes" />
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          No tienes permisos para ver esta página.
        </div>
      </>
    );
  }

  // Solo admin
  return (
    <>
      <PageMeta title="Planes" description="" />
      <PageBreadcrumb pageTitle="Planes" />
      <div className="space-y-6">
        <PlansGrid />
      </div>
    </>
  );
}
