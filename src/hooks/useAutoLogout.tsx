// src/hooks/useAutoLogout.ts
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { clearAuth, getLastActivity, INACTIVITY_LIMIT_MS, touchActivity } from "../api/auth/auth.api";

export function useAutoLogout() {
  const navigate = useNavigate();

  useEffect(() => {
    const updateActivity = () => {
      touchActivity();
    };

    const events: (keyof WindowEventMap)[] = [
      "click",
      "keydown",
      "mousemove",
      "scroll",
    ];

    // Registrar listeners de actividad
    events.forEach((evt) => window.addEventListener(evt, updateActivity));

    // Si nunca se ha registrado actividad, lo hacemos ahora
    if (!getLastActivity()) {
      touchActivity();
    }

    // Intervalo que revisa cada minuto
    const interval = window.setInterval(() => {
      const last = getLastActivity();
      if (!last) return;

      const diff = Date.now() - last;
      if (diff > INACTIVITY_LIMIT_MS) {
        // Más de 30 min sin actividad → logout
        clearAuth();

        // Limpia listeners e intervalo antes de navegar
        events.forEach((evt) =>
          window.removeEventListener(evt, updateActivity)
        );
        window.clearInterval(interval);

        navigate("/signin", { replace: true });
      }
    }, 60 * 1000); // cada 1 min

    // Cleanup al desmontar
    return () => {
      events.forEach((evt) =>
        window.removeEventListener(evt, updateActivity)
      );
      window.clearInterval(interval);
    };
  }, [navigate]);
}
