// src/components/plans/PlansGrid.tsx
import { useEffect, useMemo, useState } from "react";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import PlanModal, { PlanFormValues } from "../modal/modalPlans";
import PlanTasksCrudModal from "../modal/modalPlanTasks";

import {
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan,
  type Plan,
} from "../../api/plan and subscriptions/plan.api";

export default function PlansGrid() {
  const [data, setData] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modales plan (crear/editar)
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Plan | null>(null);

  // Modal CRUD de tareas
  const [tasksOpen, setTasksOpen] = useState(false);
  const [taskPlan, setTaskPlan] = useState<{ id: number; name: string } | null>(null);

  // Confirmación eliminar
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  // Filtros
  const [query, setQuery] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllPlans();
        setData(res.data as Plan[]);
      } catch (e: any) {
        setError(e?.response?.data?.detail || "Error al cargar planes");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ------------------- Helpers ------------------- */
  const money = useMemo(() => {
    try {
      return new Intl.NumberFormat("es-CR", {
        style: "currency",
        currency: "CRC",
        maximumFractionDigits: 0,
      });
    } catch {
      return new Intl.NumberFormat("es-CR");
    }
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((p) => {
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q);
      const matchA = !onlyActive || p.active;
      return matchQ && matchA;
    });
  }, [data, query, onlyActive]);

  const toNumber = (v: string | number | undefined): number | undefined => {
    if (v == null || v === "") return undefined;
    if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : undefined;
  };

  /* ------------------- CRUD PLANES ------------------- */
  const onCreateSubmit = async (values: PlanFormValues) => {
    const res = await createPlan(values);
    setData((prev) => [res.data as Plan, ...prev]);
  };

  const onEditSubmit = async (values: PlanFormValues) => {
    if (!selected) return;
    const res = await updatePlan(selected.id, values);
    const updated = res.data as Plan;
    setData((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const openEdit = (row: Plan) => {
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
      await deletePlan(id);
      setData((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Error al eliminar plan");
    } finally {
      setDeletingIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  };

  /* ------------------- TAREAS (modal CRUD) ------------------- */
  const openTasks = (p: Plan) => {
    setTaskPlan({ id: p.id, name: p.name });
    setTasksOpen(true);
  };
  const closeTasks = () => {
    setTasksOpen(false);
    setTaskPlan(null);
  };

  /* ------------------- UI ------------------- */
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 sm:px-6 border-b border-gray-100 dark:border-white/[0.06]">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Planes
        </h3>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              id="onlyActive"
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => setOnlyActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700"
            />
            <label
              htmlFor="onlyActive"
              className="text-sm text-gray-700 dark:text-gray-400"
            >
              Solo activos
            </label>
          </div>

          <input
            type="text"
            placeholder="Buscar plan…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 flex-1 sm:w-64 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />

          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 shadow-theme-xs"
          >
            Añadir plan +
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="p-5 sm:p-6">
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 p-4 dark:border-white/[0.06] animate-pulse"
              >
                <div className="h-5 w-2/3 bg-gray-200 dark:bg-white/10 rounded mb-3" />
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-white/10 rounded mb-2" />
                <div className="h-4 w-5/6 bg-gray-200 dark:bg-white/10 rounded mb-6" />
                <div className="flex items-center justify-between">
                  <div className="h-6 w-20 bg-gray-200 dark:bg-white/10 rounded" />
                  <div className="h-9 w-28 bg-gray-200 dark:bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p className="text-sm text-gray-500">No hay planes para mostrar.</p>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <article
                key={p.id}
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-theme-md dark:border-white/[0.06] dark:bg-white/[0.03]"
              >
                <header className="flex items-start justify-between gap-3">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white/90">
                    {p.name}
                  </h4>
                  <Badge size="sm" color={p.active ? "success" : "error"}>
                    {p.active ? "Activo" : "Inactivo"}
                  </Badge>
                </header>

                {p.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">
                    {p.description}
                  </p>
                )}

                <div className="mt-5 flex items-center justify-between">
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    {(() => {
                      const n = toNumber(p.price);
                      return n != null ? money.format(n) : "—";
                    })()}
                    <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                      /mes
                    </span>
                  </div>
                </div>

                <footer className="mt-4 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openTasks(p)}
                    className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                  >
                    Ver tareas
                  </button>

                  <button
                    onClick={() => openEdit(p)}
                    className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => askDelete(p.id)}
                    className="rounded-lg border border-red-500 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                    disabled={deletingIds.has(p.id)}
                  >
                    {deletingIds.has(p.id) ? "Eliminando…" : "Eliminar"}
                  </button>
                </footer>
              </article>
            ))}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* --- Modales CRUD Plan --- */}
      <PlanModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={onCreateSubmit}
        title="Añadir plan"
        submitLabel="Guardar plan"
      />
      <PlanModal
        isOpen={editOpen}
        onClose={closeEdit}
        initial={selected as unknown as Partial<PlanFormValues>}
        onSubmit={onEditSubmit}
        title="Editar plan"
        submitLabel="Actualizar plan"
      />

      {/* --- Modal CRUD Tareas --- */}
      <PlanTasksCrudModal
        isOpen={tasksOpen}
        onClose={closeTasks}
        plan={taskPlan}
      />

      {/* Confirmación eliminar */}
      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        className="max-w-md p-6"
      >
        <h4 className="text-lg font-semibold mb-2">Confirmar eliminación</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          ¿Seguro que quieres eliminar este plan? Esta acción no se puede deshacer.
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
