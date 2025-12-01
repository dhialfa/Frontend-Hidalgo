// src/components/modal/modalPlan.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { Modal } from "../ui/modal";

export type PlanFormValues = {
  name: string;
  description?: string;
  price?: number;
  active: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Si hay valores iniciales -> modo editar; si no -> crear */
  initial?: Partial<PlanFormValues>;
  /** El padre define qué hacer con los datos (create/update) */
  onSubmit: (values: PlanFormValues) => Promise<void>;
  title?: string;
  submitLabel?: string;
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

export default function PlanModal({
  isOpen,
  onClose,
  initial,
  onSubmit,
  title = "Añadir plan",
  submitLabel = "Guardar plan",
}: Props) {
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // Lo manejamos como string para evitar problemas con . y ,
  const [priceInput, setPriceInput] = useState("");
  const [active, setActive] = useState(true);

  // 🔹 Errores (frontend + backend)
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");

    const raw = (initial as any)?.price;
    if (raw === 0 || raw === "0" || (raw != null && raw !== "")) {
      setPriceInput(String(raw));
    } else {
      setPriceInput("");
    }

    setActive(typeof initial?.active === "boolean" ? initial.active : true);
    setErrors([]);
  }, [isOpen, initial]);

  const handleClose = () => {
    setErrors([]);
    onClose();
  };

  const parsePrice = (raw: string): number | undefined => {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    const normalized = trimmed.replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : undefined;
  };

  const handleSubmit = async () => {
    const localErrors: string[] = [];

    if (!name.trim()) {
      localErrors.push("El nombre es obligatorio.");
    }

    const parsedPrice = parsePrice(priceInput);
    if (priceInput.trim() && parsedPrice === undefined) {
      localErrors.push("El precio no es válido.");
    }

    if (localErrors.length > 0) {
      setErrors(localErrors);
      return;
    }

    try {
      setSaving(true);
      setErrors([]);
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        price: parsedPrice,
        active,
      });
      handleClose();
    } catch (err) {
      console.error("plan submit error:", err);
      setErrors(
        buildErrorMessages(err, "Operación no completada al guardar el plan."),
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const isEdit = title.toLowerCase().includes("editar");

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-[700px] p-6 lg:p-10"
    >
      <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
        <div>
          <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {title}
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isEdit
              ? "Actualiza la información del plan."
              : "Registra un nuevo plan para tu sistema."}
          </p>
        </div>

        {/* 🔹 Bloque de errores */}
        {errors.length > 0 && (
          <div className="mt-4 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
            <ul className="list-disc pl-5 space-y-1">
              {errors.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-6 sm:mt-8 sm:grid-cols-2">
          {/* Nombre */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Nombre *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              placeholder="Plan Empresarial"
              disabled={saving}
            />
          </div>

          {/* Descripción */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              placeholder="Incluye visitas mensuales, soporte prioritario…"
              disabled={saving}
            />
          </div>

          {/* Precio */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Precio (mensual)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              placeholder="25000"
              disabled={saving}
            />
          </div>

          {/* Estado */}
          <div className="flex items-end">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Estado
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700"
                  disabled={saving}
                />
                Activo
              </label>
            </div>
          </div>
        </div>

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
            disabled={saving}
            className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 sm:w-auto"
          >
            {saving ? "Guardando..." : submitLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
