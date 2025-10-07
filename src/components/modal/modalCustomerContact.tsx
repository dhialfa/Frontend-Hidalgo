import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";

export type CustomerContactFormValues = {
  name: string;
  email: string;
  phone?: string;
  is_main: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Si hay valores iniciales -> modo editar; si no -> crear */
  initial?: Partial<CustomerContactFormValues>;
  /** El padre define qué hacer con los datos (create/update) */
  onSubmit: (values: CustomerContactFormValues) => Promise<void>;
  title?: string;
  submitLabel?: string;
  customerName?: string;
};

export default function CustomerContactModal({
  isOpen,
  onClose,
  initial,
  onSubmit,
  title = "Añadir contacto",
  submitLabel = "Guardar contacto",
  customerName,
}: Props) {
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isMain, setIsMain] = useState(false);

  // Cargar datos iniciales si hay (modo editar)
  useEffect(() => {
    if (isOpen) {
      setName(initial?.name ?? "");
      setEmail(initial?.email ?? "");
      setPhone(initial?.phone ?? "");
      setIsMain(initial?.is_main ?? false);
    }
  }, [isOpen, initial]);

  const handleSubmit = async () => {
    if (!name.trim()) return alert("El nombre es obligatorio");
    if (!email.trim()) return alert("El correo es obligatorio");

    try {
      setSaving(true);
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        is_main: isMain,
      });
      onClose();
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[700px] p-6 lg:p-10"
    >
      <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
        <div>
          <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {title}
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {title.includes("Editar")
              ? `Actualiza la información del contacto${
                  customerName ? ` de ${customerName}` : ""
                }.`
              : `Registra un nuevo contacto${
                  customerName ? ` para ${customerName}` : ""
                }.`}
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
              placeholder="Juan Pérez"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Correo electrónico *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              placeholder="correo@empresa.com"
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

          {/* Principal */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Principal
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
              <input
                type="checkbox"
                checked={isMain}
                onChange={(e) => setIsMain(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700"
              />
              Marcar como principal
            </label>
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center gap-3 mt-6 sm:justify-end">
          <button
            onClick={onClose}
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
