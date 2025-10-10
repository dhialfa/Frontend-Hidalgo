import { useEffect, useState } from "react";
import { Modal } from "../ui/modal/index"; 

export type UserFormValues = {
  username: string;
  email: string;
  password?: string;     
  first_name?: string;
  last_name?: string;
  phone?: string;
  rol?: string;
  is_active: boolean;
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
  // CHANGE: basar edición en que exista id
  const isEdit = initial?.id != null;

  const [saving, setSaving] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [rol, setRol] = useState("");

  const [isActive, setIsActive] = useState(true);

  const [showPassword, setShowPassword] = useState(false);

  // password handling
  const [changePassword, setChangePassword] = useState(!isEdit); // en create, true por defecto
  const [password, setPassword] = useState("");

  // Cargar/Resetear el formulario cuando se abre o cambia "initial"
  useEffect(() => {
    if (!isOpen) return;

    setUsername(initial?.username ?? "");
    setEmail(initial?.email ?? "");

    setFirstName(initial?.first_name ?? "");
    setLastName(initial?.last_name ?? "");
    setPhone(initial?.phone ?? "");
    setRol(initial?.rol ?? "");

    setIsActive(initial?.is_active ?? true);

    // CHANGE: resetear ojo y flags al abrir
    setShowPassword(false);

    if (isEdit) {
      setChangePassword(false); // en editar, por defecto no cambiar
      setPassword("");
    } else {
      setChangePassword(true);  // en crear, password requerido
      setPassword("");
    }
  }, [isOpen, initial, isEdit]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async () => {
    if (!username.trim()) return alert("El username es obligatorio");
    if (!email.trim()) return alert("El email es obligatorio");
    if (!isEdit && !password.trim()) return alert("La contraseña es obligatoria");
    // CHANGE: si en edición marcó cambiar contraseña pero está vacía
    if (isEdit && changePassword && !password.trim()) {
      return alert("Escribe la nueva contraseña o desmarca 'Cambiar contraseña'.");
    }

    const payload: UserFormValues = {
      username: username.trim(),
      email: email.trim(),
      first_name: firstName.trim() || undefined,
      last_name: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
      rol: rol.trim() || undefined,
      is_active: isActive,
      // incluye password solo si corresponde
      ...(changePassword && password.trim() ? { password: password.trim() } : {}),
    };

    try {
      setSaving(true);
      // CHANGE: pasar el id cuando es edición
      await onSubmit(payload, isEdit ? initial!.id : undefined);
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
            {isEdit
              ? "Actualiza la información del usuario."
              : "Registra un nuevo usuario para tu sistema."}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
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
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              placeholder="8888-8888"
            />
          </div>

          {/* Rol */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Rol
            </label>
            <input
              type="text"
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              placeholder="admin, ventas, soporte…"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Estado
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700"
              />
              Activo
            </label>
          </div>

          {/* Contraseña */}
          <div className="sm:col-span-2">
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

                {/* Input con botón Mostrar/Ocultar */}
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

                {/* Input con botón Mostrar/Ocultar */}
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
