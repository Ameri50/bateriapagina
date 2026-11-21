import { useCallback, useState } from "react";

const LOCATION_KEY = "batterylink.web.location.v1";

function readStored() {
  try {
    const stored = JSON.parse(localStorage.getItem(LOCATION_KEY) ?? "null");
    if (stored && Number.isFinite(Number(stored.lat)) && Number.isFinite(Number(stored.lng))) {
      return {
        lat: Number(stored.lat),
        lng: Number(stored.lng),
        accuracy: Number.isFinite(Number(stored.accuracy)) ? Number(stored.accuracy) : null,
        updatedAt: Number.isFinite(Number(stored.updatedAt)) ? Number(stored.updatedAt) : null,
      };
    }
  } catch {
    /* almacenamiento bloqueado o datos inválidos */
  }
  return null;
}

function describeError(error) {
  if (error?.code === 1) return "Diste permiso de ubicación a la página, pero el navegador la bloqueó.";
  if (error?.code === 2) return "El sistema no pudo determinar la ubicación. Inténtalo de nuevo.";
  if (error?.code === 3) return "La búsqueda de ubicación tardó demasiado. Inténtalo de nuevo.";
  return error?.message ?? "No se pudo obtener la ubicación.";
}

export function useDeviceLocation() {
  const [location, setLocation] = useState(readStored);
  const [status, setStatus] = useState(location ? "ready" : "idle");
  const [error, setError] = useState("");

  const request = useCallback(() => {
    setError("");
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Este navegador no ofrece ubicación.");
      setStatus("error");
      return;
    }
    if (!window.isSecureContext) {
      setError("La ubicación solo funciona en HTTPS o en localhost.");
      setStatus("error");
      return;
    }

    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          lat: Number(position.coords.latitude.toFixed(5)),
          lng: Number(position.coords.longitude.toFixed(5)),
          accuracy: Number.isFinite(position.coords.accuracy) ? Math.round(position.coords.accuracy) : null,
          updatedAt: Date.now(),
        };
        setLocation(next);
        setStatus("ready");
        try {
          localStorage.setItem(LOCATION_KEY, JSON.stringify(next));
        } catch {
          /* almacenamiento bloqueado */
        }
      },
      (geoError) => {
        setStatus("error");
        setError(describeError(geoError));
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 5 * 60_000 },
    );
  }, []);

  const clear = useCallback(() => {
    setLocation(null);
    setStatus("idle");
    setError("");
    try {
      localStorage.removeItem(LOCATION_KEY);
    } catch {
      /* almacenamiento bloqueado */
    }
  }, []);

  return { location, status, error, request, clear };
}
