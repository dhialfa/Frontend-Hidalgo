export default function DemographicCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Demografía de clientes
      </h3>
      <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
        Módulo de mapa y países aún no configurado.
      </p>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-200">
            Clientes activos
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Ver detalle en módulo de clientes
          </span>
        </div>
      </div>
    </div>
  );
}
