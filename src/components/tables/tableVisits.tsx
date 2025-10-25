// src/components/visits/VisitsTable.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import {
  getVisits,
  getVisitsByCustomer,
  startVisitNow,
  completeVisit,
  cancelVisit,
  createVisit,
  updateVisit,
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

type Mode = "all" | "byCustomer";

type Props = {
  mode: Mode;
  customerId?: number;        // requerido si mode === 'byCustomer'
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

function fmtDate(date?: string | null) {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleString();
}
function unwrapList<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}
function uniqNumbers(arr: Array<number | null | undefined>): number[] {
  return Array.from(new Set(arr.filter((x): x is number => typeof x === "number")));
}
function toDateOnly(isoLike?: string | null) {
  return (isoLike || "").slice(0, 10);
}

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
  const [count, setCount] = useState<number | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<VisitStatus | "all">(defaultStatus);
  const [ordering, setOrdering] = useState("-start");

  // Acción rápida en curso
  const [actingId, setActingId] = useState<number | null>(null);

  // Cache de suscripciones (para nombre de cliente)
  const [subCache, setSubCache] = useState<Record<number, PlanSubscription>>({});

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

  // Fila expandida (para mostrar acciones al tocar)
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  function toggleRow(id: number) {
    setExpandedRow(prev => (prev === id ? null : id));
  }

  const headerTitle = useMemo(() => {
    if (title) return title;
    return mode === "byCustomer" ? "Visitas por cliente" : "Visitas";
  }, [mode, title]);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const params: any = { page, page_size: pageSize, ordering };
      if (search.trim()) params.search = search.trim();
      if (status !== "all") params.status = status;

      const res =
        mode === "byCustomer"
          ? await getVisitsByCustomer(customerId!, params)
          : await getVisits(params);

      const data = res.data as any;
      const list = unwrapList<Visit>(data);

      // Prefetch suscripciones para mostrar nombre del cliente
      const subIds = uniqNumbers(list.map(v => (v as any).subscription ?? undefined));
      const missing = subIds.filter(id => !(id in subCache));
      if (missing.length) {
        const results = await Promise.allSettled(missing.map(id => getPlanSubscription(id)));
        const fetched: Record<number, PlanSubscription> = {};
        results.forEach((r, i) => {
          if (r.status === "fulfilled") fetched[missing[i]] = r.value.data;
        });
        if (Object.keys(fetched).length) {
          setSubCache(prev => ({ ...prev, ...fetched }));
        }
      }

      if (Array.isArray(data)) {
        setRows(list);
        setCount(data.length);
      } else if (data?.results != null) {
        setRows(list);
        setCount(data.count ?? null);
      } else {
        setRows([]);
        setCount(0);
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, customerId, page, pageSize, search, status, ordering]);

  const pageCount = useMemo(() => {
    if (count == null) return null;
    return Math.max(1, Math.ceil(count / pageSize));
  }, [count, pageSize]);

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
      await completeVisit(id);
      await load();
    } finally {
      setActingId(null);
    }
  };
  const doCancel = async (id: number) => {
    const reason = prompt("Motivo de cancelación (opcional):") ?? "";
    setActingId(id);
    try {
      // Si tu endpoint acepta motivo: await cancelVisit(id, reason)
      await cancelVisit(id);
      await load();
    } finally {
      setActingId(null);
    }
  };

  // Abrir modal para crear
  const openCreate = () => {
    const today = toDateOnly(new Date().toISOString());
    setModalInitial({
      id: null,
      subscriptionId: null,
      userId: null,
      startISO: `${today}T08:00:00.000Z`,
      endISO: null,
      status: "scheduled",
      site_address: "",
      notes: "",
      cancel_reason: "",
      customerName: "",
    });
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const openEdit = (v: Visit) => {
    const subId = (v as any).subscription ?? null;
    const cName = subId && subCache[subId]?.customer_info?.name
      ? subCache[subId]!.customer_info!.name
      : "";
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

  // Guardar desde modal
  async function onSaveFromModal(dto: VisitBackendDTO, opts?: { id?: number | null }) {
    if (opts?.id) await updateVisit(opts.id, dto as any);
    else await createVisit(dto as any);
    setIsModalOpen(false);
    await load();
  }

  // Eliminar desde modal
  async function onDeleteFromModal(id: number) {
    await deleteVisit(id);
    setIsModalOpen(false);
    await load();
  }

  // Columnas (definen el ancho del colSpan)
  const columns = useMemo(() => {
    const base = [
      ...(showIds ? [{ key: "id", label: "ID" as const }] : []),
      { key: "cliente", label: "Cliente" as const },
      { key: "inicio", label: "Inicio" as const },
      { key: "fin", label: "Fin" as const },
      { key: "estado", label: "Estado" as const },
      { key: "direccion", label: "Dirección" as const },
      { key: "notas", label: "Notas" as const },
      { key: "toggle", label: " " as const }, // columna para ▼/▲
    ] as const;
    return base;
  }, [showIds]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6 border-b border-gray-100 dark:border-white/[0.06]">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">{headerTitle}</h3>

        <div className="flex flex-wrap items-center gap-2">
          {showFilters && (
            <>
              <input
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                placeholder="Buscar (notas, dirección, cliente)…"
                className="h-10 w-60 rounded-lg border border-gray-300 bg-transparent px-3 text-sm placeholder:text-gray-400 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
              <select
                value={status}
                onChange={(e) => { setPage(1); setStatus(e.target.value as any); }}
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
                onChange={(e) => { setPage(1); setOrdering(e.target.value); }}
                className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="-start">Más recientes</option>
                <option value="start">Más antiguas</option>
                <option value="-status">Estado desc.</option>
                <option value="status">Estado asc.</option>
                <option value="-id">ID desc.</option>
                <option value="id">ID asc.</option>
              </select>
            </>
          )}

          {/* Botón CREAR */}
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
                  <TableCell key={c.key} isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    {c.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {/* Filas especiales con <tr> y <td colSpan> */}
              {loading && (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-4 text-start text-gray-600 dark:text-gray-400">
                    Cargando visitas…
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-4 text-start text-gray-600 dark:text-gray-400">
                    No hay visitas.
                  </td>
                </tr>
              )}

              {/* Filas de datos: usamos <tr> nativo para onClick */}
              {!loading && rows.map((v) => {
                const start = (v as any).start ?? null;
                const end = (v as any).end ?? null;
                const siteAddress = (v as any).site_address ?? "—";
                const state = (v.status || "scheduled") as VisitStatus;

                const subId = (v as any).subscription ?? null;
                const cName =
                  subId && subCache[subId]?.customer_info?.name
                    ? subCache[subId]!.customer_info!.name
                    : "—";

                const isOpen = expandedRow === v.id;

                return (
                  <React.Fragment key={v.id}>
                    <tr
                      onClick={() => toggleRow(v.id)}
                      className={`cursor-pointer transition-colors ${
                        isOpen ? "bg-gray-50 dark:bg-white/[0.04]" : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
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

                    {/* Fila expandida con acciones */}
                    {isOpen && (
                      <tr className="bg-gray-50 dark:bg-white/[0.03]">
                        <td colSpan={columns.length} className="px-5 py-3">
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEdit(v); }}
                              className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                            >
                              Editar
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); doStart(v.id); }}
                              disabled={actingId === v.id}
                              className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                            >
                              Iniciar
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                doComplete(v.id);
                              }}
                              disabled={actingId === v.id}
                              className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-200 disabled:opacity-60"
                            >
                              Completar
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); doCancel(v.id); }}
                              disabled={actingId === v.id}
                              className="rounded-lg border border-red-500 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                            >
                              Cancelar
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
      {pageCount && pageCount > 1 && (
        <div className="flex items-center justify-between px-5 py-3 sm:px-6 border-t border-gray-100 dark:border-white/[0.06]">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Página {page} de {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-50 dark:border-gray-700"
            >
              Anterior
            </button>
            <button
              disabled={page >= pageCount}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-50 dark:border-gray-700"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {err && (
        <div className="px-5 py-3 text-sm text-red-600 dark:text-red-400 border-t border-red-100 dark:border-red-900/30">
          {err}
        </div>
      )}

      {/* MODAL CRUD */}
      <VisitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initial={modalInitial}
        onSave={onSaveFromModal}
        onDelete={modalInitial.id ? onDeleteFromModal : undefined}
        subCache={subCache}
        setSubCache={setSubCache}
      />
    </div>
  );
}

function StatusPill({ status }: { status: VisitStatus }) {
  const palette: Record<VisitStatus, string> = {
    scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    canceled: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${palette[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
