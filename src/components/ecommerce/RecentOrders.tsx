import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import type { VisitsByDay } from "../../api/analytics";

type Props = {
  visitsByDay?: VisitsByDay[];
};

export default function RecentOrders({ visitsByDay = [] }: Props) {
  const rows = [...visitsByDay]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-5) // últimas 5 fechas
    .reverse();

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Últimas visitas
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Resumen de visitas completadas por día dentro del rango.
          </p>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Fecha
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Visitas completadas
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="py-4 text-sm text-gray-500 dark:text-gray-400"
                >
                  No hay datos disponibles para el rango seleccionado.
                </TableCell>
              </TableRow>
            )}

            {rows.map((row) => (
              <TableRow key={row.date}>
                <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                  {row.date}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
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
