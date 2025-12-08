import { useEffect, useState } from "react";
import axios from "axios"; // 👈 para detectar AxiosError
import { Modal } from "../ui/modal/index";
import { useAuth } from "../../auth/AuthContext"; // 👈 importa el contexto

export type UserFormValues = {
  username: string;
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_active: boolean;
  is_staff: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initial?: Partial<UserFormValues> & { id?: number | string };
  onSubmit: (values: UserFormValues, id?: number | string) => Promise<void>;
  title?: string;
  submitLabel?: string;
};

export default function UserModal({
  isOpen,
  onClose,
  initial,
  onSubmit,
  title = "Añadir usuario",
  submitLabel = "Guardar usuario",
}: Props) {
  const isEdit = initial?.id != null;
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(!isEdit);
  const [password, setPassword] = useState("");
  const { role } = useAuth();
  const isCurrentAdmin = role === "admin";
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setUsername(initial?.username ?? "");
    setEmail(initial?.email ?? "");
    setFirstName(initial?.first_name ?? "");
    setLastName(initial?.last_name ?? "");
    setPhone(initial?.phone ?? "");
    setIsActive(initial?.is_active ?? true);
    setIsStaff(initial?.is_staff ?? false);
    setShowPassword(false);
    if (isEdit) {
      setChangePassword(false);
      setPassword("");
    } else {
      setChangePassword(true);
      setPassword("");
    }
    setErrors([]);
  }, [isOpen, initial, isEdit]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async () => {
    setErrors([]);
    const localErrors: string[] = [];

    if (!username.trim()) localErrors.push("El username es obligatorio.");
    if (!email.trim()) localErrors.push("El email es obligatorio.");
    const cleanPhone = phone.replace(/\D/g, ""); 
    if (cleanPhone && cleanPhone.length !== 8) {
      localErrors.push("El teléfono debe tener exactamente 8 dígitos.");
    }
    if (!isEdit && !password.trim())
      localErrors.push("La contraseña es obligatoria.");
    if (isEdit && changePassword && !password.trim()) {
      localErrors.push(
        "Escribe la nueva contraseña o desmarca 'Cambiar contraseña'."
      );
    }
    if (localErrors.length > 0) {
      setErrors(localErrors);
      return;
    }

    const originalIsStaff = initial?.is_staff ?? false;
    const finalIsStaff = isCurrentAdmin ? isStaff : originalIsStaff;

    const payload: UserFormValues = {
      username: username.trim(),
      email: email.trim(),
      first_name: firstName.trim() || undefined,
      last_name: lastName.trim() || undefined,
      phone: cleanPhone || undefined,
      is_active: isActive, 
      is_staff: finalIsStaff,
      ...(changePassword && password.trim()
        ? { password: password.trim() }
        : {}),
    };

    try {
      setSaving(true);
      await onSubmit(payload, isEdit ? initial!.id : undefined);
      handleClose();
    } catch (err: any) {
      console.error("Error al guardar usuario:", err);

      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as any;
        const msgs: string[] = [];

        if (!data) {
          msgs.push("Operación no completada.");
        } else if (typeof data === "string") {
          // El backend devolvió solo un string
          msgs.push(data);
        } else if (typeof data === "object") {
          // 1) Mensaje general
          if (data.detail) {
            msgs.push(String(data.detail));
          }
          if (data.message) {
            msgs.push(String(data.message));
          }
          if (Array.isArray(data.non_field_errors)) {
            msgs.push(...data.non_field_errors.map((m: any) => String(m)));
          }

          // 2) Errores por campo: { username: ["Ya existe"], email: ["..."], ... }
          for (const [key, value] of Object.entries(data)) {
            if (["detail", "message", "non_field_errors"].includes(key)) {
              continue;
            }
            if (Array.isArray(value)) {
              msgs.push(`${key}: ${value.map((v) => String(v)).join(" ")}`);
            } else if (value) {
              msgs.push(`${key}: ${String(value)}`);
            }
          }

          if (msgs.length === 0) {
            msgs.push("Operación no completada.");
          }
        } else {
          msgs.push("Operación no completada.");
        }

        setErrors(msgs);
      } else {
        setErrors(["Operación no completada."]);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

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
              ? "Actualiza la información del usuario."
              : "Registra un nuevo usuario para tu sistema."}
          </p>
        </div>

        {/* 🔹 Bloque de errores del backend / frontend */}
        {errors.length > 0 && (
          <div className="mt-4 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
            <ul className="list-disc pl-5 space-y-1">
              {errors.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-6 sm:mt-6 sm:grid-cols-2">
          {/* Username */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Username *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              placeholder="usuario01"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              placeholder="user@example.com"
            />
          </div>

          {/* First name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Nombre
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              placeholder="Diego"
            />
          </div>

          {/* Last name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Apellidos
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              placeholder="Hidalgo"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Teléfono
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="numeric"
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              placeholder="8888-8888"
            />
          </div>

          {/* Admin (is_staff) - SOLO visible si el usuario logueado es admin */}
          {isCurrentAdmin && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-400">
                Administrador
              </label>
              <input
                type="checkbox"
                checked={isStaff}
                onChange={(e) => setIsStaff(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700"
              />
            </div>
          )}
        </div>

        {/* Contraseña */}
        <div className="mt-6 sm:col-span-2">
          {isEdit ? (
            <div className="space-y-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={changePassword}
                  onChange={(e) => setChangePassword(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700"
                />
                Cambiar contraseña
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!changePassword}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-16 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={!changePassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-600 hover:text-brand-500 dark:text-gray-300 disabled:opacity-40"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Contraseña *
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-16 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-600 hover:text-brand-500 dark:text-gray-300"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </>
          )}
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
