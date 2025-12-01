import { useEffect, useState } from "react";
import axios from "axios";
import { Modal } from "../ui/modal";

export type CustomerFormValues = {
  name: string;
  identification: string;
  email?: string;
  phone?: string;
  direction?: string;
  location?: string;
  active: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initial?: Partial<CustomerFormValues>;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
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

export default function CustomerModal({
  isOpen,
  onClose,
  initial,
  onSubmit,
  title = "Añadir cliente",
  submitLabel = "Guardar cliente",
}: Props) {
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [identification, setIdentification] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [direction, setDirection] = useState("");
  const [location, setLocation] = useState("");
  const [active, setActive] = useState(true);

  // 🔹 Errores (frontend + backend)
  const [errors, setErrors] = useState<string[]>([]);

  // Carga/Resetea el formulario cuando se abre o cambia "initial"
  useEffect(() => {
    if (isOpen) {
      setName(initial?.name ?? "");
      setIdentification(initial?.identification ?? "");
      setEmail(initial?.email ?? "");
      setPhone(initial?.phone ?? "");
      setDirection(initial?.direction ?? "");
      setLocation(initial?.location ?? "");
      setActive(initial?.active ?? true);
      setErrors([]);
    }
  }, [isOpen, initial]);

  const handleClose = () => {
    setErrors([]);
    onClose();
  };

  const handleSubmit = async () => {
    // Limpiamos errores previos
    const localErrors: string[] = [];

    if (!name.trim()) localErrors.push("El nombre es obligatorio.");
    if (!identification.trim())
      localErrors.push("La identificación es obligatoria.");

    if (localErrors.length > 0) {
      setErrors(localErrors);
      return;
    }

    try {
      setSaving(true);
      setErrors([]);
      await onSubmit({
        name: name.trim(),
        identification: identification.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        direction: direction.trim() || undefined,
        location: location.trim() || undefined,
        active,
      });
      handleClose();
    } catch (err) {
      console.error("customer submit error:", err);
      setErrors(
        buildErrorMessages(err, "Operación no completada al guardar el cliente.")
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
              ? "Actualiza la información del cliente."
              : "Registra un nuevo cliente para tu sistema."}
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
              placeholder="Empresa S.A."
            />
          </div>

          {/* Identificación */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Identificación *
            </label>
            <input
              type="text"
              value={identification}
              onChange={(e) => setIdentification(e.target.value)}
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              placeholder="3-101-XXXXXX"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              placeholder="user@example.com"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Teléfono
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              placeholder="8888-8888"
            />
          </div>

          {/* Dirección */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Dirección
            </label>
            <input
              type="text"
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              placeholder="La Fortuna, 300m norte…"
            />
          </div>

          {/* Ubicación */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Ubicación
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              placeholder="San Carlos"
            />
          </div>

          {/* Activo (opcional si lo quieres mostrar) */}
          {/* 
          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700"
            />
            <span className="text-sm text-gray-700 dark:text-gray-400">
              Cliente activo
            </span>
          </div>
          */}
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
