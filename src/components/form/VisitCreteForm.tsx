import { useMemo, useState } from "react";
import ComponentCard from "../common/ComponentCard";
import Label from "./Label";
import Input from "./input/InputField";
import Select from "./Select";
import { CalenderIcon, TimeIcon } from "../../icons";
import Flatpickr from "react-flatpickr";
import CustomerSelect from "../select/customerSelect";

import {
  createVisit,
  type Visit,
  type VisitStatus,
} from "../../api/visit/visits.api";

// Opcional: por si quieres reusar estilos para botones
function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={
        "inline-flex items-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 shadow-theme-xs disabled:opacity-60 " +
        className
      }
    />
  );
}
function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={
        "rounded-lg border px-4 py-2.5 text-sm dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/[0.06] " +
        className
      }
    />
  );
}

type Props = {
  /** Si lo pasas, el campo subscription queda prellenado (y oculto si hideSubscriptionWhenPrefilled=true) */
  defaultSubscriptionId?: number;
  /** Si lo pasas, guardamos el customer en el payload si necesitas en tu backend (lo quité porque tu Visit no lo recibe directo, va por subscription) */
  defaultCustomerId?: number;
  /** Si lo pasas, prellena user id */
  defaultUserId?: number;
  /** Estado por defecto */
  defaultStatus?: VisitStatus;
  /** Muestra/oculta el campo Subscription si viene prefijado */
  hideSubscriptionWhenPrefilled?: boolean;
  /** Callback al crear */
  onCreated?: (visit: Visit) => void;
  /** Título del card */
  title?: string;
};

const STATUS_OPTIONS: { value: VisitStatus; label: string }[] = [
  { value: "scheduled",   label: "Programada" },
  { value: "in_progress", label: "En progreso" },
  { value: "completed",   label: "Completada" },
  { value: "canceled",    label: "Cancelada" },
];

export default function VisitCreateForm({
  defaultSubscriptionId,
  defaultUserId,
  defaultStatus = "scheduled",
  hideSubscriptionWhenPrefilled = false,
  onCreated,
  title = "Crear visita",
}: Props) {
  // ---------- Estado del formulario ----------
  const [subscriptionId, setSubscriptionId] = useState<string>(
    defaultSubscriptionId ? String(defaultSubscriptionId) : ""
  );
  const [userId, setUserId] = useState<string>(defaultUserId ? String(defaultUserId) : "");
  const [status, setStatus] = useState<VisitStatus>(defaultStatus);

  // Fecha (Flatpickr entrega Date[]); Hora (HH:mm)
  const [dateVal, setDateVal] = useState<Date | null>(null);
  const [timeVal, setTimeVal] = useState<string>(""); // "14:30"

  // Otros campos
  const [siteAddress, setSiteAddress] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // UI
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const canHideSubscription = useMemo(
    () => hideSubscriptionWhenPrefilled && Boolean(defaultSubscriptionId),
    [hideSubscriptionWhenPrefilled, defaultSubscriptionId]
  );

  // ---------- Helpers ----------
  const buildStartISO = (): string | null => {
    if (!dateVal) return null;
    // si no hay hora, por defecto "00:00"
    const [hh, mm] = (timeVal || "00:00").split(":").map((n) => parseInt(n, 10));
    const local = new Date(
      dateVal.getFullYear(),
      dateVal.getMonth(),
      dateVal.getDate(),
      isNaN(hh) ? 0 : hh,
      isNaN(mm) ? 0 : mm,
      0,
      0
    );
    return local.toISOString(); // el backend espera ISO (UTC)
  };

  const validate = (): string | null => {
    if (!subscriptionId.trim()) return "La suscripción es requerida (ID).";
    if (!dateVal) return "La fecha es requerida.";
    // user puede ser opcional si backend lo permite, si no, descomenta:
    // if (!userId.trim()) return "El usuario es requerido (ID).";
    return null;
  };

  // ---------- Submit ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vErr = validate();
    if (vErr) { setErr(vErr); return; }
    setErr(null);
    setSubmitting(true);

    try {
      const startISO = buildStartISO();
      const payload: Partial<Visit> = {
        // campos que tu backend reconoce (según VisitSerializer)
        subscription: Number(subscriptionId),
        user: userId ? Number(userId) : undefined,
        start: startISO!,
        // end: null, // si quieres mandarlo
        status,
        site_address: siteAddress || "",
        notes: notes || "",
        cancel_reason: "", // no aplica en creación
      };

      const res = await createVisit(payload);
      onCreated?.(res.data);
      // reset rápido (deja suscripción y usuario como están)
      setDateVal(null);
      setTimeVal("");
      setSiteAddress("");
      setNotes("");
      setStatus(defaultStatus);
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        (typeof e?.response?.data === "object" ? JSON.stringify(e.response.data) : "Error al crear la visita");
      setErr(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ComponentCard title={title}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente */}
        <div>
        <CustomerSelect
            value={c ?? null}
            onChange={(id) => console.log("Seleccionado cliente:", id)}
        />
        </div>

        {/* Subscription ID */}
        {!canHideSubscription && (
        <div>
            <Label htmlFor="subscriptionId">ID de suscripción</Label>
            <Input
            id="subscriptionId"
            type="number"
            placeholder="Ej: 6"
            value={subscriptionId}
            onChange={(e) => setSubscriptionId(e.target.value)}
            />
        </div>
        )}

        {/* User ID (opcional si backend lo permite) */}
        <div>
          <Label htmlFor="userId">ID de usuario (opcional)</Label>
          <Input
            id="userId"
            type="number"
            placeholder="Ej: 3"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>

        {/* Estado */}
        <div>
          <Label>Estado</Label>
          <Select
            options={STATUS_OPTIONS}
            placeholder="Selecciona estado"
            onChange={(val: string) => setStatus(val as VisitStatus)}
            className="dark:bg-dark-900"
          />
        </div>

        {/* Fecha */}
        <div>
          <Label htmlFor="datePicker">Fecha</Label>
          <div className="relative w-full flatpickr-wrapper">
            <Flatpickr
              // Flatpickr acepta Date[] normalmente; pasamos dateVal como Date|'' según tu ejemplo
              value={dateVal || ""}
              onChange={(dates: Date[]) => setDateVal(dates?.[0] ?? null)}
              options={{ dateFormat: "Y-m-d" }}
              placeholder="Selecciona la fecha"
              className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
              <CalenderIcon className="size-6" />
            </span>
          </div>
        </div>

        {/* Hora */}
        <div>
          <Label htmlFor="timeInput">Hora</Label>
          <div className="relative">
            <Input
              id="timeInput"
              type="time"
              value={timeVal}
              onChange={(e) => setTimeVal(e.target.value)}
            />
            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
              <TimeIcon className="size-6" />
            </span>
          </div>
        </div>

        {/* Dirección */}
        <div>
          <Label htmlFor="siteAddress">Dirección (opcional)</Label>
          <Input
            id="siteAddress"
            type="text"
            placeholder="Dirección del sitio (opcional)"
            value={siteAddress}
            onChange={(e) => setSiteAddress(e.target.value)}
          />
        </div>

        {/* Notas */}
        <div>
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Input
            id="notes"
            type="text"
            placeholder="Notas de la visita"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Error */}
        {err && (
          <div className="text-sm text-red-600 dark:text-red-400">
            {err}
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center gap-3">
          <PrimaryButton type="submit" disabled={submitting}>
            {submitting ? "Creando…" : "Crear visita"}
          </PrimaryButton>
          <GhostButton type="button" onClick={() => {
            setDateVal(null);
            setTimeVal("");
            setSiteAddress("");
            setNotes("");
            setStatus(defaultStatus);
          }}>
            Limpiar
          </GhostButton>
        </div>
      </form>
    </ComponentCard>
  );
}
