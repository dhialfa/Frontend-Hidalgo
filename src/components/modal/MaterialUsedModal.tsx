// src/components/modal/MaterialsUsedModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/modal";
import Pagination from "../ui/Pagination";
import {
  getMaterialsUsedByVisitPaged,
  createMaterialUsed,
  patchMaterialUsed,
  deleteMaterialUsed,
  type MaterialUsed,
  type PageResp,
} from "../../api/visit/materials-used.api";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  visitId: number | null;
};

type FormValues = {
  id?: number | null;
  description: string;
  unit: string | number;
  unit_cost: string | number;
};

function toNum(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

const money = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 2,
});
const crc = (n: number) => money.format(n);

const emptyForm: FormValues = {
  id: null,
  description: "",
  unit: "",
  unit_cost: "",
};

export default function MaterialsUsedModal({ isOpen, onClose, visitId }: Props) {
  // -------- Paginación/listado --------
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MaterialUsed[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const [error, setError] = useState<string | null>(null);

  // -------- Formulario --------
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const isEdit = form.id != null;

  // -------- Textos --------
  const title = useMemo(
    () => (visitId ? `Materiales usados de la visita #${visitId}` : "Materiales usados"),
    [visitId]
  );
  const subtitle = useMemo(
    () => (isEdit ? "Actualiza los datos del material seleccionado." : "Registra materiales consumidos en esta visita."),
    [isEdit]
  );

  const resetForm = () => setForm(emptyForm);

  // -------- Cargar página --------
  const load = async () => {
    if (!visitId || !isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const data: PageResp<MaterialUsed> = await getMaterialsUsedByVisitPaged(visitId, {
        page,
        page_size: pageSize,
        ordering: "-id", // opcional: últimos primero
      });
      setRows(data.results ?? []);
      setCount(Number(data.count ?? 0));
    } catch (e: any) {
      console.error("materials load error:", e?.response?.data || e);
      setError(e?.response?.data?.detail || "Error al cargar materiales usados.");
    } finally {
      setLoading(false);
    }
  };

  // Reset y carga al abrir/cambiar visita
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    resetForm();
    setPage(1); // siempre iniciar en página 1 al abrir/cambiar visita
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, visitId]);

  // Cargar cuando cambie page/pageSize
  useEffect(() => {
    if (!isOpen) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, isOpen]);

  // -------- Totales --------
  const grandTotal = useMemo(
    () => rows.reduce((acc, m) => acc + toNum(m.unit) * toNum(m.unit_cost), 0),
    [rows]
  );

  const linePreview = useMemo(() => toNum(form.unit) * toNum(form.unit_cost), [form.unit, form.unit_cost]);

  // -------- CRUD --------
  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!visitId) return;

    const payload = {
      visit: visitId,
      description: (form.description || "").trim(),
      unit: form.unit === "" ? "0" : String(form.unit),
      unit_cost: form.unit_cost === "" ? "0" : String(form.unit_cost),
    };

    setSaving(true);
    setError(null);
    try {
      if (isEdit && form.id != null) {
        await patchMaterialUsed(form.id, payload as any);
      } else {
        await createMaterialUsed(payload as any);
        // tras crear, vuelve a la página 1 para ver el nuevo primero (por ordering -id)
        if (page !== 1) setPage(1);
      }
      await load();
      resetForm();
    } catch (e: any) {
      console.error("materials submit error:", e?.response?.data || e);
      setError(e?.response?.data?.detail || "No se pudo guardar el material.");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (m: MaterialUsed) => {
    setForm({
      id: m.id,
      description: m.description ?? "",
      unit: m.unit ?? "",
      unit_cost: m.unit_cost ?? "",
    });
  };

  const onDelete = async (id: number) => {
    if (!confirm("¿Eliminar este material?")) return;
    setSaving(true);
    setError(null);
    try {
      await deleteMaterialUsed(id);
      // Si eliminamos el último de la página y no es la primera, retrocede una página
      if (rows.length === 1 && page > 1) {
        setPage((p) => Math.max(1, p - 1));
      }
      await load();
      if (form.id === id) resetForm();
    } catch (e: any) {
      console.error("materials delete error:", e?.response?.data || e);
      setError(e?.response?.data?.detail || "No se pudo eliminar.");
    } finally {
      setSaving(false);
    }
  };

  const close = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[1000px] p-6 lg:p-10">
      <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
        {/* ---------- Header ---------- */}
        <div>
          <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {title}
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>

        {/* ---------- Body ---------- */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Lista (col 1-3) */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 dark:border-white/10">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Lista de materiales</span>
                <button
                  onClick={resetForm}
                  className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                >
                  Nuevo
                </button>
              </div>

              <div className="max-h-[48vh] overflow-auto">
                {loading ? (
                  <div className="space-y-2 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-11 rounded-lg bg-gray-100 dark:bg-white/10 animate-pulse" />
                    ))}
                  </div>
                ) : rows.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    No hay materiales registrados en esta visita.
                  </div>
                ) : (
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500 dark:bg-white/5 dark:text-gray-400">
                      <tr>
                        <th className="px-4 py-2">Descripción</th>
                        <th className="px-4 py-2">Cant.</th>
                        <th className="px-4 py-2">C. Unit.</th>
                        <th className="px-4 py-2">Total</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                      {rows.map((m) => {
                        const qty = toNum(m.unit);
                        const unitCost = toNum(m.unit_cost);
                        const total = qty * unitCost;
                        return (
                          <tr key={m.id} className="hover:bg-gray-50/60 dark:hover:bg-white/5">
                            <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-100">{m.description}</td>
                            <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{qty}</td>
                            <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{crc(unitCost)}</td>
                            <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{crc(total)}</td>
                            <td className="px-4 py-2">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => onEdit(m)}
                                  className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.06]"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => onDelete(m.id)}
                                  className="rounded-lg border border-red-500 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {/* Pie con suma total */}
                    <tfoot className="bg-gray-50/70 dark:bg-white/5">
                      <tr>
                        <td className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-200" colSpan={3}>
                          Total materiales
                        </td>
                        <td className="px-4 py-2 font-semibold text-gray-900 dark:text-gray-100">{crc(grandTotal)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>

              {/* Paginación */}
              <div className="px-4 py-3 border-t border-gray-100 dark:border-white/10">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  pageSize={pageSize}
                  onPageSizeChange={(n) => {
                    setPageSize(n);
                    setPage(1);
                  }}
                  pageSizeOptions={[5, 10, 20, 50]}
                />
                <div className="mt-1 text-xs text-gray-500">Total: {count}</div>
              </div>

              {error && (
                <div className="border-t border-red-100 px-4 py-2 text-sm text-red-600 dark:border-red-900/30 dark:text-red-400">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Form (col 4-5) */}
          <div className="lg:col-span-2">
            <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-white/10">
              {/* Descripción */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Descripción *
                </label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                  required
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Ej: cable UTP"
                />
              </div>

              {/* Cantidad y Costo unitario */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Cantidad (unit) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.unit}
                    onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))}
                    required
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Costo unitario *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.unit_cost}
                    onChange={(e) => setForm((s) => ({ ...s, unit_cost: e.target.value }))}
                    required
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Total línea preview */}
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">
                Total calculado de esta línea: {crc(linePreview)}
              </div>

              {/* Footer del form */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
                >
                  Limpiar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 sm:w-auto"
                >
                  {isEdit ? "Actualizar" : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ---------- Modal Footer ---------- */}
        <div className="flex items-center gap-3 mt-6 sm:justify-end">
          <button
            onClick={close}
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
