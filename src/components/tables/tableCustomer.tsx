// src/components/customers/CustomersTable.tsx
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Modal } from "../ui/modal/index";
import Pagination from "../ui/Pagination";
import { usePager } from "../../hooks/usePager";

import CustomerModal, { CustomerFormValues } from "../modal/modalCustomer";

import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type Customer,
} from "../../api/customer/customer.api";
import CustomerContactsModal from "../modal/modalCustomerContact";

// 👇 IMPORTANTE: usamos el rol del usuario
import { useAuth } from "../../auth/AuthContext";

export default function CustomersTable() {
  // -------- Paginación + filtros ----------
  const {
    page, setPage,
    pageSize, setPageSize,
    totalPages, count,
    rows, loading, error,
    params, setParams,
    reload,
  } = usePager<Customer>(getCustomers, {
    ordering: "name",
    page_size: 25,
  });

  // 👇 rol actual (admin / technician)
  const { role } = useAuth();
  const isAdmin = role === "admin";

  // -------- UI state ----------
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  // Modal contactos (solo control de apertura y cliente)
  const [contactsOpen, setContactsOpen] = useState(false);
  const [contactsCustomer, setContactsCustomer] = useState<Customer | null>(null);

  /* ------------------- CRUD CLIENTES ------------------- */
  const onCreateSubmit = async (values: CustomerFormValues) => {
    await createCustomer(values);
    setPage(1);
    await reload();
  };

  const onEditSubmit = async (values: CustomerFormValues) => {
    if (!selected) return;
    await updateCustomer(selected.id, values);
    await reload();
  };

  const openEdit = (row: Customer) => {
    setSelected(row);
    setEditOpen(true);
  };
  const closeEdit = () => {
    setSelected(null);
    setEditOpen(false);
  };

  const askDelete = (id: number) => {
    // 🔒 Seguridad extra: si no es admin, no hace nada
    if (!isAdmin) return;
    setPendingId(id);
    setConfirmOpen(true);
  };

  const onDelete = async (id: number) => {
    // 🔒 Seguridad extra: evitar borrar si no es admin
    if (!isAdmin) {
      alert("No tienes permisos para eliminar clientes.");
      return;
    }

    setDeletingIds((s) => new Set(s).add(id));
    try {
      await deleteCustomer(id);
      if (rows.length - 1 <= 0 && page > 1) setPage(page - 1);
      await reload();
    } catch {
      alert("Error al eliminar cliente");
    } finally {
      setDeletingIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  };

  /* ------------------- Búsqueda & orden ------------------- */
  const onSearch = (term: string) => {
    setParams((p: any) => ({ ...p, search: term || undefined }));
    setPage(1);
  };

  const currentOrdering = String(params?.ordering || "name");
  const toggleOrdering = (field: string) => {
    const isSame = currentOrdering.replace("-", "") === field;
    const next = isSame && !currentOrdering.startsWith("-") ? `-${field}` : field;
    setParams((p: any) => ({ ...p, ordering: next }));
    setPage(1);
  };
  const orderingIcon = (field: string) => {
    const base = currentOrdering.replace("-", "");
    if (base !== field) return "↕";
    return currentOrdering.startsWith("-") ? "↓" : "↑";
  };

  /* ------------------- CONTACTOS ------------------- */
  const openContactsModal = (customer: Customer) => {
    setContactsCustomer(customer);
    setContactsOpen(true);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 sm:px-6 border-b border-gray-100 dark:border-white/[0.06]">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Clientes
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Buscar…"
            className="w-64 rounded-lg border px-3 py-2 text-sm"
            onChange={(e) => onSearch(e.target.value)}
          />
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 shadow-theme-xs"
          >
            Añadir cliente +
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1100px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <button
                    type="button"
                    onClick={() => toggleOrdering("name")}
                    title="Ordenar por nombre"
                    className="cursor-pointer inline-flex items-center gap-1 w-full text-left"
                  >
                    Nombre <span className="ml-1 text-gray-400">{orderingIcon("name")}</span>
                  </button>
                </TableCell>

                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <button
                    type="button"
                    onClick={() => toggleOrdering("identification")}
                    title="Ordenar por identificación"
                    className="cursor-pointer inline-flex items-center gap-1 w-full text-left"
                  >
                    Identificación <span className="ml-1 text-gray-400">{orderingIcon("identification")}</span>
                  </button>
                </TableCell>

                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Email
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Teléfono
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Acciones
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading && (
                <TableRow>
                  <TableCell className="px-5 py-4 text-start">
                    Cargando clientes…
                  </TableCell>
                </TableRow>
              )}

              {!loading && error && (
                <TableRow>
                  <TableCell className="px-5 py-4 text-start text-red-600">
                    {error}
                  </TableCell>
                </TableRow>
              )}

              {!loading && !error && rows.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-4 text-start">
                    No hay clientes registrados.
                  </TableCell>
                </TableRow>
              )}

              {!loading && !error &&
                rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start text-theme-sm text-gray-800 dark:text-white/90">
                      {c.name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {c.identification}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {c.email || "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {c.phone || "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">        
                        <button
                          onClick={() => openContactsModal(c)}
                          className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                        >
                          Ver contactos
                        </button>
                        <button
                          onClick={() => openEdit(c)}
                          className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                        >
                          Editar
                        </button>

                        {/* 🔒 Botón Eliminar SOLO para admins */}
                        {isAdmin && (
                          <button
                            onClick={() => askDelete(c.id)}
                            disabled={deletingIds.has(c.id)}
                            className="rounded-lg border border-red-500 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {deletingIds.has(c.id) ? "Eliminando..." : "Eliminar"}
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer: info + paginación */}
      <div className="px-5 pb-4 sm:px-6">
        <div className="mt-2 text-xs text-gray-500">Total: {count}</div>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      {/* --- Modal contactos --- */}
      <CustomerContactsModal
        isOpen={contactsOpen}
        onClose={() => setContactsOpen(false)}
        customer={contactsCustomer}
      />

      {/* --- Modales CRUD Cliente --- */}
      <CustomerModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={onCreateSubmit}
        title="Añadir cliente"
        submitLabel="Guardar cliente"
      />
      <CustomerModal
        isOpen={editOpen}
        onClose={closeEdit}
        initial={selected ?? undefined}
        onSubmit={onEditSubmit}
        title="Editar cliente"
        submitLabel="Actualizar cliente"
      />
      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        className="max-w-md p-6"
      >
        <h4 className="text-lg font-semibold mb-2">Confirmar eliminación</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          ¿Seguro que quieres eliminar este cliente? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setConfirmOpen(false)}
            className="rounded-lg border px-4 py-2.5 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              if (pendingId == null) return;
              await onDelete(pendingId);
              setConfirmOpen(false);
              setPendingId(null);
            }}
            disabled={pendingId != null && deletingIds.has(pendingId)}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {pendingId != null && deletingIds.has(pendingId)
              ? "Eliminando..."
              : "Eliminar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
