// src/api/auth.ts
import axios, { AxiosInstance, AxiosError } from "axios";
import type { User } from "../user/users.api";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/* ======================================
 * Tipos
 * ====================================== */

export interface AuthResponse {
  refresh: string;
  access: string;
  user: User;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RefreshDTO {
  refresh: string;
}

export interface RefreshResponse {
  access: string;
}

/* ======================================
 * Axios instance (solo para auth)
 * ====================================== */

const AuthApi: AxiosInstance = axios.create({
  baseURL: API,
});

/* ======================================
 * Endpoints de autenticación
 * ====================================== */

export const login = async (data: LoginDTO) => {
  // POST http://.../api/auth/token/
  const res = await AuthApi.post<AuthResponse>("api/auth/token/", data);
  return res.data;
};

export const refreshToken = async (data: RefreshDTO) => {
  // POST http://.../api/auth/token/refresh/
  const res = await AuthApi.post<RefreshResponse>(
    "api/auth/token/refresh/",
    data
  );
  return res.data;
};

/* ======================================
 * Manejo de tokens y usuario en localStorage
 * ====================================== */

export const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutos

/** Actualiza el timestamp de última actividad del usuario */
export const touchActivity = () => {
  localStorage.setItem("lastActivity", Date.now().toString());
};

/** Obtiene el timestamp (ms) de la última actividad */
export const getLastActivity = (): number | null => {
  const value = localStorage.getItem("lastActivity");
  if (!value) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

/** Indica si la sesión está vencida por inactividad */
export const hasSessionExpiredByInactivity = (): boolean => {
  const last = getLastActivity();
  if (!last) return false; // si no hay registro, no forzamos expiración aquí
  const diff = Date.now() - last;
  return diff > INACTIVITY_LIMIT_MS;
};

/** Guarda tokens + usuario y registra primera actividad */
export const storeAuth = (auth: AuthResponse) => {
  localStorage.setItem("access", auth.access);
  localStorage.setItem("refresh", auth.refresh);
  localStorage.setItem("user", JSON.stringify(auth.user));
  touchActivity(); // ✅ primer registro de actividad al iniciar sesión
};

/** Limpia toda la info de autenticación */
export const clearAuth = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
  localStorage.removeItem("lastActivity");
};

export const getAccessToken = (): string | null =>
  localStorage.getItem("access");

export const getRefreshToken = (): string | null =>
  localStorage.getItem("refresh");

export const getCurrentUser = (): User | null => {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

/**
 * Devuelve true solo si:
 *  - hay access token
 *  - y NO ha vencido el tiempo de inactividad
 */
export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  if (!token) return false;

  if (hasSessionExpiredByInactivity()) {
    clearAuth();
    return false;
  }

  return true;
};

/* ======================================
 * Interceptores para refrescar token
 * ====================================== */

/**
 * Setup genérico para cualquier AxiosInstance de tu app (customers, users, visits, etc.)
 * - Añade el access token en Authorization.
 * - Si el backend devuelve 401 (token_not_valid / expirado), intenta refrescar usando el refresh.
 * - Reintenta automáticamente la request ORIGINAL una sola vez.
 * - Si la sesión vence por inactividad, limpia todo y redirige a /signin.
 */
export const setupAuthInterceptors = (api: AxiosInstance) => {
  // Request: mete el access token en el header
  api.interceptors.request.use(
    (config) => {
      // 🔒 Check de inactividad ANTES de mandar la request
      if (hasSessionExpiredByInactivity()) {
        clearAuth();
        window.location.href = "/signin";
        return Promise.reject(
          new Error("Sesión expirada por inactividad")
        );
      }

      const token = getAccessToken();
      if (token) {
        const cfg: any = config;
        cfg.headers = cfg.headers || {};
        cfg.headers.Authorization = `Bearer ${token}`;
      }

      // si la request se manda, contamos como actividad del usuario
      touchActivity();

      return config;
    },
    (err) => Promise.reject(err)
  );

  // Response: maneja 401 y refresca el token si es posible
  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<any>) => {
      const originalConfig: any = error.config;

      // Si no hay respuesta (error de red, CORS, etc.), no hacemos nada especial
      if (!error.response) {
        return Promise.reject(error);
      }

      // Solo intentamos refrescar una vez por request
      if (error.response.status === 401 && !originalConfig._retry) {
        originalConfig._retry = true;

        const refresh = getRefreshToken();
        if (!refresh) {
          // No hay refresh: cerramos sesión y redirigimos a login
          clearAuth();
          window.location.href = "/signin";
          return Promise.reject(error);
        }

        try {
          // Pedimos nuevo access token
          const data = await refreshToken({ refresh });

          // Guardamos el nuevo access
          localStorage.setItem("access", data.access);

          // Actualizamos header y reintentamos la request original
          originalConfig.headers = originalConfig.headers || {};
          originalConfig.headers.Authorization = `Bearer ${data.access}`;

          return api(originalConfig);
        } catch (refreshErr) {
          // El refresh falló (también expiró o es inválido) -> logout forzado
          clearAuth();
          window.location.href = "/signin";
          return Promise.reject(refreshErr);
        }
      }

      // Si no es 401, o ya reintentamos, devolvemos el error normal
      return Promise.reject(error);
    }
  );
};
