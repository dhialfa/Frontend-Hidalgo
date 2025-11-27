// src/components/subscriptions/SubscriptionsGrid.tsx
import { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/modal";
import Pagination from "../ui/Pagination";
import { usePager } from "../../hooks/usePager";
import SubscriptionModal, {
  SubscriptionFormValues,
} from "../modal/modalSubscriptions";

import {
  getPlanSubscriptions, // listado paginado DRF (usa usePager)
  createPlanSubscription,
  partialUpdatePlanSubscription,
  deletePlanSubscription,
  cancelSubscription,
  type PlanSubscription,
} from "../../api/plan and subscriptions/plan-subscriptions.api";

import {
  getAllPlans,
  type Plan,
} from "../../api/plan and subscriptions/plan.api";
import {
  getAllCustomers,
  type Customer,
} from "../../api/customer/customer.api";

type StatusOpt = "" | "active" | "inactive" | "cancelled";
const STATUS_LABEL: Record<Exclude<StatusOpt, "">, string> = {
  active: "Activa",
  inactive: "Inactiva",
  cancelled: "Cancelada",
};

// 👉 Unwrapper: sirve para array crudo o DRF paginado
function unwrapList<T>(res: any): T[] {
  const d = res?.data;
  if (Array.isArray(d)) return d as T[];
  if (Array.isArray(d?.results)) return d.results as T[];
  return [];
}

export default function SubscriptionsGrid() {
  // catálogos
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Filtros controlados
  const [statusFilter, setStatusFilter] = useState<StatusOpt>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [planId, setPlanId] = useState<string>("");

  // -------- Paginación server-side --------
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
  } = usePager<PlanSubscription>(getPlanSubscriptions, {
    ordering: "-start_date", // más recientes primero
    page_size: 12,
  });

  // Cargar catálogos (planes y clientes) ──> usando unwrapList
  useEffect(() => {
    (async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          getAllPlans(),
          getAllCustomers(),
        ]);
        const pList = unwrapList<Plan>(pRes);
        const cList = unwrapList<Customer>(cRes);
        setPlans(pList);
        setCustomers(cList);
      } catch (e) {
        console.error("Error cargando catálogos:", e);
        setPlans([]); // fallback seguro
        setCustomers([]);
      } finally {
        setLoadingCats(false);
      }
    })();
  }, []);

  // Aplicar filtros al server-side params
  useEffect(() => {
    setPage(1);
    setParams((p: any) => ({
      ...p,
      status: statusFilter || undefined,
      customer: customerId ? Number(customerId) : undefined,
      plan: planId ? Number(planId) : undefined,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, customerId, planId]);

  // Mapas id -> nombre (seguros aunque vengan vacíos)
  const planNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of plans) m.set(p.id, p.name);
    return m;
  }, [plans]);

  const customerNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of customers) m.set(c.id, c.name);
    return m;
  }, [customers]);

  /* ------------------- CRUD ------------------- */
  const onCreateSubmit = async (values: SubscriptionFormValues) => {
    await createPlanSubscription({
      customer: Number(values.customer),
      plan: Number(values.plan),
      start_date: values.start_date,
      status: values.status,
      notes: values.notes?.trim() || undefined,
    });
    setPage(1); // para ver la nueva primero según ordering
    await reload();
  };

  const [selected, setSelected] = useState<PlanSubscription | null>(null);

  const onEditSubmit = async (values: SubscriptionFormValues) => {
    if (!selected) return;
    await partialUpdatePlanSubscription(selected.id, {
      plan: values.plan ? Number(values.plan) : undefined,
      start_date: values.start_date,
      status: values.status,
      notes: values.notes?.trim() || undefined,
    });
    await reload();
  };

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const openEdit = (row: PlanSubscription) => {
    setSelected(row);
    setEditOpen(true);
  };
  const closeEdit = () => {
    setSelected(null);
    setEditOpen(false);
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const askDelete = (id: number) => {
    setPendingId(id);
    setConfirmOpen(true);
  };

  const onDelete = async (id: number) => {
    setDeletingIds((s) => new Set(s).add(id));
    try {
      await deletePlanSubscription(id);
      if (rows.length - 1 <= 0 && page > 1) setPage(page - 1);
      await reload();
    } catch {
      alert("Error al eliminar suscripción");
    } finally {
      setDeletingIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  };

  const onCancel = async (row: PlanSubscription) => {
    if (!confirm(`¿Cancelar suscripción #${row.id}?`)) return;
    try {
      await cancelSubscription(row.id);
      await reload();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        "No se pudo cancelar la suscripción.";
      alert(msg);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 sm:px-6 border-b border-gray-100 dark:border-white/[0.06]">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Suscripciones
        </h3>

        <div className="flex w-full sm:w-auto items-center gap-3">
          {/* Filtro estado */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700 dark:text-gray-400">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusOpt)}
              className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="">Todos</option>
              <option value="active">Activa</option>
              <option value="inactive">Inactiva</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>

          {/* Filtros rápidos por ID */}
          <input
            type="number"
            placeholder="Cliente ID"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="h-10 w-28 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
          <input
            type="number"
            placeholder="Plan ID"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            className="h-10 w-28 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />

          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 shadow-theme-xs"
          >
            Añadir suscripción +
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="p-5 sm:p-6">
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: pageSize }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 p-4 dark:border-white/[0.06] animate-pulse"
              >
                <div className="h-5 w-2/3 bg-gray-200 dark:bg-white/10 rounded mb-3" />
                <div className="h-4 w-5/6 bg-gray-200 dark:bg-white/10 rounded mb-6" />
                <div className="h-9 w-28 bg-gray-200 dark:bg-white/10 rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && rows.length === 0 && (
          <p className="text-sm text-gray-500">
            No hay suscripciones para mostrar.
          </p>
        )}

        {!loading && rows.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rows.map((s) => {
              // 👇 Preferimos lo que viene en el JSON del backend
              const customerName =
                s.customer_info?.name ??
                customerNameById.get(s.customer) ??
                `Cliente #${s.customer}`;

              const planName =
                s.plan_detail?.name ??
                planNameById.get(s.plan) ??
                `Plan #${s.plan}`;

              return (
                <article
                  key={s.id}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-theme-md dark:border-white/[0.06] dark:bg-white/[0.03]"
                >
                  <header className="flex items-start justify-between gap-3">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white/90">
                      {customerName}
                    </h4>
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                        s.status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300"
                          : s.status === "cancelled"
                          ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                          : "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/70"
                      }`}
                    >
                      {STATUS_LABEL[
                        s.status as keyof typeof STATUS_LABEL
                      ] ?? s.status}
                    </span>
                  </header>

                  <p className="mt-2 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Plan:</span> {planName}
                  </p>

                  <footer className="mt-4 flex items-center justify-end gap-2">
                    {s.status !== "cancelled" && (
                      <button
                        onClick={() => onCancel(s)}
                        className="rounded-lg border border-amber-500 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                      >
                        Cancelar
                      </button>
                    )}

                    <button
                      onClick={() => openEdit(s)}
                      className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => askDelete(s.id)}
                      className="rounded-lg border border-red-500 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                      disabled={deletingIds.has(s.id)}
                    >
                      {deletingIds.has(s.id)
                        ? "Eliminando…"
                        : "Eliminar"}
                    </button>
                  </footer>
                </article>
              );
            })}
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-600">{String(error)}</p>
        )}
      </div>

      {/* --- Modales --- */}
      <SubscriptionModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={onCreateSubmit}
        title="Añadir suscripción"
        submitLabel="Guardar suscripción"
      />

      <SubscriptionModal
        isOpen={editOpen}
        onClose={closeEdit}
        initial={
          selected
            ? {
                customer: String(selected.customer),
                plan: String(selected.plan),
                start_date: selected.start_date,
                status: selected.status,
                notes: selected.notes ?? "",
              }
            : undefined
        }
        onSubmit={onEditSubmit}
        title="Editar suscripción"
        submitLabel="Actualizar suscripción"
      />

      {/* Confirmación eliminar */}
      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        className="max-w-md p-6"
      >
        <h4 className="text-lg font-semibold mb-2">
          Confirmar eliminación
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          ¿Seguro que quieres eliminar esta suscripción? Esta acción no
          se puede deshacer.
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

      {/* Footer: info + paginación */}
      <div className="px-5 pb-4 sm:px-6">
        <div className="mt-2 text-xs text-gray-500">Total: {count}</div>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
          pageSizeOptions={[8, 12, 16, 24]}
        />
      </div>
    </div>
  );
}
