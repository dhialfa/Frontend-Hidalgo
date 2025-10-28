// src/components/customers/CustomersTable.tsx
import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal/index";
import Pagination from "../ui/Pagination";
import { usePager } from "../../hooks/usePager";

import CustomerModal, { CustomerFormValues } from "../modal/modalCustomer";

import {
  getCustomers,          // ⬅️ listado paginado (nuevo)
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type Customer,
} from "../../api/customer/customer.api";

import {
  getContactsByCustomer,
  createContactByCustomer,
  updateCustomerContact,
  deleteCustomerContact,
  type CustomerContact,
} from "../../api/customer/customer-contact.api";

// 👇 Tabla reutilizable de visitas
import VisitsTable from "./tableVisits";

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
    ordering: "name",     // orden inicial
    page_size: 25,
  });

  // -------- UI state ----------
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  // Modal contactos
  const [contactsOpen, setContactsOpen] = useState(false);
  const [contactsCustomer, setContactsCustomer] = useState<Customer | null>(null);
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactForm, setContactForm] = useState<Partial<CustomerContact>>({});
  const [editingContact, setEditingContact] = useState<CustomerContact | null>(null);

  // 👇 Modal visitas
  const [visitsOpen, setVisitsOpen] = useState(false);
  const [visitsCustomer, setVisitsCustomer] = useState<Customer | null>(null);

  /* ------------------- CRUD CLIENTES ------------------- */
  const onCreateSubmit = async (values: CustomerFormValues) => {
    await createCustomer(values);
    setPage(1);           // vuelve a primera página
    await reload();       // recarga datos
  };

  const onEditSubmit = async (values: CustomerFormValues) => {
    if (!selected) return;
    await updateCustomer(selected.id, values);
    await reload();       // recarga la página actual
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
    setPendingId(id);
    setConfirmOpen(true);
  };

  const onDelete = async (id: number) => {
    setDeletingIds((s) => new Set(s).add(id));
    try {
      await deleteCustomer(id);
      // si queda la página vacía tras borrar, retrocede una
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
  const loadContacts = async (customer: Customer) => {
    setContactsCustomer(customer);
    setContactsLoading(true);
    try {
      const res = await getContactsByCustomer(customer.id);
      setContacts(res.data);
    } catch {
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  };

  const openContactsModal = (customer: Customer) => {
    setContactsOpen(true);
    loadContacts(customer);
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactsCustomer) return;
    try {
      if (editingContact) {
        const res = await updateCustomerContact(editingContact.id, contactForm);
        setContacts((prev) =>
          prev.map((ct) => (ct.id === editingContact.id ? res.data : ct))
        );
      } else {
        const payload = {
          name: contactForm.name ?? "",
          email: contactForm.email ?? "",
          phone: contactForm.phone ?? "",
          is_main: Boolean(contactForm.is_main),
        };
        if (!payload.name.trim() || !payload.email.trim()) {
          alert("Nombre y correo son requeridos");
          return;
        }
        const res = await createContactByCustomer(contactsCustomer.id, payload);
        setContacts((prev) => [res.data, ...prev]);
      }
      setContactForm({});
      setEditingContact(null);
    } catch {
      alert("Error al guardar contacto");
    }
  };

  const editContact = (ct: CustomerContact) => {
    setEditingContact(ct);
    setContactForm(ct);
  };

  const deleteContact = async (id: number) => {
    if (!confirm("¿Eliminar contacto?")) return;
    await deleteCustomerContact(id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const resetForm = () => {
    setEditingContact(null);
    setContactForm({});
  };

  /* ------------------- VISITAS ------------------- */
  const openVisitsModal = (customer: Customer) => {
    setVisitsCustomer(customer);
    setVisitsOpen(true);
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
                          onClick={() => openVisitsModal(c)}
                          className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                        >
                          Ver visitas
                        </button>
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
                        <button
                          onClick={() => askDelete(c.id)}
                          disabled={deletingIds.has(c.id)}
                          className="rounded-lg border border-red-500 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {deletingIds.has(c.id) ? "Eliminando..." : "Eliminar"}
                        </button>
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
      <Modal
        isOpen={contactsOpen}
        onClose={() => setContactsOpen(false)}
        className="max-w-3xl p-6"
      >
        <h4 className="text-lg font-semibold mb-3 dark:text-white/90">
          Contactos de {contactsCustomer?.name}
        </h4>

        <form
          onSubmit={submitContact}
          className="flex flex-wrap gap-3 items-end mb-6 border-b border-gray-100 pb-4 dark:border-white/[0.06]"
        >
          <input
            type="text"
            name="name"
            placeholder="Nombre"
            value={contactForm.name || ""}
            onChange={handleContactChange}
            className="dark:bg-dark-900 h-11 flex-1 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Correo"
            value={contactForm.email || ""}
            onChange={handleContactChange}
            className="dark:bg-dark-900 h-11 flex-1 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            required
          />
          <input
            type="text"
            name="phone"
            placeholder="Teléfono"
            value={contactForm.phone || ""}
            onChange={handleContactChange}
            className="dark:bg-dark-900 h-11 flex-1 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
            <input
              type="checkbox"
              name="is_main"
              checked={Boolean(contactForm.is_main)}
              onChange={(e) =>
                setContactForm((prev) => ({ ...prev, is_main: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700"
            />
            Principal
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              {editingContact ? "Actualizar" : "Guardar"}
            </button>
            {editingContact && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border px-4 py-2.5 text-sm dark:border-gray-700"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {contactsLoading ? (
          <p className="text-sm text-gray-500">Cargando contactos...</p>
        ) : contacts.length === 0 ? (
          <p className="text-sm text-gray-500">No hay contactos registrados.</p>
        ) : (
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {["Nombre", "Correo", "Teléfono", "Principal", "Acciones"].map(
                  (h) => (
                    <TableCell
                      key={h}
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      {h}
                    </TableCell>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {contacts.map((ct) => (
                <TableRow key={ct.id}>
                  <TableCell className="text-gray-800 dark:text-white/90 text-theme-sm">
                    {ct.name}
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400 text-theme-sm">
                    {ct.email}
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400 text-theme-sm">
                    {ct.phone || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge size="sm">{ct.is_main ? "Sí" : "No"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editContact(ct)}
                        className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteContact(ct.id)}
                        className="rounded-lg border border-red-500 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        Eliminar
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Modal>

      {/* --- Modal visitas (usa VisitsTable en modo byCustomer) --- */}
      <Modal
        isOpen={visitsOpen}
        onClose={() => setVisitsOpen(false)}
        className="max-w-6xl p-6"
      >
        <h4 className="text-lg font-semibold mb-4 dark:text-white/90">
          Visitas de {visitsCustomer?.name}
        </h4>

        {visitsCustomer ? (
          <VisitsTable mode="byCustomer" customerId={visitsCustomer.id} />
        ) : (
          <p className="text-sm text-gray-500">
            Selecciona un cliente para ver sus visitas.
          </p>
        )}
      </Modal>

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
