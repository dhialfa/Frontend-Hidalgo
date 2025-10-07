import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UsersTable from "../../components/tables/tableUsers";
export default function UserPage() {
  return (
    <>
      <PageMeta
        title="Usuarios"
        description=""
      />
      <PageBreadcrumb pageTitle="Usuarios" />
      <div className="space-y-6">
          <UsersTable />
      </div>
    </>
  );
}
