// src/pages/Users/UserPage.tsx
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UsersTable from "../../components/tables/tableUsers";

import { useAuth } from "../../auth/AuthContext"; 

export default function UserPage() {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <>
        <PageMeta title="Usuarios" description="" />
        <PageBreadcrumb pageTitle="Usuarios" />
        <div className="rounded-md border p-4">Cargando…</div>
      </>
    );
  }

  if (role !== "admin") {
    return (
      <>
        <PageMeta title="Acceso denegado" description="" />
        <PageBreadcrumb pageTitle="Usuarios" />
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          No tienes permisos para ver esta página.
        </div>
      </>
    );
  }

  // Solo admin 
  return (
    <>
      <PageMeta title="Usuarios" description="" />
      <PageBreadcrumb pageTitle="Usuarios" />
      <div className="space-y-6">
        <UsersTable />
      </div>
    </>
  );
}
