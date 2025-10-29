// src/components/modal/PlanTasksCrudModal.tsx
import { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/modal";
import Pagination from "../ui/Pagination";
import { usePager } from "../../hooks/usePager";
import {
  getTasksByPlanPaged, // ⬅️ requiere endpoint paginado
  createTaskByPlan,
  partialUpdatePlanTask,
  deletePlanTask,
  type PlanTask,
} from "../../api/plan and subscriptions/plan-tasks.api";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  plan: { id: number; name: string } | null;
};

type FormValues = {
  id?: number; // solo en edición
  name: string;
  description?: string;
};

export default function PlanTasksCrudModal({ isOpen, onClose, plan }: Props) {
  // Filtro: solo activas (se envía al server)
  const [onlyActive, setOnlyActive] = useState(false);

  // ------- usePager: adaptador por-plan -------
  const adapter = useMemo(() => {
    return async (params: any) => {
      if (!plan) {
        // forma mínima para no romper el hook si no hay plan
        return {
          count: 0,
          next: null,
          previous: null,
          results: [],
        } as { count: number; next: string | null; previous: string | null; results: PlanTask[] };
      }
      // Pasamos filtros/orden/search al server
      const page = await getTasksByPlanPaged(plan.id, {
        ...params,
        active: onlyActive ? true : undefined,
      });
      return page; // { count, next, previous, results }
    };
  }, [plan, onlyActive]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    count,
    rows,
    loading,
    error,
    params,
    setParams,
    reload,
  } = usePager<PlanTask>(adapter, {
    ordering: "name",
    page_size: 10,
  });

  // -------- formulario --------
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormValues>({ name: "", description: "" });

  const title = useMemo(() => {
    if (!formOpen) return `Tareas del plan ${plan ? `“${plan.name}”` : ""}`;
    return form.id ? "Editar tarea" : "Añadir tarea";
  }, [formOpen, form.id, plan]);

  // Reset al abrir/cambiar plan
  useEffect(() => {
    if (!isOpen) return;
    setFormOpen(false);
    setForm({ name: "", description: "" });
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, plan, onlyActive]);

  // ------- acciones listado -------
  const openCreate = () => {
    setForm({ name: "", description: "" });
    setFormOpen(true);
  };

  const openEdit = (t: PlanTask) => {
    setForm({ id: t.id, name: t.name, description: t.description ?? "" });
    setFormOpen(true);
  };

  const cancelForm = () => {
    setFormOpen(false);
    setForm({ name: "", description: "" });
  };

  const handleSubmit = async () => {
    if (!plan) return;
    const name = form.name.trim();
    if (!name) return alert("El nombre es obligatorio");
    const payload = { name, description: form.description?.trim() || undefined };
    try {
      setSaving(true);
      if (form.id) {
        await partialUpdatePlanTask(form.id, payload);
      } else {
        await createTaskByPlan(plan.id, payload);
      }
      cancelForm();
      setPage(1); // opcional: volver a la 1 para ver la nueva primero según ordering
      await reload();
    } catch (err: any) {
      const data = err?.response?.data;
      const msg =
        data?.detail ||
        data?.message ||
        (typeof data === "object" ? JSON.stringify(data) : String(data)) ||
        "Operación no completada";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: PlanTask) => {
    if (!confirm(`¿Eliminar la tarea "${t.name}"?`)) return;
    try {
      await deletePlanTask(t.id);
      // si se vacía la página, retrocede una
      if (rows.length - 1 <= 0 && page > 1) setPage(page - 1);
      await reload();
    } catch (err: any) {
      const data = err?.response?.data;
      const msg =
        data?.detail ||
        data?.message ||
        (typeof data === "object" ? JSON.stringify(data) : String(data)) ||
        "No se pudo eliminar la tarea.";
      alert(msg);
    }
  };

  if (!isOpen) return null;

  const currentOrdering = String(params?.ordering || "name");

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[860px] p-6 lg:p-10">
      <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
        {/* ---------- Header ---------- */}
        <div>
          <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {title}
          </h5>
          {!formOpen ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gestiona las tareas asociadas al plan{plan ? ` “${plan.name}”` : ""}.
            </p>
          ) : form.id ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Actualiza la información de la tarea seleccionada.</p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Registra una nueva tarea para este plan.</p>
          )}
        </div>

        {/* ---------- Toolbar (solo lista) ---------- */}
        {!formOpen && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  id="onlyActive"
                  type="checkbox"
                  checked={onlyActive}
                  onChange={(e) => {
                    setPage(1);
                    setParams((p: any) => ({ ...p })); // fuerza refetch vía adapter (dep. onlyActive)
                    setOnlyActive(e.target.checked);
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700"
                />
                <label htmlFor="onlyActive" className="text-sm text-gray-700 dark:text-gray-400">
                  Solo activas
                </label>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Buscar…"
                value={String(params?.search ?? "")}
                onChange={(e) => {
                  setPage(1);
                  setParams((p: any) => ({ ...p, search: e.target.value || undefined }));
                }}
                className="h-10 w-56 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />

              {/* Ordering */}
              <select
                value={currentOrdering}
                onChange={(e) => {
                  const val = e.target.value as string;
                  setPage(1);
                  setParams((p: any) => ({ ...p, ordering: val }));
                }}
                className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                title="Ordenar"
              >
                <option value="name">Nombre ↑</option>
                <option value="-name">Nombre ↓</option>
                <option value="created_at">Creación ↑</option>
                <option value="-created_at">Creación ↓</option>
              </select>
            </div>

            <button
              onClick={openCreate}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 shadow-theme-xs"
            >
              Añadir tarea +
            </button>
          </div>
        )}

        {/* ---------- Body ---------- */}
        <div className="mt-6">
          {/* Lista */}
          {!formOpen && (
            <>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-11 rounded-lg bg-gray-100 dark:bg-white/10 animate-pulse" />
                  ))}
                </div>
              ) : error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : rows.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">Este plan no tiene tareas registradas.</p>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-white/10">
                  {rows.map((t) => (
                    <li key={t.id} className="py-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white/90">{t.name}</div>
                          {t.description && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{t.description}</p>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            onClick={() => openEdit(t)}
                            className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => void handleDelete(t)}
                            className="rounded-lg border border-red-500 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* Formulario crear/editar */}
          {formOpen && (
            <div className="mt-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Nombre */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Mantenimiento de cómputo"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Descripción
                </label>
                <textarea
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Detalle de la tarea que incluye limpieza, actualización de equipos, etc."
                />
              </div>
            </div>
          )}
        </div>

        {/* ---------- Footer ---------- */}
        <div className="flex items-center gap-3 mt-6 sm:justify-between">
          {/* Paginación (solo lista) */}
          {!formOpen && (
            <div className="text-xs text-gray-500">Total: {count}</div>
          )}

          {!formOpen ? (
            <div className="ml-auto">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={(n) => {
                  setPageSize(n);
                  setPage(1);
                }}
                pageSizeOptions={[5, 10, 20, 30]}
              />
            </div>
          ) : (
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={cancelForm}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleSubmit()}
                type="button"
                disabled={saving}
                className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 sm:w-auto"
              >
                {saving ? "Guardando..." : form.id ? "Actualizar tarea" : "Guardar tarea"}
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
