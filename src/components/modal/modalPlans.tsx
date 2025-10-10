// src/components/modal/modalPlan.tsx
import { useEffect, useState } from "react";
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
}, [isOpen, initial]);

  const handleClose = () => {
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
    if (!name.trim()) return alert("El nombre es obligatorio");
    const parsedPrice = parsePrice(priceInput);
    if (priceInput.trim() && parsedPrice === undefined) {
      return alert("El precio no es válido");
    }

    try {
      setSaving(true);
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        price: parsedPrice,
        active,
      });
      handleClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Operación no completada";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[700px] p-6 lg:p-10">
      <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
        <div>
          <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {title}
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {title.includes("Editar")
              ? "Actualiza la información del plan."
              : "Registra un nuevo plan para tu sistema."}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
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
