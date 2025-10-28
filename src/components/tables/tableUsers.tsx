// src/components/users/UsersTable.tsx
import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import UserModal, { UserFormValues } from "../modal/modalUsers";
import Pagination from "../ui/Pagination";                  // ⬅️ componente de paginación
import { usePager } from "../../hooks/usePager";            // ⬅️ hook de paginación

import {
  getUsers,              // ⬅️ listado paginado: {count, results, next, previous}
  createUser,
  updateUser,
  deleteUser,
} from "../../api/user/users.api";
import type { User } from "../../api/user/users.api";

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-700 dark:text-white/80 text-sm font-semibold">
      {initials || "?"}
    </div>
  );
}

export default function UsersTable() {
  // -------- Paginación + filtros ----------
  const {
    page, setPage,
    pageSize, setPageSize,
    totalPages, count,
    rows, loading, error,
    params, setParams,
    reload,
  } = usePager<User>(getUsers, {
    ordering: "username", // orden inicial (ajústalo si prefieres)
    page_size: 25,
  });

  // -------- UI state ----------
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  // -------- Handlers CRUD ----------
  const onCreateSubmit = async (values: UserFormValues) => {
    await createUser(values);
    // tras crear, vuelve a la página 1 para ver el registro más reciente si tu backend lo ordena así
    setPage(1);
    await reload();
  };

  const onEditSubmit = async (values: UserFormValues, id?: number | string) => {
    const targetId = id ?? selected?.id;
    if (targetId == null) return;
    await updateUser(targetId, values);
    await reload(); // recarga la página actual
  };

  const openEdit = (row: User) => {
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
      await deleteUser(id);
      // si la página queda vacía después de borrar (por ejemplo, último ítem de la última página),
      // intenta retroceder una página
      const willHave = rows.length - 1; // lo que quedaría en la UI
      if (willHave <= 0 && page > 1) {
        setPage(page - 1);
      }
      await reload();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "No se pudo eliminar el usuario";
      alert(msg);
    } finally {
      setDeletingIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  };

  // -------- Buscador y ordering ----------
  const onSearch = (term: string) => {
    setParams((p: any) => ({ ...p, search: term || undefined }));
    setPage(1);
  };

  const currentOrdering = String(params?.ordering || "username");
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

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 sm:px-6 border-b border-gray-100 dark:border-white/[0.06]">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Usuarios
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
            type="button"
            className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 shadow-theme-xs"
          >
            Añadir usuario +
          </button>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1102px]">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none"
                >
                  <button
                    type="button"
                    onClick={() => toggleOrdering("username")}
                    title="Ordenar por usuario"
                    className="cursor-pointer inline-flex items-center gap-1 w-full text-left"
                  >
                    Usuario <span className="ml-1 text-gray-400">{orderingIcon("username")}</span>
                  </button>
                </TableCell>

                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                  <button
                    type="button"
                    onClick={() => toggleOrdering("email")}
                    title="Ordenar por email"
                    className="cursor-pointer inline-flex items-center gap-1 w-full text-left"
                  >
                    Email <span className="ml-1 text-gray-400">{orderingIcon("email")}</span>
                  </button>
                </TableCell>

                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                  <button
                    type="button"
                    onClick={() => toggleOrdering("first_name")}
                    title="Ordenar por nombre"
                    className="cursor-pointer inline-flex items-center gap-1 w-full text-left"
                  >
                    Nombre <span className="ml-1 text-gray-400">{orderingIcon("first_name")}</span>
                  </button>
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
                  Rol
                </TableCell>

                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Status
                </TableCell>

                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Acciones
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading && (
                <TableRow>
                  <TableCell className="px-5 py-4 text-start">
                    Cargando usuarios…
                  </TableCell>
                </TableRow>
              )}

              {error && !loading && (
                <TableRow>
                  <TableCell className="px-5 py-4 text-start text-red-600">
                    {error}
                  </TableCell>
                </TableRow>
              )}

              {!loading && !error && rows.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-4 text-start">
                    No hay usuarios para mostrar.
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                !error &&
                rows.map((u) => {
                  const fullName = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden rounded-full">
                            {"image" in u && (u as any).image ? (
                              <img
                                width={40}
                                height={40}
                                src={(u as any).image}
                                alt={u.username}
                                className="w-10 h-10 object-cover"
                              />
                            ) : (
                              <InitialsAvatar name={fullName || u.username} />
                            )}
                          </div>
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {u.username}
                            </span>
                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                              {u.rol || "—"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {u.email}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {fullName || "—"}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {u.phone || "—"}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {u.rol || "—"}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <Badge size="sm" color={u.is_active ? "success" : "error"}>
                          {u.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => askDelete(u.id)}
                            disabled={deletingIds.has(u.id)}
                            className="rounded-lg border border-red-500 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingIds.has(u.id) ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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

      {/* Modal CREAR */}
      <UserModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={onCreateSubmit}
        title="Añadir usuario"
        submitLabel="Guardar usuario"
      />

      {/* Modal EDITAR */}
      <UserModal
        isOpen={editOpen}
        onClose={closeEdit}
        initial={selected ?? undefined}
        onSubmit={onEditSubmit}
        title="Editar usuario"
        submitLabel="Actualizar"
      />

      {/* Modal CONFIRMAR ELIMINACIÓN */}
      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        className="max-w-md p-6"
      >
        <h4 className="text-lg font-semibold mb-2">Confirmar eliminación</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          ¿Seguro que quieres eliminar este usuario? Esta acción no se puede
          deshacer.
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
