import { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/modal";
import {
  getTasksCompletedByVisit,
  createTaskCompleted,            
  updateTaskCompleted,
  deleteTaskCompleted,
  toggleCompleted,
  type TaskCompleted,
  type CreateTaskCompletedDTO,
} from "../../api/visit/task-completed.api";

export type PlanTaskLite = { id: number; name: string; description?: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  visitId: number | null;
  /** Tareas del plan de la suscripción (para ligar plan_task) */
  planTasks?: PlanTaskLite[];
};

type FormValues = {
  id?: number; // solo en edición
  plan_task?: number | null;
  name: string;
  description?: string;
  hours?: number | string;
  completada?: boolean;
};

const emptyForm: FormValues = {
  plan_task: undefined,
  name: "",
  description: "",
  hours: "",
  completada: true,
};

export default function TasksCompletedModal({
  isOpen,
  onClose,
  visitId,
  planTasks = [],
}: Props) {
  // listado
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<TaskCompleted[]>([]);
  const [error, setError] = useState<string | null>(null);

  // formulario
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormValues>(emptyForm);

  // acciones por-item
  const [actingId, setActingId] = useState<number | null>(null);

  const planTasksMap = useMemo(
    () => new Map(planTasks.map((t) => [t.id, t])),
    [planTasks]
  );

  const title = useMemo(() => {
    if (!formOpen) return visitId ? `Tareas de la visita #${visitId}` : "Tareas";
    return form.id ? "Editar tarea de visita" : "Añadir tarea a la visita";
  }, [formOpen, form.id, visitId]);

  useEffect(() => {
    if (!isOpen) return;
    setFormOpen(false);
    setForm(emptyForm);
    setError(null);
    void loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, visitId]);

  const sortTasks = (list: TaskCompleted[]) =>
    list
      .slice()
      .sort(
        (a, b) =>
          Number(a.completada) - Number(b.completada) || // pendientes primero
          a.name.localeCompare(b.name) ||
          a.id - b.id
      );

  const loadTasks = async () => {
    if (!visitId) {
      setTasks([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getTasksCompletedByVisit(visitId);
      setTasks(sortTasks(res.data));
    } catch (e: any) {
      setError(e?.response?.data?.detail || "No se pudieron cargar las tareas.");
      console.error("loadTasks error:", e?.response?.data || e);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ ...emptyForm });
    setFormOpen(true);
  };

  const openEdit = (t: TaskCompleted) => {
    setForm({
      id: t.id,
      plan_task: t.plan_task ?? null,
      name: t.name,
      description: t.description ?? "",
      hours: typeof t.hours === "number" ? t.hours : "",
      completada: t.completada,
    });
    setFormOpen(true);
  };

  const cancelForm = () => {
    setFormOpen(false);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    if (!visitId) return;
    const name = (form.name || "").trim();
    if (!name) {
      alert("El nombre es obligatorio");
      return;
    }

    // 👇 payload para createTaskCompleted (incluye visit)
    const payloadFull: CreateTaskCompletedDTO = {
      visit: visitId,
      plan_task:
        form.plan_task === undefined ? null : (form.plan_task || null),
      name,
      description: form.description?.trim() || undefined,
      hours:
        form.hours === "" || form.hours === undefined
          ? undefined
          : Number(form.hours),
      completada: form.completada ?? true,
    };

    try {
      setSaving(true);
      if (form.id) {
        // EDITAR
        const res = await updateTaskCompleted(form.id, {
          plan_task: payloadFull.plan_task,
          name: payloadFull.name,
          description: payloadFull.description,
          hours: payloadFull.hours,
          completada: payloadFull.completada,
        });
        const updated = res.data;
        setTasks((prev) => sortTasks(prev.map((t) => (t.id === updated.id ? updated : t))));
      } else {
        // CREAR -> usa createTaskCompleted (no /by-visit/)
        const res = await createTaskCompleted(payloadFull);
        setTasks((prev) => sortTasks([...prev, res.data]));
      }
      cancelForm();
    } catch (err: any) {
      console.error("Task save error:", err?.response?.data || err);
      const data = err?.response?.data;
      const msg =
        data?.detail ||
        data?.message ||
        (typeof data === "object" ? JSON.stringify(data) : String(data)) ||
        "Operación no completada";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: TaskCompleted) => {
    if (!confirm(`¿Eliminar la tarea "${t.name}"?`)) return;
    try {
      await deleteTaskCompleted(t.id);
      setTasks((prev) => prev.filter((x) => x.id !== t.id));
      if (form.id === t.id) cancelForm();
    } catch (err: any) {
      console.error("Task delete error:", err?.response?.data || err);
      const data = err?.response?.data;
      const msg =
        data?.detail ||
        data?.message ||
        (typeof data === "object" ? JSON.stringify(data) : String(data)) ||
        "No se pudo eliminar la tarea.";
      alert(msg);
    }
  };

  const handleToggleCompleted = async (t: TaskCompleted) => {
    setActingId(t.id);
    try {
      const { data: updated } = await toggleCompleted(t);
      setTasks((prev) => sortTasks(prev.map((x) => (x.id === updated.id ? updated : x))));
      if (form.id === t.id) {
        setForm((f) => ({ ...f, completada: updated.completada }));
      }
    } catch (err: any) {
      console.error("Toggle completed error:", err?.response?.data || err);
      const data = err?.response?.data;
      const msg =
        data?.detail ||
        data?.message ||
        (typeof data === "object" ? JSON.stringify(data) : String(data)) ||
        "No se pudo cambiar el estado.";
      alert(msg);
    } finally {
      setActingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[800px] p-6 lg:p-10">
      <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
        {/* ---------- Header ---------- */}
        <div>
          <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {title}
          </h5>
          {!formOpen ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gestiona las tareas realizadas durante la visita.
            </p>
          ) : form.id ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Actualiza la información de la tarea seleccionada.
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Registra una nueva tarea realizada en esta visita.
            </p>
          )}
        </div>

        {/* ---------- Toolbar (solo lista) ---------- */}
        {!formOpen && (
          <div className="mt-5 flex items-center justify-end">
            <div className="flex items-center gap-3 ">
              <button
                onClick={openCreate}
                className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 shadow-theme-xs"
              >
                Añadir tarea +
              </button>
            </div>
          </div>
        )}

        {/* ---------- Body ---------- */}
        <div className="mt-6">
          {/* Lista */}
          {!formOpen && (
            <>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-11 rounded-lg bg-gray-100 dark:bg-white/10 animate-pulse"
                    />
                  ))}
                </div>
              ) : error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : tasks.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No hay tareas registradas para esta visita.
                </p>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-white/10">
                  {tasks.map((t) => (
                    <li key={t.id} className="py-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900 dark:text-white/90">
                              {t.name}
                            </div>
                            <span
                              className={
                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs " +
                                (t.completada
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700")
                              }
                            >
                              {t.completada ? "Completada" : "Pendiente"}
                            </span>
                          </div>

                          {t.plan_task ? (
                            <div className="mt-0.5 text-xs text-gray-500">
                              (plan_task #{t.plan_task}
                              {planTasksMap.get(t.plan_task)
                                ? ` · ${planTasksMap.get(t.plan_task)!.name}`
                                : ""}
                              )
                            </div>
                          ) : null}

                          {t.description && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {t.description}
                            </p>
                          )}

                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                            {typeof t.hours === "number" ? <span>Horas: {t.hours}</span> : null}
                            {t.created_at ? <span>Creada: {new Date(t.created_at).toLocaleString()}</span> : null}
                            {t.updated_at ? <span>Actualizada: {new Date(t.updated_at).toLocaleString()}</span> : null}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            onClick={() => void handleToggleCompleted(t)}
                            disabled={actingId === t.id}
                            className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                            title={t.completada ? "Marcar como pendiente" : "Marcar como completada"}
                          >
                            {t.completada ? "Desmarcar" : "Completar"}
                          </button>
                          <button
                            onClick={() => openEdit(t)}
                            className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => void handleDelete(t)}
                            className="rounded-lg border border-red-500 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* Formulario crear/editar */}
          {formOpen && (
            <div className="mt-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* plan_task */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Tarea del plan (opcional)
                </label>
                <select
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  value={form.plan_task ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      plan_task: e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                >
                  <option value="">— Sin ligar a plan_task —</option>
                  {planTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {form.plan_task && (
                  <p className="mt-1 text-xs text-gray-500">
                    {planTasksMap.get(form.plan_task)?.description || ""}
                  </p>
                )}
              </div>

              {/* Nombre */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Mantenimiento de cómputo"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Descripción
                </label>
                <textarea
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Detalle de la tarea realizada…"
                />
              </div>

              {/* Horas */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Horas
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.hours ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="0"
                />
              </div>

              {/* Completada */}
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!form.completada}
                    onChange={(e) => setForm((f) => ({ ...f, completada: e.target.checked }))}
                  />
                  Completada
                </label>
              </div>
            </div>
          )}
        </div>

        {/* ---------- Footer ---------- */}
        <div className="flex items-center gap-3 mt-6 sm:justify-end">
          {!formOpen ? (
            <>
              <button
                onClick={onClose}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Cerrar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={cancelForm}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleSubmit()}
                type="button"
                disabled={saving || !visitId}
                className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 sm:w-auto"
              >
                {saving ? "Guardando..." : form.id ? "Actualizar tarea" : "Guardar tarea"}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
