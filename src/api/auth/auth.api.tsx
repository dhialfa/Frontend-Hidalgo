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

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  uid: string;
  token: string;
  new_password: string;
  confirm_password: string;
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
  const res = await AuthApi.post<AuthResponse>("api/auth/token/", data);
  return res.data;
};

export const refreshToken = async (data: RefreshDTO) => {
  const res = await AuthApi.post<RefreshResponse>(
    "api/auth/token/refresh/",
    data
  );
  return res.data;
};

export const forgotPassword = async (data: ForgotPasswordDTO) => {
  const res = await AuthApi.post<{ detail: string }>(
    "api/auth/forgot-password/",
    data
  );
  return res.data;
};

export const resetPassword = async (data: ResetPasswordDTO) => {
  const res = await AuthApi.post<{ detail: string }>(
    "api/auth/reset-password/",
    data
  );
  return res.data;
};

/* Manejo de tokens y usuario en localStorage */

export const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutos

export const touchActivity = () => {
  localStorage.setItem("lastActivity", Date.now().toString());
};

export const getLastActivity = (): number | null => {
  const value = localStorage.getItem("lastActivity");
  if (!value) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

export const hasSessionExpiredByInactivity = (): boolean => {
  const last = getLastActivity();
  if (!last) return false;
  const diff = Date.now() - last;
  return diff > INACTIVITY_LIMIT_MS;
};

export const storeAuth = (auth: AuthResponse) => {
  localStorage.setItem("access", auth.access);
  localStorage.setItem("refresh", auth.refresh);
  localStorage.setItem("user", JSON.stringify(auth.user));
  touchActivity();
};

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

export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  if (!token) {
    // por limpieza, si no hay token, nos aseguramos de vaciar todo
    clearAuth();
    return false;
  }

  if (hasSessionExpiredByInactivity()) {
    clearAuth();
    return false;
  }

  return true;
};

/* ======================================
 * Interceptores para refrescar token
 * ====================================== */

export const setupAuthInterceptors = (api: AxiosInstance) => {
  // Request: mete el access token en el header
  api.interceptors.request.use(
    (config) => {
      // 1) Check de inactividad
      if (hasSessionExpiredByInactivity()) {
        clearAuth();
        window.location.href = "/signin";
        return Promise.reject(
          new Error("Sesión expirada por inactividad")
        );
      }

      // 2) Si NO hay token -> cerrar sesión y redirigir
      const token = getAccessToken();
      if (!token) {
        clearAuth();
        window.location.href = "/signin";
        return Promise.reject(
          new Error("No hay token de autenticación")
        );
      }

      const cfg: any = config;
      cfg.headers = cfg.headers || {};
      cfg.headers.Authorization = `Bearer ${token}`;

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

      // Si no hay respuesta (error de red, CORS, etc.)
      if (!error.response) {
        return Promise.reject(error);
      }

      const status = error.response.status;

      // Solo manejamos 401 de forma especial
      if (status === 401) {
        // Si ya reintentamos una vez, o la request es al endpoint de refresh,
        // entonces cerramos sesión sí o sí.
        if (originalConfig._retry || originalConfig.url?.includes("api/auth/token/refresh/")) {
          clearAuth();
          window.location.href = "/signin";
          return Promise.reject(error);
        }

        // Marcamos que ya intentamos una vez
        originalConfig._retry = true;

        const refresh = getRefreshToken();
        if (!refresh) {
          // No hay refresh: logout inmediato
          clearAuth();
          window.location.href = "/signin";
          return Promise.reject(error);
        }

        try {
          // Intentamos refrescar token
          const data = await refreshToken({ refresh });

          // Guardamos el nuevo access
          localStorage.setItem("access", data.access);

          // Actualizamos header y reintentamos la request original
          originalConfig.headers = originalConfig.headers || {};
          originalConfig.headers.Authorization = `Bearer ${data.access}`;

          return api(originalConfig);
        } catch (refreshErr) {
          // El refresh falló -> logout forzado
          clearAuth();
          window.location.href = "/signin";
          return Promise.reject(refreshErr);
        }
      }

      // Si no es 401 devolvemos el error normal
      return Promise.reject(error);
    }
  );
};
