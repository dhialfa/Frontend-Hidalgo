// src/components/modal/EvidencesModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/modal";
import {
  getEvidencesByVisitAll, // ← sin paginación para el carrusel
  createEvidence,
  updateEvidence,
  deleteEvidence,
  type Evidence,
  toCarouselItems,
} from "../../api/visit/evidence.api";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  visitId: number | null;
};

type FormValues = {
  id?: number | null;
  description: string;
  files: File[]; // en edición es opcional; en creación al menos 1
};

function fmtDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString();
}

const emptyForm: FormValues = {
  id: null,
  description: "",
  files: [],
};

export default function EvidencesModal({ isOpen, onClose, visitId }: Props) {
  // listado
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Evidence[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // carrusel (NO paginado)
  const items = useMemo(() => toCarouselItems(list), [list]);
  const hasItems = items.length > 0;
  const [activeIdx, setActiveIdx] = useState(0);

  // formulario
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const isEdit = form.id != null;

  const title = useMemo(() => {
    if (!formOpen) return visitId ? `Evidencias de la visita #${visitId}` : "Evidencias";
    return isEdit ? "Editar evidencia" : "Añadir evidencias";
  }, [formOpen, isEdit, visitId]);

  // cargar sin paginación
  const load = async () => {
    if (!visitId || !isOpen) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await getEvidencesByVisitAll(visitId);
      setList(Array.isArray(data) ? data : []);
      setActiveIdx(0);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Error al cargar evidencias.");
      console.error("getEvidencesByVisitAll:", e?.response?.data || e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setFormOpen(false);
    setForm(emptyForm);
    setErr(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, visitId]);

  // acciones form/lista
  const openCreate = () => {
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (evd: Evidence) => {
    setForm({
      id: evd.id,
      description: evd.description ?? "",
      files: [],
    });
    setFormOpen(true);
  };

  const cancelForm = () => {
    setFormOpen(false);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitId) return;

    if (!isEdit && form.files.length === 0) {
      setErr("Debes seleccionar al menos una imagen para subir.");
      return;
    }

    setSaving(true);
    setErr(null);
    try {
      if (isEdit && form.id != null) {
        const file = form.files[0];
        await updateEvidence(form.id, {
          visit: visitId,
          description: form.description?.trim() || undefined,
          file: file ?? undefined,
        });
      } else {
        const desc = form.description?.trim() || undefined;
        const tasks = form.files.map((file) =>
          createEvidence({ visit: visitId, file, description: desc })
        );
        await Promise.allSettled(tasks);
      }
      await load();
      cancelForm();
    } catch (e: any) {
      console.error("evidence submit error:", e?.response?.status, e?.response?.data);
      setErr(e?.response?.data?.detail || "No se pudo guardar la evidencia.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta evidencia?")) return;
    setSaving(true);
    setErr(null);
    try {
      await deleteEvidence(id);
      await load();
      if (form.id === id) cancelForm();
    } catch (e: any) {
      console.error("evidence delete error:", e?.response?.status, e?.response?.data);
      setErr(e?.response?.data?.detail || "No se pudo eliminar.");
    } finally {
      setSaving(false);
    }
  };

  // carrusel helpers
  const goPrev = () => hasItems && setActiveIdx((i) => (i - 1 + items.length) % items.length);
  const goNext = () => hasItems && setActiveIdx((i) => (i + 1) % items.length);
  const setIdx = (i: number) => setActiveIdx(i);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[1000px] p-6 lg:p-10">
      <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
        {/* ---------- Header ---------- */}
        <div>
          <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {title}
          </h5>
          {!formOpen ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Visualiza y gestiona las evidencias (fotos) asociadas a esta visita.
            </p>
          ) : isEdit ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Actualiza la descripción o reemplaza el archivo si es necesario.
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sube una o varias imágenes como evidencia de la visita.
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
                Añadir evidencia +
              </button>
            </div>
          </div>
        )}

        {/* ---------- Body ---------- */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Columna izquierda: Galería / Carrusel */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Galería</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {hasItems ? `${activeIdx + 1} / ${items.length}` : "Sin imágenes"}
                </span>
              </div>

              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/5 dark:bg-white/5">
                {hasItems ? (
                  <>
                    <img
                      src={items[activeIdx].src}
                      alt={items[activeIdx].alt}
                      className="h-full w-full object-contain"
                    />
                    {/* Controles */}
                    <button
                      type="button"
                      onClick={goPrev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border bg-white/80 px-2 py-1 text-xs backdrop-blur hover:bg-white dark:border-white/10 dark:bg-black/30 dark:hover:bg-black/50"
                    >
                      ◀
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border bg-white/80 px-2 py-1 text-xs backdrop-blur hover:bg-white dark:border-white/10 dark:bg-black/30 dark:hover:bg-black/50"
                    >
                      ▶
                    </button>

                    {(items[activeIdx].caption || items[activeIdx].date) && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-white">
                        {items[activeIdx].caption && (
                          <div className="text-xs">{items[activeIdx].caption}</div>
                        )}
                        {items[activeIdx].date && (
                          <div className="text-[10px] opacity-80">{fmtDate(items[activeIdx].date)}</div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                    No hay imágenes.
                  </div>
                )}
              </div>

              {/* Miniaturas */}
              {hasItems && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {items.map((it, i) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => setIdx(i)}
                      className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded border ${
                        i === activeIdx
                          ? "border-brand-500 ring-2 ring-brand-500/30"
                          : "border-gray-200 dark:border-white/10"
                      }`}
                      title={it.caption || `#${it.id}`}
                    >
                      <img src={it.src} alt={it.alt} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha: Lista + Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Lista */}
            <div className="rounded-xl border border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 dark:border-white/10">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Evidencias subidas
                </span>
              </div>

              <div className="max-h-[38vh] overflow-auto">
                {loading ? (
                  <div className="space-y-2 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-11 rounded-lg bg-gray-100 dark:bg-white/10 animate-pulse" />
                    ))}
                  </div>
                ) : list.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    No hay evidencias.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-white/10">
                    {list.map((e) => (
                      <li key={e.id} className="px-4 py-3 hover:bg-gray-50/60 dark:hover:bg-white/5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="h-12 w-16 overflow-hidden rounded border border-gray-200 dark:border-white/10">
                              <img
                                src={e.file}
                                alt={e.description ?? `Evidence ${e.id}`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-white/90">
                                {e.description || "Sin descripción"}
                              </div>
                              <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                {fmtDate(e.subido_en)}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <button
                              onClick={() => openEdit(e)}
                              className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => void handleDelete(e.id)}
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
              </div>

              {err && (
                <div className="border-t border-red-100 px-4 py-2 text-sm text-red-600 dark:border-red-900/30 dark:text-red-400">
                  {err}
                </div>
              )}
            </div>

            {/* Formulario crear/editar */}
            <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-white/10">
              {/* Descripción */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Descripción {isEdit ? "" : "(se aplica a todas las imágenes)"}
                </label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Observación (opcional)"
                />
              </div>

              {/* Archivos */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {isEdit ? "Archivo (opcional para reemplazar)" : "Archivos *"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple={!isEdit}
                  capture="environment"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setForm((s) => ({ ...s, files }));
                  }}
                  className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-gray-50 dark:file:border-white/10 dark:file:bg-neutral-800 dark:hover:file:bg-neutral-700"
                />

                {/* Previsualización de nuevas imágenes */}
                {form.files.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Vista previa ({form.files.length})
                    </div>
                    <div className="mt-1 grid grid-cols-3 gap-2 md:grid-cols-4">
                      {form.files.map((f, i) => (
                        <div key={i} className="group relative h-28 w-full overflow-hidden rounded border border-gray-200 dark:border-white/10">
                          <img src={URL.createObjectURL(f)} alt={f.name} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 hidden items-end justify-end gap-1 p-1 group-hover:flex">
                            <button
                              type="button"
                              title="Quitar"
                              onClick={() =>
                                setForm((s) => ({ ...s, files: s.files.filter((_, idx) => idx !== i) }))
                              }
                              className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer del form */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={cancelForm}
                  disabled={saving}
                  className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || (!isEdit && form.files.length === 0)}
                  className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 sm:w-auto"
                >
                  {saving ? "Guardando..." : isEdit ? "Actualizar" : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ---------- Modal Footer ---------- */}
        <div className="flex items-center gap-3 mt-6 sm:justify-end">
          <button
            onClick={onClose}
            type="button"
            className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
