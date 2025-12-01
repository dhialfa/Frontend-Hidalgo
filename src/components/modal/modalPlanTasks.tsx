// src/components/modal/PlanTasksCrudModal.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Modal } from "../ui/modal";
import Pagination from "../ui/Pagination";
import { usePager } from "../../hooks/usePager";
import {
  getTasksByPlanPaged,
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

// 🔹 Helper para convertir errores de Axios/DRF en array de strings
function buildErrorMessages(error: unknown, fallback: string): string[] {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data as any;
    const msgs: string[] = [];

    if (!data) {
      msgs.push(fallback);
    } else if (typeof data === "string") {
      msgs.push(data);
    } else if (typeof data === "object") {
      if (data.detail) msgs.push(String(data.detail));
      if (data.message) msgs.push(String(data.message));
      if (Array.isArray(data.non_field_errors)) {
        msgs.push(...data.non_field_errors.map((m: any) => String(m)));
      }

      for (const [key, value] of Object.entries(data)) {
        if (["detail", "message", "non_field_errors"].includes(key)) continue;
        if (Array.isArray(value)) {
          msgs.push(`${key}: ${value.map((v) => String(v)).join(" ")}`);
        } else if (value) {
          msgs.push(`${key}: ${String(value)}`);
        }
      }

      if (msgs.length === 0) {
        msgs.push(fallback);
      }
    } else {
      msgs.push(fallback);
    }

    return msgs;
  }

  return [fallback];
}

export default function PlanTasksCrudModal({ isOpen, onClose, plan }: Props) {
  // Filtro: solo activas (se envía al server)
  const [onlyActive, setOnlyActive] = useState(false);

  // 🔹 Errores (frontend + backend de crear/editar/eliminar)
  const [errors, setErrors] = useState<string[]>([]);

  // ------- usePager: adaptador por-plan -------
  const adapter = useMemo(() => {
    return async (params: any) => {
      if (!plan?.id) {
        return {
          count: 0,
          next: null,
          previous: null,
          results: [],
        } as {
          count: number;
          next: string | null;
          previous: string | null;
          results: PlanTask[];
        };
      }
      const page = await getTasksByPlanPaged(plan.id, {
        ...params,
        active: onlyActive ? true : undefined,
      });
      return page;
    };
    // Dependemos de valores primitivos para estabilidad
  }, [plan?.id, onlyActive]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    count,
    rows,
    loading,
    error, // error de usePager (carga listado)
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

  // Reset + refetch al abrir/cambiar plan
  useEffect(() => {
    if (!isOpen) return;
    setFormOpen(false);
    setForm({ name: "", description: "" });
    setPage(1);
    setErrors([]);
    void reload(); // ⬅️ asegura refetch al cambiar plan
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, plan?.id]);

  // ------- acciones listado -------
  const openCreate = () => {
    setForm({ name: "", description: "" });
    setFormOpen(true);
    setErrors([]);
  };

  const openEdit = (t: PlanTask) => {
    setForm({ id: t.id, name: t.name, description: t.description ?? "" });
    setFormOpen(true);
    setErrors([]);
  };

  const cancelForm = () => {
    setFormOpen(false);
    setForm({ name: "", description: "" });
    setErrors([]);
  };

  const handleSubmit = async () => {
    if (!plan) return;

    const name = form.name.trim();
    const localErrors: string[] = [];

    if (!name) {
      localErrors.push("El nombre es obligatorio.");
    }

    if (localErrors.length > 0) {
      setErrors(localErrors);
      return;
    }

    const payload = {
      name,
      description: form.description?.trim() || undefined,
    };

    try {
      setSaving(true);
      setErrors([]);

      if (form.id) {
        await partialUpdatePlanTask(form.id, payload);
      } else {
        await createTaskByPlan(plan.id, payload);
      }
      cancelForm();
      setPage(1); // ver nuevas primero según ordering
      await reload();
    } catch (err) {
      console.error("plan-task submit error:", err);
      setErrors(
        buildErrorMessages(
          err,
          "Operación no completada al guardar la tarea del plan.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: PlanTask) => {
    if (!confirm(`¿Eliminar la tarea "${t.name}"?`)) return;
    try {
      setSaving(true);
      setErrors([]);
      await deletePlanTask(t.id);
      if (rows.length - 1 <= 0 && page > 1) setPage(page - 1);
      await reload();
    } catch (err) {
      console.error("plan-task delete error:", err);
      setErrors(
        buildErrorMessages(err, "No se pudo eliminar la tarea del plan."),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setErrors([]);
    setFormOpen(false);
    setForm({ name: "", description: "" });
    onClose();
  };

  if (!isOpen) return null;

  const currentOrdering = String(params?.ordering || "name");

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-[860px] p-6 lg:p-10"
    >
      <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
        {/* ---------- Header ---------- */}
        <div>
          <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {title}
          </h5>
          {!formOpen ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gestiona las tareas asociadas al plan
              {plan ? ` “${plan.name}”` : ""}.
            </p>
          ) : form.id ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Actualiza la información de la tarea seleccionada.
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Registra una nueva tarea para este plan.
            </p>
          )}
        </div>

        {/* 🔹 Bloque de errores (crear/editar/eliminar) */}
        {errors.length > 0 && (
          <div className="mt-4 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
            <ul className="list-disc pl-5 space-y-1">
              {errors.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

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
                    const checked = e.target.checked;
                    setOnlyActive(checked); // 1) cambia filtro
                    setPage(1); // 2) reset page
                    setParams((p: any) => ({
                      // 3) refetch con valor NUEVO
                      ...p,
                      ...(checked
                        ? { active: true }
                        : { active: undefined }),
                    }));
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700"
                />
                <label
                  htmlFor="onlyActive"
                  className="text-sm text-gray-700 dark:text-gray-400"
                >
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
                  setParams((p: any) => ({
                    ...p,
                    search: e.target.value || undefined,
                  }));
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
                    <div
                      key={i}
                      className="h-11 rounded-lg bg-gray-100 dark:bg-white/10 animate-pulse"
                    />
                  ))}
                </div>
              ) : error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : rows.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Este plan no tiene tareas registradas.
                </p>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-white/10">
                  {rows.map((t) => (
                    <li key={t.id} className="py-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white/90">
                            {t.name}
                          </div>
                          {t.description && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {t.description}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            onClick={() => openEdit(t)}
                            disabled={saving}
                            className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06] disabled:opacity-60"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => void handleDelete(t)}
                            disabled={saving}
                            className="rounded-lg border border-red-500 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-60"
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Mantenimiento de cómputo"
                  disabled={saving}
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Descripción
                </label>
                <textarea
                  value={form.description ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={4}
                  className="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Detalle de la tarea que incluye limpieza, actualización de equipos, etc."
                  disabled={saving}
                />
              </div>
            </div>
          )}
        </div>

        {/* ---------- Footer ---------- */}
        <div className="flex items-center gap-3 mt-6 sm:justify-between">
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
                disabled={saving}
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg:white/[0.03] sm:w-auto disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleSubmit()}
                type="button"
                disabled={saving}
                className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 sm:w-auto"
              >
                {saving
                  ? "Guardando..."
                  : form.id
                  ? "Actualizar tarea"
                  : "Guardar tarea"}
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
