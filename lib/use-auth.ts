/* eslint-disable react-hooks/purity, react-hooks/set-state-in-effect */
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, isFirebaseConfigured } from "@/lib/firebase/client";

const SESSION_DURATION_MS = 30 * 60 * 1000;
const WARNING_BEFORE_MS = 60 * 1000;

type SessionState =
  | { status: "loading" }
  | { status: "expired"; email: string }
  | { status: "active"; email: string; expiresAt: number }
  | { status: "guest" };

function getStoredSession(): { email: string; loginTime: number } | null {
  try {
    const raw = sessionStorage.getItem("airloo_session");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function storeSession(email: string) {
  sessionStorage.setItem("airloo_session", JSON.stringify({ email, loginTime: Date.now() }));
}

function clearSession() {
  sessionStorage.removeItem("airloo_session");
}

export function useAuth() {
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      const stored = getStoredSession();
      if (stored) {
        const elapsed = Date.now() - stored.loginTime;
        if (elapsed < SESSION_DURATION_MS) {
          setSession({ status: "active", email: stored.email, expiresAt: stored.loginTime + SESSION_DURATION_MS });
        } else {
          clearSession();
          setSession({ status: "expired", email: stored.email });
        }
      } else {
        setSession({ status: "guest" });
      }
      return;
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user?.email) {
        const stored = getStoredSession();
        if (stored && stored.email === user.email) {
          const elapsed = Date.now() - stored.loginTime;
          if (elapsed < SESSION_DURATION_MS) {
            setSession({ status: "active", email: user.email, expiresAt: stored.loginTime + SESSION_DURATION_MS });
            return;
          }
        }
        storeSession(user.email);
        setSession({ status: "active", email: user.email, expiresAt: Date.now() + SESSION_DURATION_MS });
      } else {
        clearSession();
        setSession(getStoredSession() ? { status: "expired", email: getStoredSession()!.email } : { status: "guest" });
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (session.status !== "active") return;

    const remaining = session.expiresAt - Date.now();
    if (remaining <= 0) {
      clearSession();
      setSession({ status: "expired", email: session.email });
      return;
    }

    const timer = setTimeout(() => {
      if (auth) signOut(auth);
      clearSession();
      setSession({ status: "expired", email: session.email });
    }, remaining);

    return () => clearTimeout(timer);
  }, [session]);

  function setActiveEmail(email: string) {
    storeSession(email);
    setSession({ status: "active", email, expiresAt: Date.now() + SESSION_DURATION_MS });
  }

  async function login(email: string, password: string) {
    if (isFirebaseConfigured && auth) {
      await signInWithEmailAndPassword(auth, email, password);
    }
    setActiveEmail(email);
  }

  async function logout() {
    if (auth) await signOut(auth);
    clearSession();
    setFirebaseUser(null);
    setSession({ status: "guest" });
  }

  const remainingMs =
    session.status === "active" ? Math.max(0, session.expiresAt - Date.now()) : 0;
  const showWarning = session.status === "active" && remainingMs > 0 && remainingMs < WARNING_BEFORE_MS;

  return { session, firebaseUser, login, logout, setActiveEmail, remainingMs, showWarning };
}
