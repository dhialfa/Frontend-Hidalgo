import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import axios from "axios";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { login, storeAuth } from "../../api/auth/auth.api";
import { useAuth } from "../../auth/AuthContext";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

      // =========================================================
      // Guardar usuario en AuthContext para que role funcione
      // =========================================================
      setUser(resp.user);

      // =========================================================
      // Guardar usuario en localStorage bajo LA MISMA KEY
      // que usa el AuthContext ("auth:user")
      // =========================================================
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
                <Link
                  to="/reset-password"
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  ¿Olvidó su contraseña?
                </Link>
              </div>

              <div>
                <Button className="w-full" size="sm" disabled={loading}>
                  {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              {""}
              <Link
                to="/signup"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Solicitar cuenta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
