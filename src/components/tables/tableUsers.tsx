// src/components/users/UsersTable.tsx
import { useEffect, useState } from "react";
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

import {
  getAllUsers,
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
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);

  // Confirmación delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllUsers();
        setData(res.data as User[]);
      } catch (e: any) {
        setError(e?.response?.data?.detail || "Error al cargar usuarios");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ----- Crear ----- */
  const onCreateSubmit = async (values: UserFormValues) => {
    const res = await createUser(values);
    const created = res.data as User;
    setData((prev) => [created, ...prev]);
  };

  /* ----- Editar ----- */
  const onEditSubmit = async (values: UserFormValues) => {
    if (!selected) return;
    const res = await updateUser(selected.id, values);
    const updated = res.data as User;
    setData((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const openEdit = (row: User) => {
    setSelected(row);
    setEditOpen(true);
  };
  const closeEdit = () => {
    setSelected(null);
    setEditOpen(false);
  };

  /* ----- Eliminar ----- */
  const askDelete = (id: number) => {
    setPendingId(id);
    setConfirmOpen(true);
  };

  const onDelete = async (id: number) => {
    setDeletingIds((s) => new Set(s).add(id));
    try {
      await deleteUser(id);
      setData((prev) => prev.filter((u) => u.id !== id));
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

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 sm:px-6 border-b border-gray-100 dark:border-white/[0.06]">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Usuarios
        </h3>
        <button
          onClick={() => setCreateOpen(true)}
          type="button"
          className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 shadow-theme-xs"
        >
          Añadir usuario +
        </button>
      </div>

      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1102px]">
          <Table>
            {/* Table Header (mismos estilos del ejemplo) */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Usuario
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
                  Nombre
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

            {/* Table Body (mismos paddings/dividers del ejemplo) */}
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
                  <TableCell
                    className="px-5 py-4 text-start text-red-600"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              )}

              {!loading && !error && data.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-4 text-start">
                    No hay usuarios para mostrar.
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                !error &&
                data.map((u) => {
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
