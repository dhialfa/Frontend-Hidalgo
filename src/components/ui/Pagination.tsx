// src/components/ui/Pagination.tsx
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
  const prev = () => {
    if (page > 1) onPageChange(page - 1);
  };

  const next = () => {
    if (page < totalPages) onPageChange(page + 1);
  };

  const goTo = (p: number) => {
    if (p < 1 || p > totalPages) return;
    onPageChange(p);
  };

  const renderPageNumbers = () => {
    if (totalPages <= 1) return null;

    const items: (number | "dots")[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      // Siempre mostramos primera y última
      items.push(1);

      const left = Math.max(2, page - 1);
      const right = Math.min(totalPages - 1, page + 1);

      if (left > 2) items.push("dots");

      for (let i = left; i <= right; i++) {
        items.push(i);
      }

      if (right < totalPages - 1) items.push("dots");

      items.push(totalPages);
    }

    return items.map((item, idx) => {
      if (item === "dots") {
        return (
          <span
            key={`dots-${idx}`}
            className="flex h-8 w-8 items-center justify-center text-xs text-gray-400 dark:text-gray-500"
          >
            …
          </span>
        );
      }

      const isActive = item === page;
      return (
        <button
          key={item}
          onClick={() => goTo(item)}
          className={[
            "flex h-8 min-w-[2rem] items-center justify-center rounded-full border px-2 text-xs font-medium transition-all",
            isActive
              ? "border-brand-500 bg-brand-500 text-white shadow-sm"
              : "border-transparent bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10",
          ].join(" ")}
        >
          {item}
        </button>
      );
    });
  };

  return (
    <div
      className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200/70 
                 bg-white/80 px-4 py-3 text-sm shadow-sm backdrop-blur 
                 dark:border-white/10 dark:bg-[#020617]/80 dark:text-gray-100"
    >
      {/* --- Izquierda: paginación principal --- */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          onClick={prev}
          disabled={page <= 1}
          className={[
            "flex h-9 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-all",
            page <= 1
              ? "cursor-not-allowed border-gray-200 text-gray-400 opacity-60 dark:border-white/10 dark:text-gray-500"
              : "border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10",
          ].join(" ")}
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          {renderPageNumbers()}
        </div>

        <button
          onClick={next}
          disabled={page >= totalPages || totalPages === 0}
          className={[
            "flex h-9 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-all",
            page >= totalPages || totalPages === 0
              ? "cursor-not-allowed border-gray-200 text-gray-400 opacity-60 dark:border-white/10 dark:text-gray-500"
              : "border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10",
          ].join(" ")}
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* --- Derecha: selector de tamaño --- */}
      <div className="flex items-center gap-2 text-xs sm:text-sm">
        <span className="text-gray-500 dark:text-gray-400">Filas por página</span>
        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 rounded-full border border-gray-200 bg-white/80 px-3 pr-7 text-xs text-gray-800 shadow-theme-xs
                       focus:border-brand-400 focus:outline-none focus:ring focus:ring-brand-500/15
                       dark:border-white/10 dark:bg-[#020617]/80 dark:text-gray-100"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <span className="hidden text-gray-500 sm:inline dark:text-gray-400">
          Página{" "}
          <b className="text-gray-900 dark:text-gray-100">{page}</b>
          {totalPages > 0 && (
            <>
              {" "}
              de <b className="text-gray-900 dark:text-gray-100">{totalPages}</b>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
