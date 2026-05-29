"use client";

import { FormEvent, useMemo, useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { LogIn, LogOut, Plus, ShieldCheck } from "lucide-react";
import { StatusPill } from "@/components/status-pill";
import { auth, isFirebaseConfigured } from "@/lib/firebase/client";
import { shops } from "@/lib/mock-data";

const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export default function AdminPage() {
  const [email, setEmail] = useState(adminEmails[0] ?? "admin@airloo.in");
  const [password, setPassword] = useState("");
  const [activeEmail, setActiveEmail] = useState("");
  const isAllowed = useMemo(
    () => !adminEmails.length || adminEmails.includes(activeEmail.toLowerCase()),
    [activeEmail],
  );

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isFirebaseConfigured && auth) {
      await signInWithEmailAndPassword(auth, email, password);
    }
    setActiveEmail(email);
  }

  async function handleLogout() {
    if (auth) await signOut(auth);
    setActiveEmail("");
  }

  if (!activeEmail) {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <span className="eyebrow">Admin</span>
          <h1>Login to manage the AirLoo network.</h1>
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
        </section>
      </main>
    );
  }

  if (!isAllowed) {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <ShieldCheck size={32} />
          <h1>Admin access denied.</h1>
          <p>Add this email to NEXT_PUBLIC_ADMIN_EMAILS if it should manage AirLoo.</p>
          <button className="ghost-button" type="button" onClick={handleLogout}>
            Logout
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <section className="page-header">
        <div>
          <span className="eyebrow">Admin console</span>
          <h1>Manage shops, owners, devices, and alerts.</h1>
          <p>System-wide visibility for all public locations and sensor streams.</p>
        </div>
        <div className="button-row">
          <button className="primary-button" type="button">
            <Plus size={18} />
            Add shop
          </button>
          <button className="ghost-button" type="button" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </section>

      <section className="admin-stats">
        <div>
          <span>Total shops</span>
          <strong>{shops.length}</strong>
        </div>
        <div>
          <span>Devices</span>
          <strong>{shops.reduce((total, shop) => total + shop.sensors.length, 0)}</strong>
        </div>
        <div>
          <span>Needs cleaning</span>
          <strong>{shops.filter((shop) => shop.status === "needs-cleaning").length}</strong>
        </div>
        <div>
          <span>Offline</span>
          <strong>{shops.filter((shop) => shop.status === "offline").length}</strong>
        </div>
      </section>

      <section className="table-card">
        <div className="table-row table-head">
          <span>Shop</span>
          <span>Owner</span>
          <span>Status</span>
          <span>Device</span>
          <span>Today</span>
        </div>
        {shops.map((shop) => (
          <div className="table-row" key={shop.id}>
            <span>{shop.name}</span>
            <span>{shop.ownerEmail}</span>
            <span>
              <StatusPill status={shop.status} />
            </span>
            <span>{shop.sensors[0].deviceId}</span>
            <span>{shop.sensors[0].sessionsToday} visits</span>
          </div>
        ))}
      </section>
    </main>
  );
}
