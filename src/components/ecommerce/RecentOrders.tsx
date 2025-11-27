// src/components/ecommerce/RecentOrders.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import type { VisitsByDay, LastVisitItem } from "../../api/analytics";

type Props = {
  /** Datos agregados de visitas por día (respaldo) */
  visitsByDay?: VisitsByDay[];
  /** Últimas visitas individuales (principal) */
  lastVisits?: LastVisitItem[];
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    return dateStr;
  }
  return d.toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatStatusLabel(status: string): string {
  switch (status) {
    case "scheduled":
      return "Programada";
    case "in_progress":
      return "En progreso";
    case "completed":
    case "Completado":
      return "Completada";
    case "canceled":
    case "cancelled":
      return "Cancelada";
    default:
      return status;
  }
}

function statusClasses(status: string): string {
  switch (status) {
    case "scheduled":
      return "bg-amber-50 text-amber-700 border border-amber-100";
    case "in_progress":
      return "bg-blue-50 text-blue-700 border border-blue-100";
    case "completed":
    case "Completado":
      return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    case "canceled":
    case "cancelled":
      return "bg-red-50 text-red-700 border border-red-100";
    default:
      return "bg-gray-50 text-gray-700 border border-gray-100";
  }
}

export default function RecentOrders({
  visitsByDay = [],
  lastVisits = [],
}: Props) {
  const useLastVisits = lastVisits.length > 0;

  // Ordenamos las visitas individuales por fecha descendente (más recientes primero)
  const sortedLastVisits = [...lastVisits].sort((a, b) => {
    const da = new Date(a.start).getTime();
    const db = new Date(b.start).getTime();
    return db - da;
  });

  // Para el modo por día, últimas 5 fechas
  const dayRows = [...visitsByDay]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-5)
    .reverse();

  const noData = !useLastVisits && dayRows.length === 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-4 pt-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Últimas visitas
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {useLastVisits
              ? "Resumen de las visitas más recientes con su estado."
              : "Resumen de visitas completadas por día dentro del rango."}
          </p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-y border-gray-100 bg-gray-50/80 dark:border-gray-800 dark:bg-white/5">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Fecha
              </TableCell>

              {useLastVisits ? (
                <>
                  <TableCell
                    isHeader
                    className="py-3 text-start text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    Cliente
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 text-start text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    Plan
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 text-start text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    Estado
                  </TableCell>
                </>
              ) : (
                <TableCell
                  isHeader
                  className="py-3 text-start text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Visitas completadas
                </TableCell>
              )}
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {noData && (
              <TableRow>
                <TableCell className="py-4 text-sm text-gray-500 dark:text-gray-400">
                  No hay datos disponibles para el rango seleccionado.
                </TableCell>
                <TableCell className="py-4 text-sm text-gray-500 dark:text-gray-400">
                  {""}
                </TableCell>
              </TableRow>
            )}

            {/* Modo: visitas individuales */}
            {useLastVisits &&
              sortedLastVisits.slice(0, 5).map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">
                    {formatDate(v.start)}
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">
                    <div className="flex flex-col">
                      <span className="font-medium">{v.customer_name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ID #{v.id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-300">
                    {v.plan_name}
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses(
                        v.status,
                      )}`}
                    >
                      <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                      {formatStatusLabel(v.status)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}

            {/* Modo: agregado por día */}
            {!useLastVisits &&
              dayRows.map((row) => (
                <TableRow key={row.date}>
                  <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">
                    {formatDate(row.date)}
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                    {row.count}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
