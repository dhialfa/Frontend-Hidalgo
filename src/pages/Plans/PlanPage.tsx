import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PlansGrid from "../../components/grids/gridPlans";

export default function CustomerTable() {
  return (
    <>
      <PageMeta
        title="Clientes"
        description=""
      />
      <PageBreadcrumb pageTitle="Planes" />
      <div className="space-y-6">
          <PlansGrid />
      </div>
    </>
  );
}

