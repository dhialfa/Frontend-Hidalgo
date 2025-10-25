import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import VisitsTable from "../../components/tables/tableVisits";
export default function VisitsPage() {
  return (
    <>
      <PageMeta
        title="Visitas"
        description=""
      />
      <PageBreadcrumb pageTitle="Visitas" />
      <div className="space-y-6">
          <VisitsTable mode="all"/>
      </div>
    </>
  );
}
