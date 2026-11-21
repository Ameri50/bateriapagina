import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, consumeRedirectResult, signInWithGoogle, signOutOfGoogle } from "../firebase";

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
      if (redirectError) setError(redirectError.message);
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
        setError(authError?.message ?? "No se pudo iniciar sesión con Google.");
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
