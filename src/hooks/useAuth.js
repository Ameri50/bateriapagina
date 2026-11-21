import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, consumeRedirectResult, signInWithGoogle, signOutOfGoogle } from "../firebase";

const AUTH_MESSAGES = {
  "auth/unauthorized-domain":
    "Este dominio no está autorizado en Firebase. Agrégalo en Authentication → Settings → Authorized domains.",
  "auth/popup-blocked": "El navegador bloqueó la ventana de Google. Permite las ventanas emergentes e inténtalo de nuevo.",
  "auth/network-request-failed": "Sin conexión con Google. Revisa tu red e inténtalo de nuevo.",
  "auth/operation-not-supported-in-this-environment":
    "Este navegador no permite el inicio con ventana. Abre la página en Safari o Chrome.",
};

function describeAuthError(error) {
  return AUTH_MESSAGES[error?.code] ?? error?.message ?? "No se pudo iniciar sesión con Google.";
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setReady(true);
    });
    consumeRedirectResult().then((redirectError) => {
      if (redirectError) setError(describeAuthError(redirectError));
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async () => {
    setError("");
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (authError) {
      if (authError?.code !== "auth/popup-closed-by-user" && authError?.code !== "auth/cancelled-popup-request") {
        setError(describeAuthError(authError));
      }
    } finally {
      setBusy(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      await signOutOfGoogle();
    } catch (authError) {
      setError(authError?.message ?? "No se pudo cerrar la sesión.");
    } finally {
      setBusy(false);
    }
  }, []);

  const clearError = useCallback(() => setError(""), []);

  return { user, ready, busy, error, signIn, signOut, clearError };
}
