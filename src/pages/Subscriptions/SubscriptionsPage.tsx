// src/pages/Subscriptions/SubscriptionsPage.tsx
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import SubscriptionsGrid from "../../components/grids/gridSubscriptions";

import { useAuth } from "../../auth/AuthContext";

export default function SubscriptionsPage() {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <>
        <PageMeta title="Suscripciones" description="" />
        <PageBreadcrumb pageTitle="Suscripciones" />
        <div className="rounded-md border p-4">Cargando…</div>
      </>
    );
  }

  if (role !== "admin") {
    return (
      <>
        <PageMeta title="Acceso denegado" description="" />
        <PageBreadcrumb pageTitle="Suscripciones" />
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          No tienes permisos para ver esta página.
        </div>
      </>
    );
  }

  // Solo admin
  return (
    <>
      <PageMeta title="Suscripciones" description="" />
      <PageBreadcrumb pageTitle="Suscripciones" />
      <div className="space-y-6">
        <SubscriptionsGrid />
      </div>
    </>
  );
}
