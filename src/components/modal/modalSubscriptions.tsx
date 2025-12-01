// src/components/modal/SubscriptionModal.tsx
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Modal } from "../ui/modal";
import { getAllPlans, type Plan } from "../../api/plan and subscriptions/plan.api";
import { getAllCustomers, type Customer } from "../../api/customer/customer.api";

export type SubscriptionFormValues = {
  customer: string;
  plan: string;
  start_date: string;   // YYYY-MM-DD
  status: string;       // active | inactive | cancelled
  notes?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initial?: Partial<SubscriptionFormValues>;
  onSubmit: (values: SubscriptionFormValues) => Promise<void>;
  title?: string;
  submitLabel?: string;
};

const STATUS_OPTIONS = [
  { value: "active", label: "Activa" },
  { value: "inactive", label: "Inactiva" },
  { value: "cancelled", label: "Cancelada" },
];

/** Acepta AxiosResponse, objeto paginado DRF, array crudo… y devuelve siempre un array */
function unwrapArray<T = any>(resOrData: any): T[] {
  const d = resOrData?.data ?? resOrData;
  if (Array.isArray(d)) return d as T[];
  if (Array.isArray(d?.results)) return d.results as T[];
  return [];
}

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

      // Errores por campo
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

export default function SubscriptionModal({
  isOpen,
  onClose,
  initial,
  onSubmit,
  title = "Añadir suscripción",
  submitLabel = "Guardar suscripción",
}: Props) {
  const [saving, setSaving] = useState(false);

  // form
  const [customer, setCustomer] = useState("");
  const [plan, setPlan] = useState("");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [status, setStatus] = useState<string>("active");
  const [notes, setNotes] = useState<string>("");

  // catálogos
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [catsError, setCatsError] = useState<string | null>(null);

  // 🔹 Errores de validación/backend del submit
  const [errors, setErrors] = useState<string[]>([]);

  // hoy (estable)
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (!isOpen) return;

    // reset errores
    setErrors([]);

    // cargar selects
    void loadCatalogs();

    // setear valores iniciales
    setCustomer(initial?.customer ?? "");
    setPlan(initial?.plan ?? "");
    setStartDate(initial?.start_date ?? today);
    setStatus(initial?.status ?? "active");
    setNotes(initial?.notes ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initial]);

  const loadCatalogs = async () => {
    setLoadingCats(true);
    setCatsError(null);
    try {
      const [pRes, cRes] = await Promise.all([getAllPlans(), getAllCustomers()]);

      const pList = unwrapArray<Plan>(pRes);
      const cList = unwrapArray<Customer>(cRes);

      // sort SIEMPRE sobre copias
      const pSorted = [...pList].sort((a, b) =>
        String(a.name).localeCompare(String(b.name)),
      );
      const cSorted = [...cList].sort((a, b) =>
        String(a.name).localeCompare(String(b.name)),
      );

      setPlans(pSorted);
      setCustomers(cSorted);
    } catch (err: any) {
      console.error("Catálogos error:", err?.response?.data || err);
      setCatsError(
        err?.response?.data?.detail ||
          err?.message ||
          "No se pudieron cargar planes/clientes.",
      );
      setPlans([]);
      setCustomers([]);
    } finally {
      setLoadingCats(false);
    }
  };

  const handleSubmit = async () => {
    const localErrors: string[] = [];

    if (!customer.trim()) localErrors.push("El cliente es obligatorio.");
    if (!plan.trim()) localErrors.push("El plan es obligatorio.");
    if (!startDate) localErrors.push("La fecha de inicio es obligatoria.");
    if (!status) localErrors.push("El estado es obligatorio.");

    if (localErrors.length > 0) {
      setErrors(localErrors);
      return;
    }

    try {
      setSaving(true);
      setErrors([]);

      await onSubmit({
        customer: customer.trim(),
        plan: plan.trim(),
        start_date: startDate,
        status,
        notes: notes.trim() || undefined,
      });
      handleClose();
    } catch (err) {
      console.error("subscription submit error:", err);
      setErrors(
        buildErrorMessages(
          err,
          "Operación no completada al guardar la suscripción.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setErrors([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-[760px] p-6 lg:p-10"
    >
      <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
        <div>
          <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {title}
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {title.includes("Editar")
              ? "Actualiza la información de la suscripción."
              : "Registra una nueva suscripción."}
          </p>
        </div>

        {/* 🔹 Errores del submit (validación + backend) */}
        {errors.length > 0 && (
          <div className="mt-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
            <ul className="list-disc pl-5 space-y-1">
              {errors.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Error de catálogos (planes/clientes) */}
        {catsError && (
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {catsError}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Cliente */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Cliente *
            </label>
            <select
              disabled={loadingCats || Boolean(initial?.customer)} // 🔒 en edición no se cambia
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className={`h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 ${
                initial?.customer ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              <option value="">Seleccione un cliente</option>
              {customers.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name} {c.identification ? `· ${c.identification}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Plan */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Plan *
            </label>
            <select
              disabled={loadingCats}
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="">Seleccione un plan</option>
              {plans.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha de inicio */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Fecha de inicio *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Estado *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notas */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Notas
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              placeholder="Comentarios de la suscripción"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-6 sm:justify-end">
          <button
            onClick={handleClose}
            type="button"
            className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
          >
            Cerrar
          </button>
          <button
            onClick={handleSubmit}
            type="button"
            disabled={saving || loadingCats}
            className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 sm:w-auto"
          >
            {saving ? "Guardando..." : submitLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
