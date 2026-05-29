"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Edit3, LogIn, LogOut, Save } from "lucide-react";
import { SensorGrid } from "@/components/sensor-grid";
import { StatusPill } from "@/components/status-pill";
import { GoogleSignIn } from "@/components/google-signin";
import { auth, isFirebaseConfigured } from "@/lib/firebase/client";
import { listOwnerShops } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/use-auth";
import type { Shop } from "@/lib/types";

export default function OwnerPage() {
  const { session, setActiveEmail, logout } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [email, setEmail] = useState("owner@airloo.in");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    document.title = "Owner Console | AirLoo";
  }, []);

  useEffect(() => {
    if (session.status === "active") {
      listOwnerShops(session.email).then(setShops);
    }
  }, [session]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (isFirebaseConfigured && auth) {
      await signInWithEmailAndPassword(auth, email, password);
    }
    setActiveEmail(email);
  }

  if (session.status === "loading") {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <p className="toast">Restoring session...</p>
        </section>
      </main>
    );
  }

  if (session.status === "expired") {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <h1>Session expired</h1>
          <p>Your 30-minute session ended. Please log in again.</p>
          <button className="primary-button" type="button" onClick={() => setPassword("")}>
            <LogIn size={18} />
            Login again
          </button>
        </section>
      </main>
    );
  }

  if (session.status !== "active") {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <span className="eyebrow">Shop owner</span>
          <h1>Login to manage your shop and sensors.</h1>
          <p>No public signup is enabled. New shop owners should submit the join form.</p>
          <form onSubmit={handleLogin} className="stack-form">
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
            </label>
            <label>
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                required={isFirebaseConfigured}
              />
            </label>
            <button className="primary-button" type="submit">
              <LogIn size={18} />
              Login
            </button>
          </form>
          {isFirebaseConfigured && auth ? (
            <div className="auth-divider">
              <span>or</span>
              <GoogleSignIn auth={auth} onSuccess={setActiveEmail} />
            </div>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <section className="page-header">
        <div>
          <span className="eyebrow">Owner console</span>
          <h1>Your AirLoo locations</h1>
          <p>Manage shop details, review sensor state, and track sanitation alerts.</p>
        </div>
        <button className="ghost-button" type="button" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </section>

      <div className="owner-list">
        {shops.length === 0 ? (
          <p className="toast">No shops found for this account.</p>
        ) : (
          shops.map((shop) => (
            <article className="management-card" key={shop.id}>
              <div className="card-row">
                <div>
                  <h2>{shop.name}</h2>
                  <p>{shop.address}</p>
                </div>
                <StatusPill status={shop.status} />
              </div>
              <SensorGrid reading={shop.sensors[0]} />
              <form
                className="inline-edit"
                onSubmit={(event) => {
                  event.preventDefault();
                  setMessage("Saved locally. Connect Firebase env values to persist shop CRUD.");
                }}
              >
                <label>
                  Shop name
                  <input defaultValue={shop.name} />
                </label>
                <label>
                  Address
                  <input defaultValue={shop.address} />
                </label>
                <button className="primary-button" type="submit">
                  <Save size={17} />
                  Save details
                </button>
                <button className="ghost-button" type="button">
                  <Edit3 size={17} />
                  Sensors
                </button>
              </form>
            </article>
          ))
        )}
      </div>
      {message ? <p className="toast">{message}</p> : null}
    </main>
  );
}
