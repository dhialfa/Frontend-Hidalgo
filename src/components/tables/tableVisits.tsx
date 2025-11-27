// src/components/visits/VisitsTable.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Pagination from "../ui/Pagination";
import {
  getVisits,
  getVisitsByCustomer,
  startVisitNow,
  completeVisit,
  cancelVisit,
  createVisit,
  patchVisit,
  deleteVisit,
  type Visit,
  type VisitStatus,
} from "../../api/visit/visits.api";
import {
  getPlanSubscription,
  type PlanSubscription,
} from "../../api/plan and subscriptions/plan-subscriptions.api";
import VisitModal, {
  type VisitBackendDTO,
  type VisitModalInitial,
} from "../../components/modal/VisitModal";
import MaterialsUsedModal from "../modal/MaterialUsedModal";
import EvidencesModal from "../modal/EvidencesModal";
import TasksCompletedModal from "../modal/TaskCompletedModal";

type Mode = "all" | "byCustomer";

type Props = {
  mode: Mode;
  customerId?: number; // requerido si mode === 'byCustomer'
  title?: string;
  pageSize?: number;
  showFilters?: boolean;
  defaultStatus?: VisitStatus | "all";
  showIds?: boolean;
};

const STATUS_LABEL: Record<VisitStatus, string> = {
  scheduled: "Programada",
  in_progress: "En progreso",
  completed: "Completada",
  canceled: "Cancelada",
};

/**
 * Formatea fechas usando la zona horaria del navegador del usuario.
 */
function fmtDate(date?: string | null) {
  if (!date) return "—";

  const d = new Date(date);

  return d.toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function uniqNumbers(arr: Array<number | null | undefined>): number[] {
  return Array.from(
    new Set(arr.filter((x): x is number => typeof x === "number"))
  );
}

function ActionSeparator() {
  return (
    <span
      aria-hidden
      className="mx-1 h-6 w-px self-center bg-gray-200 dark:bg-white/10"
    />
  );
}

type PlanTaskLite = { id: number; name: string; description?: string };

type PlanSubscriptionWithDetail = PlanSubscription & {
  plan_detail?: { tasks?: PlanTaskLite[] };
  customer_info?: { name?: string };
};

export default function VisitsTable({
  mode,
  customerId,
  title,
  pageSize = 20,
  showFilters = true,
  defaultStatus = "all",
  showIds = false,
}: Props) {
  const [rows, setRows] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Paginación
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [pageSizeState, setPageSizeState] = useState(pageSize);

  // Filtros
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<VisitStatus | "all">(defaultStatus);
  const [ordering, setOrdering] = useState("-start");

  // Acción rápida en curso
  const [actingId, setActingId] = useState<number | null>(null);

  // Cache de suscripciones (mismo tipo que espera VisitModal)
  const [subCache, setSubCache] = useState<Record<number, PlanSubscription>>(
    {}
  );

  // MODAL CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState<VisitModalInitial>({
    id: null,
    subscriptionId: null,
    userId: null,
    startISO: null,
    endISO: null,
    status: "scheduled",
    site_address: "",
    notes: "",
    cancel_reason: "",
    customerName: "",
  });

  // Modales secundarios
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [materialsVisitId, setMaterialsVisitId] = useState<number | null>(null);

  const [evidencesOpen, setEvidencesOpen] = useState(false);
  const [evidencesVisitId, setEvidencesVisitId] = useState<number | null>(null);

  const [tasksOpen, setTasksOpen] = useState(false);
  const [tasksVisitId, setTasksVisitId] = useState<number | null>(null);
  const [tasksPlanTasks, setTasksPlanTasks] = useState<PlanTaskLite[]>([]);

  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const toggleRow = (id: number) =>
    setExpandedRow((prev) => (prev === id ? null : id));

  const headerTitle = useMemo(
    () =>
      title ?? (mode === "byCustomer" ? "Visitas por cliente" : "Visitas"),
    [mode, title]
  );

  // Loader con paginación DRF
  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const params: any = {
        page,
        page_size: pageSizeState,
        ordering,
      };
      if (search.trim()) params.search = search.trim();
      if (status !== "all") params.status = status;

      const res =
        mode === "byCustomer"
          ? await getVisitsByCustomer(customerId!, params)
          : await getVisits(params);

      const data: any = res.data;
      const results: Visit[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];

      setRows(results);
      setCount(Array.isArray(data) ? data.length : Number(data?.count ?? 0));

      // Prefetch de suscripciones para datos de cliente y plan/tareas
      const subIds = uniqNumbers(results.map((v) => (v as any).subscription));
      const missing = subIds.filter((id) => !(id in subCache));
      if (missing.length) {
        const fetchedEntries = await Promise.allSettled(
          missing.map((id) => getPlanSubscription(id))
        );
        const next: Record<number, PlanSubscription> = {};
        fetchedEntries.forEach((r, i) => {
          if (r.status === "fulfilled") {
            next[missing[i]] = r.value.data as PlanSubscription;
          }
        });
        if (Object.keys(next).length) {
          setSubCache((prev) => ({ ...prev, ...next }));
        }
      }
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Error al cargar visitas");
      setRows([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "byCustomer" && !customerId) return;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, customerId, page, pageSizeState, search, status, ordering]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil((count || 0) / pageSizeState)),
    [count, pageSizeState]
  );

  // Acciones rápidas
  const doStart = async (id: number) => {
    setActingId(id);
    try {
      await startVisitNow(id);
      await load();
    } finally {
      setActingId(null);
    }
  };

  const doComplete = async (id: number) => {
    setActingId(id);
    try {
      await completeVisit(id); // POST /id/complete/ -> dispara correo
      await load();
    } finally {
      setActingId(null);
    }
  };

  const doCancel = async (id: number) => {
    const reason = prompt("Motivo de cancelación (opcional):") ?? "";
    setActingId(id);
    try {
      await cancelVisit(id, reason);
      await load();
    } finally {
      setActingId(null);
    }
  };

  // Crear / Editar
  const openCreate = () => {
    // Tomamos la hora local del navegador del usuario
    const now = new Date();
    // Ajustamos a las 08:00 hora local del usuario
    now.setHours(8, 0, 0, 0);

    setModalInitial({
      id: null,
      subscriptionId: null,
      userId: null,
      // ISO (UTC) del instante 08:00 local; el backend lo guardará con TZ
      startISO: now.toISOString(),
      endISO: null,
      status: "scheduled",
      site_address: "",
      notes: "",
      cancel_reason: "",
      customerName: "",
    });
    setIsModalOpen(true);
  };

  const openEdit = (v: Visit) => {
    const subId = (v as any).subscription ?? null;

    const sub = subId
      ? (subCache[subId] as PlanSubscriptionWithDetail | undefined)
      : undefined;

    const cName = sub?.customer_info?.name || "";

    setModalInitial({
      id: v.id,
      subscriptionId: subId ?? null,
      userId: (v as any).user ?? null,
      startISO: (v as any).start ?? null,
      endISO: (v as any).end ?? null,
      status: (v.status as VisitStatus) ?? "scheduled",
      site_address: (v as any).site_address ?? "",
      notes: v.notes ?? "",
      cancel_reason: (v as any).cancel_reason ?? "",
      customerName: cName,
    });
    setIsModalOpen(true);
  };

  const onSaveFromModal = async (
    dto: VisitBackendDTO,
    opts?: { id?: number | null }
  ) => {
    if (opts?.id) {
      // Usamos PATCH para evitar problemas de PUT parcial (400)
      await patchVisit(opts.id, dto as any);
    } else {
      await createVisit(dto as any);
      // si agregaste un registro y ordenas por -start, vuelve a la primera página
      if (ordering === "-start") setPage(1);
    }
    setIsModalOpen(false);
    await load();
  };

  const onDeleteFromModal = async (id: number) => {
    await deleteVisit(id);
    if (rows.length - 1 <= 0 && page > 1) {
      setPage((p) => p - 1);
    }
    setIsModalOpen(false);
    await load();
  };

  // Helpers de tareas
  function getPlanTasksForVisit(v: Visit): PlanTaskLite[] {
    const subId = (v as any)?.subscription;
    if (!subId) return [];
    const sub = subCache[subId] as PlanSubscriptionWithDetail | undefined;
    const tasks = sub?.plan_detail?.tasks;
    return Array.isArray(tasks)
      ? tasks.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
        }))
      : [];
  }

  function openTasks(v: Visit) {
    setTasksPlanTasks(getPlanTasksForVisit(v));
    setTasksVisitId(v.id);
    setTasksOpen(true);
  }

  const columns = useMemo(() => {
    const base = [
      ...(showIds ? [{ key: "id", label: "ID" as const }] : []),
      { key: "cliente", label: "Cliente" as const },
      { key: "inicio", label: "Inicio" as const },
      { key: "fin", label: "Fin" as const },
      { key: "estado", label: "Estado" as const },
      { key: "direccion", label: "Dirección" as const },
      { key: "notas", label: "Notas" as const },
      { key: "toggle", label: " " as const },
    ] as const;
    return base;
  }, [showIds]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6 border-b border-gray-100 dark:border-white/[0.06]">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          {headerTitle}
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          {showFilters && (
            <>
              <input
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                placeholder="Buscar (notas, dirección, cliente)…"
                className="h-10 w-60 rounded-lg border border-gray-300 bg-transparent px-3 text-sm placeholder:text-gray-400 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
              <select
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value as any);
                }}
                className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="all">Todos los estados</option>
                <option value="scheduled">Programada</option>
                <option value="in_progress">En progreso</option>
                <option value="completed">Completada</option>
                <option value="canceled">Cancelada</option>
              </select>
              <select
                value={ordering}
                onChange={(e) => {
                  setPage(1);
                  setOrdering(e.target.value);
                }}
                className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="-start">Más recientes</option>
                <option value="start">Más antiguas</option>
                <option value="-status">Estado desc.</option>
                <option value="status">Estado asc.</option>
                {showIds && (
                  <>
                    <option value="-id">ID desc.</option>
                    <option value="id">ID asc.</option>
                  </>
                )}
              </select>
              <select
                value={pageSizeState}
                onChange={(e) => {
                  setPage(1);
                  setPageSizeState(Number(e.target.value));
                }}
                className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                title="Registros por página"
              >
                {[10, 20, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}/pág
                  </option>
                ))}
              </select>
            </>
          )}

          <button
            onClick={openCreate}
            className="h-10 rounded-lg bg-brand-500 px-3 text-sm font-medium text-white hover:bg-brand-600"
          >
            Nueva visita +
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[920px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {columns.map((c) => (
                  <TableCell
                    key={c.key}
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    {c.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-5 py-4 text-start text-gray-600 dark:text-gray-400"
                  >
                    Cargando visitas…
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-5 py-4 text-start text-gray-600 dark:text-gray-400"
                  >
                    No hay visitas.
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((v) => {
                  const start = (v as any).start ?? null;
                  const end = (v as any).end ?? null;
                  const siteAddress = (v as any).site_address ?? "—";
                  const state = (v.status || "scheduled") as VisitStatus;

                  const subId = (v as any).subscription ?? null;
                  const sub = subId
                    ? (subCache[subId] as PlanSubscriptionWithDetail | undefined)
                    : undefined;

                  const cName = sub?.customer_info?.name || "—";

                  const isOpen = expandedRow === v.id;

                  return (
                    <React.Fragment key={v.id}>
                      <tr
                        onClick={() => toggleRow(v.id)}
                        className={`cursor-pointer transition-colors ${
                          isOpen
                            ? "bg-gray-50 dark:bg-white/[0.04]"
                            : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                        }`}
                      >
                        {showIds && (
                          <TableCell className="px-5 py-4 text-theme-sm text-gray-800 dark:text-white/90">
                            {v.id}
                          </TableCell>
                        )}
                        <TableCell className="px-4 py-3 text-gray-800 dark:text-gray-100 text-theme-sm font-medium">
                          {cName}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400 text-theme-sm">
                          {fmtDate(start)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400 text-theme-sm">
                          {fmtDate(end)}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <StatusPill status={state} />
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400 text-theme-sm">
                          {siteAddress || "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400 text-theme-sm truncate max-w-[240px]">
                          {v.notes || "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-400 text-xs select-none">
                          {isOpen ? "▲" : "▼"}
                        </TableCell>
                      </tr>

                      {isOpen && (
                        <tr className="bg-gray-50 dark:bg-white/[0.03]">
                          <td
                            colSpan={columns.length}
                            className="px-5 py-3"
                          >
                            <div className="flex flex-wrap items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void doStart(v.id);
                                }}
                                disabled={actingId === v.id}
                                className="rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 px-3 py-1.5 text-xs font-semibold hover:bg-amber-200 disabled:opacity-60"
                              >
                                Iniciar
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void doComplete(v.id);
                                }}
                                disabled={actingId === v.id}
                                className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-200 disabled:opacity-60"
                              >
                                Completar
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void doCancel(v.id);
                                }}
                                disabled={actingId === v.id}
                                className="rounded-lg border border-red-500 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                              >
                                Cancelar
                              </button>

                              <ActionSeparator />

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(v);
                                }}
                                className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                              >
                                Editar
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMaterialsVisitId(v.id);
                                  setMaterialsOpen(true);
                                }}
                                className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                              >
                                Materiales usados
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEvidencesVisitId(v.id);
                                  setEvidencesOpen(true);
                                }}
                                className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                              >
                                Evidencias
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openTasks(v);
                                }}
                                className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                              >
                                Tareas
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Paginación */}
      <div className="flex items-centerjustify-between px-5 py-3 sm:px-6 border-t border-gray-100 dark:border-white/[0.06]">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Página {page} de {pageCount} • Total: {count}
        </span>
        <Pagination
          page={page}
          totalPages={pageCount}
          onPageChange={setPage}
          pageSize={pageSizeState}
          onPageSizeChange={(n) => {
            setPage(1);
            setPageSizeState(n);
          }}
          pageSizeOptions={[10, 20, 25, 50, 100]}
        />
      </div>

      {err && (
        <div className="px-5 py-3 text-sm text-red-600 dark:text-red-400 border-t border-red-100 dark:border-red-900/30">
          {err}
        </div>
      )}

      <VisitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initial={modalInitial}
        onSave={onSaveFromModal}
        onDelete={modalInitial.id ? onDeleteFromModal : undefined}
        subCache={subCache}
        setSubCache={setSubCache}
      />

      <MaterialsUsedModal
        isOpen={materialsOpen}
        onClose={() => setMaterialsOpen(false)}
        visitId={materialsVisitId}
      />

      <EvidencesModal
        isOpen={evidencesOpen}
        onClose={() => setEvidencesOpen(false)}
        visitId={evidencesVisitId}
      />

      <TasksCompletedModal
        isOpen={tasksOpen}
        onClose={() => setTasksOpen(false)}
        visitId={tasksVisitId}
        planTasks={tasksPlanTasks}
      />
    </div>
  );
}

function StatusPill({ status }: { status: VisitStatus }) {
  const palette: Record<VisitStatus, string> = {
    scheduled:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    in_progress:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    completed:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    canceled:
      "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${palette[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
