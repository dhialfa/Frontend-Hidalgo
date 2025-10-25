import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../components/ui/modal";
import {
  getPlanSubscription,
  getAllPlanSubscriptions,
  type PlanSubscription,
} from "../../api/plan and subscriptions/plan-subscriptions.api";

/** =========================
 * Tipos de backend
 * ========================= */
export type VisitStatus = "scheduled" | "in_progress" | "completed" | "canceled";

export type VisitBackendDTO = {
  subscription: number;        // id (interno, no se muestra)
  user: number;                // id (input visible)
  start: string;               // ISO con Z
  end: string | null;          // ISO con Z | null
  status: VisitStatus;
  site_address: string;
  notes: string;
  cancel_reason: string;
};

export type VisitModalInitial = {
  id?: number | null;          // para saber si es edición
  subscriptionId?: number | null; // si viene preseleccionada
  userId?: number | null;
  startISO?: string | null;    // ISO inicial si edita
  endISO?: string | null;
  status?: VisitStatus;
  site_address?: string;
  notes?: string;
  cancel_reason?: string;
  customerName?: string;       // solo lectura en UI
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Datos actuales (crear o editar) */
  initial: VisitModalInitial;
  /** Guardar (crear/editar) con DTO exacto del backend */
  onSave: (payload: VisitBackendDTO, opts?: { id?: number | null }) => Promise<void>;
  /** Borrar visita (solo si hay id) */
  onDelete?: (id: number) => Promise<void>;
  /** Cache compartido (id -> subscription) para evitar N+1 */
  subCache: Record<number, PlanSubscription>;
  setSubCache: React.Dispatch<React.SetStateAction<Record<number, PlanSubscription>>>;
};

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Convierte pares fecha/hora a ISO Z (UTC) */
function toIsoZ(dateYYYYMMDD: string, timeHHMM: string): string {
  // Construimos un Date con componentes, asumimos hora local y lo emitimos en UTC
  const [y, m, d] = dateYYYYMMDD.split("-").map(Number);
  const [hh, mm] = timeHHMM.split(":").map(Number);
  const dt = new Date(Date.UTC(y, (m - 1), d, hh || 0, mm || 0, 0, 0));
  return dt.toISOString();
}

/** Parsea ISO a pares fecha/hora */
function fromIso(iso?: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  // Usamos UTC para consistencia con el backend (Z)
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const HH = String(d.getUTCHours()).padStart(2, "0");
  const MM = String(d.getUTCMinutes()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: `${HH}:${MM}` };
}

export default function VisitModal({
  isOpen,
  onClose,
  initial,
  onSave,
  onDelete,
  subCache,
  setSubCache,
}: Props) {
  const isEdit = !!initial.id;

  // --------- estado principal (controlado por UI) ----------
  const [subscriptionId, setSubscriptionId] = useState<number | null>(initial.subscriptionId ?? null);
  const [userId, setUserId] = useState<string>(initial.userId ? String(initial.userId) : "");
  const [status, setStatus] = useState<VisitStatus>(initial.status ?? "scheduled");
  const [siteAddress, setSiteAddress] = useState<string>(initial.site_address ?? "");
  const [notes, setNotes] = useState<string>(initial.notes ?? "");
  const [cancelReason, setCancelReason] = useState<string>(initial.cancel_reason ?? "");
  const [customerName, setCustomerName] = useState<string>(initial.customerName ?? "");

  // fecha/hora separadas para start/end
  const initStart = fromIso(initial.startISO ?? null);
  const initEnd = fromIso(initial.endISO ?? null);
  const [startDate, setStartDate] = useState<string>(initStart.date || "");
  const [startTime, setStartTime] = useState<string>(initStart.time || "08:00");
  const [endDate, setEndDate] = useState<string>(initEnd.date || "");
  const [endTime, setEndTime] = useState<string>(initEnd.time || "");

  // --------- buscador de suscripción por nombre -----------
  const [subSearch, setSubSearch] = useState<string>("");
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsResults, setSubsResults] = useState<PlanSubscription[]>([]);
  const [subsError, setSubsError] = useState<string | null>(null);
  const debouncedSearch = useDebounce(subSearch, 350);

  useEffect(() => {
    // Reset al abrir o cambiar initial
    setSubscriptionId(initial.subscriptionId ?? null);
    setUserId(initial.userId ? String(initial.userId) : "");
    setStatus(initial.status ?? "scheduled");
    setSiteAddress(initial.site_address ?? "");
    setNotes(initial.notes ?? "");
    setCancelReason(initial.cancel_reason ?? "");
    setCustomerName(initial.customerName ?? "");

    const s = fromIso(initial.startISO ?? null);
    const e = fromIso(initial.endISO ?? null);
    setStartDate(s.date || "");
    setStartTime(s.time || "08:00");
    setEndDate(e.date || "");
    setEndTime(e.time || "");

    setSubSearch("");
    setSubsResults([]);
    setSubsError(null);
  }, [initial, isOpen]);

  // Buscar y *mostrar solo nombres* (no IDs) — los IDs se guardan internamente
  useEffect(() => {
    async function run() {
      if (!debouncedSearch) {
        setSubsResults([]);
        setSubsError(null);
        return;
      }
      setSubsLoading(true);
      setSubsError(null);
      try {
        const { data } = await getAllPlanSubscriptions();
        const list: PlanSubscription[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.results)
          ? (data as any).results
          : [];
        const term = debouncedSearch.toLowerCase();
        const filtered = list.filter((s) => (s.customer_info?.name || "").toLowerCase().includes(term));
        setSubsResults(filtered.slice(0, 15));
      } catch (err) {
        console.error(err);
        setSubsError("No se pudieron cargar las suscripciones.");
      } finally {
        setSubsLoading(false);
      }
    }
    run();
  }, [debouncedSearch]);

  async function resolveCustomerNameFromSubscription(id: number) {
    if (!id) {
      setCustomerName("");
      return;
    }
    const cached = subCache[id];
    if (cached?.customer_info?.name) {
      setCustomerName(cached.customer_info.name);
      return;
    }
    try {
      const { data } = await getPlanSubscription(id);
      setSubCache((prev) => ({ ...prev, [data.id]: data }));
      setCustomerName(data.customer_info?.name || "Sin cliente");
    } catch {
      setCustomerName("Cliente no encontrado");
    }
  }

  const canSave = useMemo(() => {
    return (
      !!subscriptionId &&
      !!userId &&
      !!startDate &&
      !!startTime &&
      (status !== "canceled" || (status === "canceled" && cancelReason.trim().length > 0))
    );
  }, [subscriptionId, userId, startDate, startTime, status, cancelReason]);

  async function handleSave() {
    if (!canSave) {
      alert("Completa los campos requeridos.");
      return;
    }
    const start = toIsoZ(startDate, startTime);
    const end =
      endDate && endTime ? toIsoZ(endDate, endTime) : null;

    const payload: VisitBackendDTO = {
      subscription: Number(subscriptionId),
      user: Number(userId),
      start,
      end,
      status,
      site_address: siteAddress || "",
      notes: notes || "",
      cancel_reason: status === "canceled" ? (cancelReason || "") : "",
    };
    await onSave(payload, { id: initial.id ?? null });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[820px] p-6 lg:p-10">
      <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h5 className="mb-1 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              {isEdit ? "Editar visita" : "Añadir visita"}
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Programa o edita la visita
            </p>
          </div>
          {isEdit && onDelete && initial.id && (
            <button
              onClick={() => onDelete(initial.id!)}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300"
              title="Eliminar visita"
            >
              Eliminar
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* IZQUIERDA: Selección de suscripción (solo nombres) + cliente */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Buscar suscripción por cliente
              </label>
              <input
                type="text"
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                placeholder="Ej. Montana de Fuego, Euromot…"
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
              <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                  {subsLoading && (
                    <div className="p-3 text-sm text-gray-500 dark:text-gray-400">Buscando…</div>
                  )}
                  {subsError && (
                    <div className="p-3 text-sm text-red-600 dark:text-red-400">{subsError}</div>
                  )}
                  {!subsLoading && !subsError && subsResults.length === 0 && subSearch && (
                    <div className="p-3 text-sm text-gray-500 dark:text-gray-400">Sin resultados</div>
                  )}
                  {!subsLoading &&
                    subsResults.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => {
                          setSubscriptionId(s.id);
                          setCustomerName(s.customer_info?.name || "Sin cliente");
                          setSubCache((prev) => ({ ...prev, [s.id]: s }));
                        }}
                        className="block w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                        title={`Seleccionar ${s.customer_info?.name ?? ""}`}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                            {s.customer_info?.name ?? "—"}
                          </div>
                          <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {/* mostramos metadatos útiles, sin IDs */}
                            Inicio: {s.start_date} · Estado: {s.status}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Cliente (solo lectura) */}
            {customerName && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Cliente
                </label>
                <input
                  type="text"
                  value={customerName}
                  disabled
                  className="h-11 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white/80"
                />
              </div>
            )}

            {/* Si se ingresa manualmente un ID (no se muestra en UI pública) */}
            <details className="rounded-lg border border-gray-200 p-2 text-xs text-gray-500 open:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:open:bg-white/[0.03]">
              <summary className="cursor-pointer select-none">Ingresar ID de suscripción manualmente</summary>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  value={subscriptionId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setSubscriptionId(val);
                    setCustomerName("");
                  }}
                  onBlur={(e) => {
                    const val = Number(e.target.value);
                    if (val) resolveCustomerNameFromSubscription(val);
                  }}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  placeholder="ID interno"
                />
              </div>
            </details>
          </div>

          {/* DERECHA: Datos de la visita */}
          <div className="space-y-4">
            {/* User ID (visible por ahora, como pediste) */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                ID de usuario
              </label>
              <input
                type="number"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Ej. 3"
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>

            {/* Start (fecha + hora) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Inicio — Fecha
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Inicio — Hora
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
            </div>

            {/* End (opcional) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Fin — Fecha (opcional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Fin — Hora (opcional)
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VisitStatus)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="scheduled">Programada</option>
                <option value="in_progress">En progreso</option>
                <option value="completed">Completada</option>
                <option value="canceled">Cancelada</option>
              </select>
            </div>

            {/* Dirección del sitio */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Dirección del sitio
              </label>
              <input
                type="text"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                placeholder="Ej. Parque Industrial, nave 5…"
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>

            {/* Notas */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Notas
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                placeholder="Detalle adicional…"
              />
            </div>

            {/* Motivo de cancelación (solo si status = canceled) */}
            {status === "canceled" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Motivo de cancelación
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  placeholder="Describe el motivo…"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                type="button"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              >
                Cerrar
              </button>
              <button
                onClick={handleSave}
                type="button"
                disabled={!canSave}
                className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {isEdit ? "Actualizar" : "Crear visita"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
