// src/components/form/SignInForm.tsx
import React, { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router"; 
import axios from "axios";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
// Ajusta la ruta según tu estructura real:
import { login, storeAuth, forgotPassword } from "../../api/auth/auth.api"; 
import { useAuth } from "../../auth/AuthContext";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Estados para "Olvidó su contraseña"
  const [showForgot, setShowForgot] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Ingrese correo y contraseña.");
      return;
    }

    try {
      setLoading(true);

      const resp = await login({
        email,
        password,
      });

      // Guardar usuario en AuthContext
      setUser(resp.user);

      // Guardar usuario en localStorage
      localStorage.setItem("auth:user", JSON.stringify(resp.user));

      // Guarda tokens usando tu helper
      storeAuth(resp);
      navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail =
          (err.response?.data as any)?.detail ??
          "Correo o contraseña incorrectos.";
        setError(detail);
      } else {
        setError("Error inesperado al iniciar sesión.");
      }
    } finally {
      setLoading(false);
    }
  };

  /** 🔹 Ahora ya NO es un submit de formulario separado, solo una función */
  const handleForgotSubmit = async () => {
    setForgotError(null);
    setForgotMessage(null);

    if (!email) {
      setForgotError("Ingrese el correo con el que está registrado.");
      return;
    }

    try {
      setForgotLoading(true);
      const res = await forgotPassword({ email });
      setForgotMessage(
        res.detail ??
          "Si el correo existe en el sistema, se ha enviado un enlace para restablecer la contraseña."
      );
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as any;
        if (data?.detail) {
          setForgotError(data.detail as string);
        } else {
          setForgotError("No se pudo procesar la solicitud. Intente de nuevo.");
        }
      } else {
        setForgotError("Error inesperado. Intente de nuevo más tarde.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Inicio de sesión
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ingrese sus credenciales para iniciar sesión
            </p>
          </div>

          {/* 👇 SOLO un formulario: el del login */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>
                  Correo <span className="text-error-500">*</span>{" "}
                </Label>
                <Input
                  placeholder="info@computadoreshidalgo.com"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                />
              </div>

              <div>
                <Label>
                  Contraseña <span className="text-error-500">*</span>{" "}
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingrese su contraseña"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot((prev) => !prev);
                    setForgotError(null);
                    setForgotMessage(null);
                  }}
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400 underline-offset-2 hover:underline"
                >
                  ¿Olvidó su contraseña?
                </button>
              </div>

              {/* 🔹 Bloque desplegable "Olvidó su contraseña" (sin form interno) */}
              {showForgot && (
                <div className="p-3 mt-2 text-sm border rounded-lg border-brand-100 bg-brand-50/50 dark:bg-slate-800/60 dark:border-slate-600">
                  <p className="mb-2 text-gray-700 dark:text-gray-300">
                    Ingrese su correo y le enviaremos un enlace para restablecer su contraseña.
                  </p>

                  {forgotError && (
                    <p className="mb-2 text-xs text-red-500">{forgotError}</p>
                  )}

                  {forgotMessage && (
                    <p className="mb-2 text-xs text-emerald-600">
                      {forgotMessage}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Correo registrado"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEmail(e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      size="md"
                      disabled={forgotLoading}
                      onClick={handleForgotSubmit}
                    >
                      {forgotLoading ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <Button className="w-full" size="sm" disabled={loading}>
                  {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
