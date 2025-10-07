import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import CustomersTable from "../../components/tables/tableCustomer";

export default function CustomerTable() {
  return (
    <>
      <PageMeta
        title="Clientes"
        description=""
      />
      <PageBreadcrumb pageTitle="Clientes" />
      <div className="space-y-6">
          <CustomersTable />
      </div>
    </>
  );
}

