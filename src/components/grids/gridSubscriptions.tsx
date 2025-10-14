// src/components/subscriptions/SubscriptionsGrid.tsx
import { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/modal";
import SubscriptionModal, { SubscriptionFormValues } from "../modal/modalSubscriptions";
import {
  getAllPlanSubscriptions,
  createPlanSubscription,
  partialUpdatePlanSubscription,
  deletePlanSubscription,
  cancelSubscription,
  type PlanSubscription,
} from "../../api/plan and subscriptions/plan-subscriptions.api"; // <-- verifica tu ruta
import { getAllPlans, type Plan } from "../../api/plan and subscriptions/plan.api";
import { getAllCustomers, type Customer } from "../../api/customer/customer.api";

type StatusOpt = "" | "active" | "inactive" | "cancelled";
const STATUS_LABEL: Record<Exclude<StatusOpt, "">, string> = {
  active: "Activa",
  inactive: "Inactiva",
  cancelled: "Cancelada",
};

// Si tu backend usa paginación DRF, descomenta esto y úsalo al leer res.data
// const unwrapList = <T,>(data: any): T[] => Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);

export default function SubscriptionsGrid() {
  const [data, setData] = useState<PlanSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // catálogos
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<StatusOpt>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [planId, setPlanId] = useState<string>("");

  // Modales
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<PlanSubscription | null>(null);

  // Confirm delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  // Cargar catálogos (planes y clientes)
  useEffect(() => {
    (async () => {
      try {
        const [pRes, cRes] = await Promise.all([getAllPlans(), getAllCustomers()]);
        const pList = (pRes.data ?? []) as Plan[];
        const cList = (cRes.data ?? []) as Customer[]; 
        setPlans(Array.isArray(pList) ? pList : []);
        setCustomers(Array.isArray(cList) ? cList : []);
      } catch (e) {
        console.error("Error cargando catálogos:", e);
      } finally {
        setLoadingCats(false);
      }
    })();
  }, []);

  // Cargar suscripciones
  useEffect(() => {
    (async () => {
      try {
        const res = await getAllPlanSubscriptions({
          status: statusFilter || undefined,
          customer: customerId ? Number(customerId) : undefined,
          plan: planId ? Number(planId) : undefined,
        });
        // const list = unwrapList<PlanSubscription>(res); // si cambiaste getAll para devolver array directo
        const list = (res.data ?? []) as PlanSubscription[]; // si tu client devuelve {data}
        setData(sortList(list));
      } catch (e: any) {
        console.error("Subs load error:", e?.response?.data || e);
        setError(e?.response?.data?.detail || "Error al cargar suscripciones");
      } finally {
        setLoading(false);
      }
    })();
  }, [statusFilter, customerId, planId]);

  const sortList = (arr: PlanSubscription[]) =>
    arr.slice().sort((a, b) =>
      a.start_date === b.start_date ? a.id - b.id : (a.start_date < b.start_date ? 1 : -1)
    );

  // Mapas id -> nombre
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

  const filtered = useMemo(() => data, [data]);

  /* ------------------- CRUD ------------------- */
  const onCreateSubmit = async (values: SubscriptionFormValues) => {
    const res = await createPlanSubscription({
      customer: Number(values.customer),
      plan: Number(values.plan),
      start_date: values.start_date,
      status: values.status,
      notes: values.notes?.trim() || undefined,
    });
    const created = res.data as PlanSubscription;
    setData(prev => sortList([created, ...prev]));
  };

  const onEditSubmit = async (values: SubscriptionFormValues) => {
    if (!selected) return;
    const res = await partialUpdatePlanSubscription(selected.id, {
      // cliente bloqueado en modal; igual no lo mandamos si no cambia
      plan: values.plan ? Number(values.plan) : undefined,
      start_date: values.start_date,
      status: values.status,
      notes: values.notes?.trim() || undefined,
    });
    const updated = res.data as PlanSubscription;
    setData(prev => sortList(prev.map(s => (s.id === updated.id ? updated : s))));
  };

  const openEdit = (row: PlanSubscription) => {
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
    setDeletingIds(s => new Set(s).add(id));
    try {
      await deletePlanSubscription(id);
      setData(prev => prev.filter(s => s.id !== id));
    } catch {
      alert("Error al eliminar suscripción");
    } finally {
      setDeletingIds(s => {
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
      setData(prev =>
        prev.map(s => (s.id === row.id ? { ...s, status: "cancelled" } : s))
      );
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "No se pudo cancelar la suscripción.";
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
            <label className="text-sm text-gray-700 dark:text-gray-400">Estado</label>
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

          {/* Filtros rápidos por ID (puedes cambiarlos por selects si quieres también aquí) */}
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
            {Array.from({ length: 4 }).map((_, i) => (
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

        {!loading && filtered.length === 0 && (
          <p className="text-sm text-gray-500">No hay suscripciones para mostrar.</p>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((s) => {
              const planName = planNameById.get(s.plan) ?? `Plan #${s.plan}`;
              const customerName = customerNameById.get(s.customer) ?? `Cliente #${s.customer}`;
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
                      {STATUS_LABEL[s.status as keyof typeof STATUS_LABEL] ?? s.status}
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
                      {deletingIds.has(s.id) ? "Eliminando…" : "Eliminar"}
                    </button>
                  </footer>
                </article>
              );
            })}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* --- Modal CREAR --- */}
      <SubscriptionModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={onCreateSubmit}
        title="Añadir suscripción"
        submitLabel="Guardar suscripción"
      />

      {/* --- Modal EDITAR --- */}
      <SubscriptionModal
        isOpen={editOpen}
        onClose={closeEdit}
        initial={selected ? {
          customer: String(selected.customer), // 🔒 el modal lo deshabilita al editar
          plan: String(selected.plan),
          start_date: selected.start_date,
          status: selected.status,
          notes: selected.notes ?? "",
        } : undefined}
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
        <h4 className="text-lg font-semibold mb-2">Confirmar eliminación</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          ¿Seguro que quieres eliminar esta suscripción? Esta acción no se puede deshacer.
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
