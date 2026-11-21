import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Proyecto de tesis: el mismo que usan la app iOS y el panel web.
export const firebaseConfig = {
  apiKey: "AIzaSyCn9yWVnz2l-_A41ombelQmXDyA9MC0Lvk",
  authDomain: "miapp-4a216.firebaseapp.com",
  projectId: "miapp-4a216",
  storageBucket: "miapp-4a216.firebasestorage.app",
  messagingSenderId: "553513944411",
  appId: "1:553513944411:web:c4b3592357220c9f63c67e",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence).catch(() => {});

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle() {
  const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (!mobile) return signInWithPopup(auth, provider);

  // En iOS/Safari el redirect puede perderse por el particionado de
  // almacenamiento; el popup sí conserva la sesión. Si el navegador lo
  // bloquea, se cae al redirect clásico.
  try {
    return await signInWithPopup(auth, provider);
  } catch (error) {
    const code = error?.code ?? "";
    const fallback = code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment";
    if (!fallback) throw error;
    return signInWithRedirect(auth, provider);
  }
}

export function signOutOfGoogle() {
  return signOut(auth);
}

export async function consumeRedirectResult() {
  try {
    await getRedirectResult(auth);
    return null;
  } catch (error) {
    return error;
  }
}
