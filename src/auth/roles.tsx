// src/auth/roles.ts
import type { User } from "../api/user/users.api";

export type Role = "admin" | "technician";

/**
 * Un usuario es "admin" si is_staff === true.
 * Caso contrario, será "technician".
 */
export function getRole(user: User | null | undefined): Role | null {
  if (!user) return null;
  return user.is_staff ? "admin" : "technician";
}

/**
 * Helper rápido para saber si es admin.
 */
export function isAdminUser(user: User | null | undefined): boolean {
  return getRole(user) === "admin";
}
