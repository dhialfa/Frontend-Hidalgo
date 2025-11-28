// src/pages/AuthPages/ResetPassword.tsx
import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import axios from "axios";
import { resetPassword } from "../../api/auth/auth.api"; // o "../../api/auth/auth.api" según tu estructura
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const hasRequiredParams = uid && token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!hasRequiredParams) {
      setErrorMsg("Enlace inválido o incompleto.");
      return;
    }

    if (!password || !password2) {
      setErrorMsg("Debes escribir la nueva contraseña en ambos campos.");
      return;
    }

    if (password !== password2) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener mínimo 8 caracteres.");
      return;
    }

    try {
      setLoading(true);

      // 👇 Esto está alineado con tu ResetPasswordDTO de src/api/auth.ts
      await resetPassword({
        uid,
        token,
        new_password: password,
        confirm_password: password2,
      });

      setSuccessMsg(
        "Contraseña actualizada correctamente. Ahora puedes iniciar sesión."
      );
      setPassword("");
      setPassword2("");

      setTimeout(() => {
        navigate("/signin");
      }, 2000);
    } catch (err: any) {
      console.error("Error en resetPassword:", err);

      if (axios.isAxiosError(err)) {
        const data = err.response?.data;

        // Caso 1: backend devuelve { "detail": "..." }
        if (data && typeof data === "object" && "detail" in data) {
          setErrorMsg((data as any).detail as string);
        }
        // Caso 2: backend devuelve errores por campo { new_password: ["..."], token: ["..."], ... }
        else if (data && typeof data === "object") {
          const allMessages = Object.values(data)
            .flat()
            .map((m) => String(m))
            .join(" ");
          setErrorMsg(
            allMessages ||
              "Ocurrió un error al restablecer la contraseña. Revisa los datos."
          );
        }
        // Caso 3: backend devuelve string plano
        else if (typeof data === "string") {
          setErrorMsg(data);
        } else {
          setErrorMsg(
            "Ocurrió un error al restablecer la contraseña. El enlace puede haber expirado."
          );
        }
      } else {
        setErrorMsg(
          "Ocurrió un error al restablecer la contraseña. Intenta de nuevo."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!hasRequiredParams) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
          <h1 className="mb-4 text-xl font-semibold text-gray-800">
            Enlace inválido
          </h1>
          <p className="text-gray-600">
            El enlace para restablecer la contraseña es inválido o está incompleto.
            Vuelve a solicitar el restablecimiento desde la pantalla de inicio de sesión.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
        <h1 className="mb-4 text-2xl font-bold text-gray-800">
          Restablecer contraseña
        </h1>
        <p className="mb-4 text-sm text-gray-600">
          Ingresa tu nueva contraseña y confírmala para actualizar tu acceso.
        </p>

        {errorMsg && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nueva contraseña
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              placeholder="Nueva contraseña"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Confirmar nueva contraseña
            </label>
            <Input
              type="password"
              value={password2}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword2(e.target.value)
              }
              placeholder="Confirmar nueva contraseña"
            />
          </div>

          <Button className="w-full" disabled={loading}>
            {loading ? "Guardando..." : "Restablecer contraseña"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
