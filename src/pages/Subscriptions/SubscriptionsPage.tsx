import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import SubscriptionsGrid from "../../components/grids/gridSubscriptions";

export default function SubscriptionsPage() {
  return (
    <>
      <PageMeta
        title="Suscripciones"
        description=""
      />
      <PageBreadcrumb pageTitle="Suscripciones" />
      <div className="space-y-6">
        <SubscriptionsGrid />
      </div>
    </>
  );
}
