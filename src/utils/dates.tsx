// src/utils/dates.ts
export function formatDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return "-";

  const d = new Date(iso);

  // Usa la zona horaria del navegador del usuario
  return d.toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function formatDateLocal(iso: string | null | undefined): string {
  if (!iso) return "-";

  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatTimeLocal(iso: string | null | undefined): string {
  if (!iso) return "-";

  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
