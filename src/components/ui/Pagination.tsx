// src/components/ui/Pagination.tsx
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  pageSize: number;
  onPageSizeChange: (n: number) => void;
  pageSizeOptions?: number[];
};

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: Props) {
  const prev = () => onPageChange(Math.max(1, page - 1));
  const next = () => onPageChange(Math.min(totalPages, page + 1));

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-3 text-sm">
      {/* --- Izquierda: info y controles --- */}
      <div className="flex items-center gap-3">
        <button
          onClick={prev}
          disabled={page <= 1}
          className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 transition-colors ${
            page <= 1
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-gray-50 dark:hover:bg-white/[0.06]"
          } dark:border-gray-700`}
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <span className="text-gray-600 dark:text-gray-400">
          Página{" "}
          <b className="text-gray-800 dark:text-white/90">{page}</b> de{" "}
          <b className="text-gray-800 dark:text-white/90">{totalPages}</b>
        </span>

        <button
          onClick={next}
          disabled={page >= totalPages}
          className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 transition-colors ${
            page >= totalPages
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-gray-50 dark:hover:bg-white/[0.06]"
          } dark:border-gray-700`}
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* --- Derecha: selector de tamaño --- */}
      <div className="flex items-center gap-2">
        <span className="text-gray-600 dark:text-gray-400">Filas por página:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-9 rounded-lg border border-gray-300 bg-transparent px-2 text-sm text-gray-700 shadow-theme-xs
                     focus:border-brand-300 focus:ring focus:ring-brand-500/10
                     dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
