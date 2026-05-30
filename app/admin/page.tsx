"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  Database,
  Download,
  LogIn,
  LogOut,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  Store,
  UserCog,
  Users,
} from "lucide-react";
import { StatusPill } from "@/components/status-pill";
import { GoogleSignIn } from "@/components/google-signin";
import { auth, isFirebaseConfigured } from "@/lib/firebase/client";
import {
  listJoinRequests,
  listPublicShops,
  updateJoinRequestStatus,
  updateShopDetails,
} from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/use-auth";
import type { Shop, ShopStatus } from "@/lib/types";

const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

type AdminTab = "overview" | "users" | "analytics" | "interests" | "shops" | "alerts";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Owner" | "Cleaner" | "Viewer";
  status: "Active" | "Invited" | "Suspended";
  assigned: string;
  lastSeen: string;
};

type InterestRequest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  shopName: string;
  location: string;
  status: "New" | "Reviewing" | "Approved" | "Rejected";
  submittedAt: string;
};

type AdminAlert = {
  id: string;
  severity: "danger" | "info" | "success" | "warning";
  title: string;
  body: string;
};

const adminTabs: Array<{ id: AdminTab; label: string; icon: typeof BarChart3 }> = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "analytics", label: "Analytics", icon: Activity },
  { id: "interests", label: "Interest forms", icon: ClipboardList },
  { id: "shops", label: "Shops & devices", icon: Store },
  { id: "alerts", label: "Alerts", icon: AlertTriangle },
];

// No seeded/hardcoded data. Users and interest requests come from Firestore.

export default function AdminPage() {
  const { session, login, logout, setActiveEmail } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [interestRequests, setInterestRequests] = useState<InterestRequest[]>([]);
  const [assignedAlerts, setAssignedAlerts] = useState<Record<string, boolean>>({});
  const [adminMessage, setAdminMessage] = useState("");
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState(adminEmails[0] ?? "admin@airloo.in");
  const [password, setPassword] = useState("");

  const isAllowed = useMemo(() => {
    if (session.status !== "active") return false;
    return !adminEmails.length || adminEmails.includes(session.email.toLowerCase());
  }, [session]);

  useEffect(() => {
    document.title = "Admin Console | AirLoo";
  }, []);

  useEffect(() => {
    listPublicShops().then((loadedShops) => {
      setShops(loadedShops);
      setUsers(buildUsersFromShops(loadedShops));
    });
  }, []);

  useEffect(() => {
    listJoinRequests().then((requests) =>
      setInterestRequests(
        requests.map((request) => ({
          id: request.id ?? "",
          name: request.name,
          email: request.email,
          phone: request.phone,
          shopName: request.shopName,
          location: request.location,
          status: toInterestStatus(request.status),
          submittedAt: request.createdAt
            ? new Date((request.createdAt as { toMillis?: () => number }).toMillis?.() ?? Date.now()).toLocaleString(
                "en-IN",
              )
            : "Unknown",
        })),
      ),
    );
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await login(email, password);
  }

  function handleExport() {
    const rows = [
      ["Type", "Name", "Email", "Status", "Assigned", "Device", "Visits today"],
      ...shops.map((shop) => [
        "Shop",
        shop.name,
        shop.ownerEmail,
        shop.status,
        shop.locality,
        shop.sensors[0]?.deviceId ?? "",
        String(shop.sensors[0]?.sessionsToday ?? 0),
      ]),
      ...users.map((user) => ["User", user.name, user.email, user.status, user.assigned, "", ""]),
      ...interestRequests.map((request) => [
        "Interest",
        request.shopName,
        request.email,
        request.status,
        request.location,
        "",
        "",
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "airloo-admin-export.csv";
    link.click();
    URL.revokeObjectURL(url);
    setAdminMessage("Export downloaded.");
  }

  function handleInviteUser() {
    const inviteNumber = users.length + 1;
    setUsers((currentUsers) => [
      {
        id: `invite-${inviteNumber}`,
        name: `Invited user ${inviteNumber}`,
        email: `invite-${inviteNumber}@airloo.in`,
        role: "Viewer",
        status: "Invited",
        assigned: "Pending assignment",
        lastSeen: "Invite pending",
      },
      ...currentUsers,
    ]);
    setAdminMessage("User invite created locally. Connect Firebase user claims to persist roles.");
  }

  async function handleAddShop(shop: Shop) {
    setShops((currentShops) => [shop, ...currentShops]);
    setActiveTab("shops");
    setAdminMessage("Shop added locally. Connect a Firestore create helper to persist new shops.");
  }

  async function handleShopStatusChange(shopId: string, status: ShopStatus) {
    setShops((currentShops) =>
      currentShops.map((shop) => (shop.id === shopId ? { ...shop, status } : shop)),
    );
    await updateShopDetails(shopId, { status });
    setAdminMessage("Shop status updated.");
  }

  async function handleInterestStatusChange(requestId: string, status: InterestRequest["status"]) {
    setInterestRequests((currentRequests) =>
      currentRequests.map((request) => (request.id === requestId ? { ...request, status } : request)),
    );
    await updateJoinRequestStatus(requestId, status.toLowerCase() as "new" | "reviewing" | "approved" | "rejected");
    setAdminMessage("Interest form status updated.");
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
          <button className="primary-button" type="button" onClick={() => { setPassword(""); }}>
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

  if (!isAllowed) {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <ShieldCheck size={32} />
          <h1>Admin access denied.</h1>
          <p>Add this email to NEXT_PUBLIC_ADMIN_EMAILS if it should manage AirLoo.</p>
          <button className="ghost-button" type="button" onClick={logout}>
            Logout
          </button>
        </section>
      </main>
    );
  }

  const needsCleaning = shops.filter((shop) => shop.status === "needs-cleaning").length;
  const offline = shops.filter((shop) => shop.status === "offline").length;
  const totalDevices = shops.reduce((total, shop) => total + shop.sensors.length, 0);
  const totalVisits = shops.reduce(
    (total, shop) => total + shop.sensors.reduce((sensorTotal, sensor) => sensorTotal + sensor.sessionsToday, 0),
    0,
  );
  const activeDevices = shops.reduce(
    (total, shop) => total + shop.sensors.filter((sensor) => sensor.lastEventAt).length,
    0,
  );
  const avgAirQuality = Math.round(
    average(
      shops.flatMap((shop) =>
        shop.sensors
          .map((sensor) => sensor.airQualityIndex)
          .filter((value): value is number => typeof value === "number"),
      ),
    ),
  );
  const filteredShops = shops.filter((shop) =>
    [shop.name, shop.ownerEmail, shop.locality, shop.city, shop.sensors[0]?.deviceId ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const filteredUsers = users.filter((user) =>
    [user.name, user.email, user.role, user.assigned].join(" ").toLowerCase().includes(search.toLowerCase()),
  );
  const openInterests = interestRequests.filter((request) => request.status === "New" || request.status === "Reviewing");
  const alerts = buildAlerts(shops, openInterests.length);

  return (
    <main className="dashboard-page">
      <SessionWarningBar session={session} />
      <section className="page-header">
        <div>
          <span className="eyebrow">Admin console</span>
          <h1>Manage shops, owners, devices, and alerts.</h1>
          <p>System-wide visibility for all public locations and sensor streams.</p>
        </div>
        <div className="button-row">
          <button className="ghost-button" type="button" onClick={handleExport}>
            <Download size={18} />
            Export
          </button>
          <button className="primary-button" type="button" onClick={() => setActiveTab("shops")}>
            <Plus size={18} />
            Add shop
          </button>
          <button className="ghost-button" type="button" onClick={logout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </section>
      {adminMessage ? <p className="toast">{adminMessage}</p> : null}

      <section className="admin-tabs" aria-label="Admin sections">
        {adminTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              className={activeTab === tab.id ? "active" : ""}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <Icon size={17} />
              {tab.label}
            </button>
          );
        })}
      </section>

      <label className="admin-search">
        <Search size={18} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search users, shops, devices, owners..."
        />
      </label>

      <section className="admin-stats">
        <div>
          <span>Total shops</span>
          <strong>{shops.length}</strong>
        </div>
        <div>
          <span>Devices</span>
          <strong>{totalDevices}</strong>
        </div>
        <div>
          <span>Needs cleaning</span>
          <strong>{needsCleaning}</strong>
        </div>
        <div>
          <span>Offline</span>
          <strong>{offline}</strong>
        </div>
      </section>

      {activeTab === "overview" ? (
        <OverviewPanel
          activeDevices={activeDevices}
          alerts={alerts}
          avgAirQuality={avgAirQuality}
          interestCount={openInterests.length}
          shops={filteredShops}
          totalDevices={totalDevices}
          totalVisits={totalVisits}
        />
      ) : null}

      {activeTab === "users" ? (
        <UsersPanel
          users={filteredUsers}
          onInvite={handleInviteUser}
          onRoleChange={(userId, role) =>
            setUsers((currentUsers) =>
              currentUsers.map((user) => (user.id === userId ? { ...user, role } : user)),
            )
          }
          onStatusToggle={(userId) =>
            setUsers((currentUsers) =>
              currentUsers.map((user) =>
                user.id === userId
                  ? { ...user, status: user.status === "Suspended" ? "Active" : "Suspended" }
                  : user,
              ),
            )
          }
        />
      ) : null}

      {activeTab === "analytics" ? (
        <AnalyticsPanel
          avgAirQuality={avgAirQuality}
          needsCleaning={needsCleaning}
          offline={offline}
          shops={filteredShops}
          totalVisits={totalVisits}
        />
      ) : null}

      {activeTab === "interests" ? (
        <InterestPanel
          requests={interestRequests.filter((request) =>
            [request.name, request.email, request.shopName, request.location]
              .join(" ")
              .toLowerCase()
              .includes(search.toLowerCase()),
          )}
          onStatusChange={handleInterestStatusChange}
        />
      ) : null}

      {activeTab === "shops" ? (
        <ShopsPanel shops={filteredShops} onAddShop={handleAddShop} onStatusChange={handleShopStatusChange} />
      ) : null}

      {activeTab === "alerts" ? (
        <AlertsPanel
          alerts={alerts}
          assignedAlerts={assignedAlerts}
          onAssign={(alertId) => {
            setAssignedAlerts((current) => ({ ...current, [alertId]: true }));
            setAdminMessage("Alert assigned to the field team.");
          }}
        />
      ) : null}
    </main>
  );
}

function SessionWarningBar({ session: { email } }: { session: { email: string } }) {
  return (
    <div className="session-bar">
      <span>Logged in as <strong>{email}</strong> &middot; session expires in 30 min</span>
    </div>
  );
}

function OverviewPanel({
  activeDevices,
  alerts,
  avgAirQuality,
  interestCount,
  shops,
  totalDevices,
  totalVisits,
}: {
  activeDevices: number;
  alerts: ReturnType<typeof buildAlerts>;
  avgAirQuality: number;
  interestCount: number;
  shops: Shop[];
  totalDevices: number;
  totalVisits: number;
}) {
  return (
    <section className="admin-overview-grid">
      <div className="admin-panel span-2">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Live operations</span>
            <h2>Network health</h2>
          </div>
          <Database size={22} />
        </div>
        <div className="ops-grid">
          <MiniStat label="Visits today" value={totalVisits} />
          <MiniStat label="Active devices" value={`${activeDevices}/${totalDevices || 0}`} />
          <MiniStat label="Avg IAQ" value={Number.isFinite(avgAirQuality) ? avgAirQuality : "--"} />
          <MiniStat label="Open interests" value={interestCount} />
        </div>
        <div className="mini-chart" aria-label="Weekly usage preview">
          {shops.length
            ? shops.slice(0, 7).map((shop) => {
                const visits = shop.sensors[0]?.sessionsToday ?? 0;
                const maxVisits = Math.max(1, ...shops.map((s) => s.sensors[0]?.sessionsToday ?? 0));
                return <span key={shop.id} style={{ height: `${(visits / maxVisits) * 100}%` }} title={`${shop.name}: ${visits} visits`} />;
              })
            : null}
        </div>
      </div>

      <div className="admin-panel">
        <div className="panel-title">
          <h2>Urgent queue</h2>
          <AlertTriangle size={22} />
        </div>
        <div className="alert-list">
          {alerts.slice(0, 4).map((alert) => (
            <div className={`alert-item ${alert.severity}`} key={alert.id}>
              <strong>{alert.title}</strong>
              <span>{alert.body}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-panel span-3">
        <div className="panel-title">
          <h2>Recent shops</h2>
          <Store size={22} />
        </div>
        <AdminShopTable shops={shops.slice(0, 6)} />
      </div>
    </section>
  );
}

function UsersPanel({
  onInvite,
  onRoleChange,
  onStatusToggle,
  users,
}: {
  onInvite: () => void;
  onRoleChange: (userId: string, role: AdminUser["role"]) => void;
  onStatusToggle: (userId: string) => void;
  users: AdminUser[];
}) {
  return (
    <section className="admin-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Access control</span>
          <h2>Manage admins, owners, cleaners, and viewers</h2>
        </div>
        <button className="primary-button" type="button" onClick={onInvite}>
          <UserCog size={17} />
          Invite user
        </button>
      </div>
      <div className="user-grid">
        {users.length ? users.map((user) => (
          <article className="user-card" key={user.id}>
            <div>
              <h3>{user.name}</h3>
              <p>{user.email}</p>
            </div>
            <div className="user-meta">
              <span>{user.assigned}</span>
              <span>{user.lastSeen}</span>
            </div>
            <div className="user-actions">
              <select value={user.role} onChange={(event) => onRoleChange(user.id, event.target.value as AdminUser["role"])}>
                <option>Admin</option>
                <option>Owner</option>
                <option>Cleaner</option>
                <option>Viewer</option>
              </select>
              <button className="ghost-button" type="button" onClick={() => onStatusToggle(user.id)}>
                {user.status === "Suspended" ? "Reactivate" : "Suspend"}
              </button>
            </div>
            <span className={`admin-badge ${user.status.toLowerCase()}`}>{user.status}</span>
          </article>
        )) : <p className="empty-state">No users match this search.</p>}
      </div>
    </section>
  );
}

function AnalyticsPanel({
  avgAirQuality,
  needsCleaning,
  offline,
  shops,
  totalVisits,
}: {
  avgAirQuality: number;
  needsCleaning: number;
  offline: number;
  shops: Shop[];
  totalVisits: number;
}) {
  const busiest = [...shops].sort(
    (a, b) => (b.sensors[0]?.sessionsToday ?? 0) - (a.sensors[0]?.sessionsToday ?? 0),
  );

  return (
    <section className="admin-overview-grid">
      <div className="admin-panel span-2">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Analytics</span>
            <h2>Usage and sanitation trends</h2>
          </div>
          <BarChart3 size={22} />
        </div>
        <div className="analytics-strip">
          <MiniStat label="Total visits today" value={totalVisits} />
          <MiniStat label="Cleaning load" value={needsCleaning} />
          <MiniStat label="Offline risk" value={offline} />
          <MiniStat label="Avg air quality" value={Number.isFinite(avgAirQuality) ? avgAirQuality : "--"} />
        </div>
        <div className="horizontal-bars">
          {busiest.slice(0, 5).map((shop) => {
            const visits = shop.sensors[0]?.sessionsToday ?? 0;
            const maxVisits = Math.max(1, busiest[0]?.sensors[0]?.sessionsToday ?? 1);
            return (
              <div key={shop.id}>
                <span>{shop.name}</span>
                <strong>{visits}</strong>
                <i style={{ width: `${Math.max(8, (visits / maxVisits) * 100)}%` }} />
              </div>
            );
          })}
        </div>
      </div>
      <div className="admin-panel">
        <div className="panel-title">
          <h2>Suggested actions</h2>
          <CheckCircle2 size={22} />
        </div>
        <ul className="action-list">
          <li>Schedule cleaning for high-IAQ and high-usage locations first.</li>
          <li>Call owners for offline devices older than 60 minutes.</li>
          <li>Review interest forms daily and convert approved shops to owner invites.</li>
          <li>Export weekly CSV for municipal reporting.</li>
        </ul>
      </div>
    </section>
  );
}

function InterestPanel({
  onStatusChange,
  requests,
}: {
  onStatusChange: (requestId: string, status: InterestRequest["status"]) => void;
  requests: InterestRequest[];
}) {
  return (
    <section className="admin-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Onboarding</span>
          <h2>Interest form submissions</h2>
        </div>
        <Mail size={22} />
      </div>
      <div className="interest-grid">
        {requests.length ? requests.map((request) => (
          <article className="interest-card" key={request.id}>
            <div className="card-row">
              <div>
                <h3>{request.shopName}</h3>
                <p>{request.location}</p>
              </div>
              <span className={`admin-badge ${request.status.toLowerCase()}`}>{request.status}</span>
            </div>
            <dl>
              <div>
                <dt>Contact</dt>
                <dd>{request.name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{request.email}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{request.phone}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{request.submittedAt}</dd>
              </div>
            </dl>
            <div className="button-row">
              <button className="primary-button" type="button" onClick={() => onStatusChange(request.id, "Approved")}>
                Approve
              </button>
              <button className="ghost-button" type="button" onClick={() => onStatusChange(request.id, "Reviewing")}>
                Review
              </button>
              <button className="ghost-button" type="button" onClick={() => onStatusChange(request.id, "Rejected")}>
                Reject
              </button>
            </div>
          </article>
        )) : <p className="empty-state">No interest forms match this search.</p>}
      </div>
    </section>
  );
}

function ShopsPanel({
  onAddShop,
  onStatusChange,
  shops,
}: {
  onAddShop: (shop: Shop) => void;
  onStatusChange: (shopId: string, status: ShopStatus) => void;
  shops: Shop[];
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="admin-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Inventory</span>
          <h2>Shops and device registry</h2>
        </div>
        <button className="primary-button" type="button" onClick={() => setShowForm((open) => !open)}>
          <Plus size={17} />
          {showForm ? "Close form" : "Add shop"}
        </button>
      </div>
      {showForm ? <AddShopForm onAddShop={onAddShop} /> : null}
      <AdminShopTable shops={shops} onStatusChange={onStatusChange} />
    </section>
  );
}

function AlertsPanel({
  alerts,
  assignedAlerts,
  onAssign,
}: {
  alerts: ReturnType<typeof buildAlerts>;
  assignedAlerts: Record<string, boolean>;
  onAssign: (alertId: string) => void;
}) {
  return (
    <section className="admin-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Risk center</span>
          <h2>Alerts and follow-ups</h2>
        </div>
        <AlertTriangle size={22} />
      </div>
      <div className="alert-list large">
        {alerts.map((alert) => (
          <article className={`alert-item ${alert.severity}`} key={alert.id}>
            <div>
              <strong>{alert.title}</strong>
              <span>{alert.body}</span>
            </div>
            <button className="ghost-button" type="button" onClick={() => onAssign(alert.id)} disabled={assignedAlerts[alert.id]}>
              {assignedAlerts[alert.id] ? "Assigned" : "Assign"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminShopTable({
  onStatusChange,
  shops,
}: {
  onStatusChange?: (shopId: string, status: ShopStatus) => void;
  shops: Shop[];
}) {
  return (
    <div className="table-card compact-table">
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
            {onStatusChange ? (
              <select
                className="admin-select"
                value={shop.status}
                onChange={(event) => onStatusChange(shop.id, event.target.value as ShopStatus)}
              >
                <option value="healthy">Healthy</option>
                <option value="needs-cleaning">Needs cleaning</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Maintenance</option>
              </select>
            ) : (
              <StatusPill status={shop.status} />
            )}
          </span>
          <span>{shop.sensors[0]?.deviceId ?? "--"}</span>
          <span>{shop.sensors[0]?.sessionsToday ?? 0} visits</span>
        </div>
      ))}
      {!shops.length ? <p className="empty-state">No matching shops found. Add shops in Firestore to populate this list.</p> : null}
    </div>
  );
}

function AddShopForm({ onAddShop }: { onAddShop: (shop: Shop) => void }) {
  return (
    <form
      className="shop-add-form"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const name = String(formData.get("name") ?? "").trim();
        const ownerEmail = String(formData.get("ownerEmail") ?? "").trim();
        const address = String(formData.get("address") ?? "").trim();
        const locality = String(formData.get("locality") ?? "").trim();

        if (!name || !ownerEmail || !address || !locality) return;

        onAddShop({
          id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
          name,
          ownerName: ownerEmail.split("@")[0] ?? "Owner",
          ownerEmail,
          category: String(formData.get("category") ?? "Shop"),
          address,
          locality,
          city: String(formData.get("city") ?? "Coimbatore"),
          latitude: Number(formData.get("latitude") ?? 0),
          longitude: Number(formData.get("longitude") ?? 0),
          status: "healthy",
          rating: 4,
          facilities: ["Public toilet"],
          sensors: [],
        });
        event.currentTarget.reset();
      }}
    >
      <label>
        Shop name
        <input name="name" required />
      </label>
      <label>
        Owner email
        <input name="ownerEmail" type="email" required />
      </label>
      <label>
        Category
        <input name="category" defaultValue="Shop" />
      </label>
      <label>
        Locality
        <input name="locality" required />
      </label>
      <label className="full-span">
        Address
        <input name="address" required />
      </label>
      <label>
        City
        <input name="city" defaultValue="Coimbatore" />
      </label>
      <label>
        Latitude
        <input name="latitude" type="number" step="any" defaultValue="0" />
      </label>
      <label>
        Longitude
        <input name="longitude" type="number" step="any" defaultValue="0" />
      </label>
      <button className="primary-button" type="submit">
        <Plus size={17} />
        Add shop
      </button>
    </form>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="mini-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function buildAlerts(shops: Shop[], openInterestCount: number): AdminAlert[] {
  const alerts = shops.flatMap((shop) => {
    const sensor = shop.sensors[0];
    const shopAlerts: Array<AdminAlert | null> = [
      shop.status === "needs-cleaning"
        ? {
            id: `${shop.id}-clean`,
            severity: "warning",
            title: `${shop.name} needs cleaning`,
            body: `${sensor?.sessionsToday ?? 0} visits today. Prioritize field follow-up.`,
          }
        : null,
      shop.status === "offline"
        ? {
            id: `${shop.id}-offline`,
            severity: "danger",
            title: `${shop.name} device check`,
            body: `Last device update looks stale. Contact ${shop.ownerName}.`,
          }
        : null,
      sensor?.airQualityIndex && sensor.airQualityIndex > 150
        ? {
            id: `${shop.id}-iaq`,
            severity: "danger",
            title: `${shop.name} air quality high`,
            body: `IAQ is ${sensor.airQualityIndex}. Cleaning or ventilation required.`,
          }
        : null,
    ];

    return shopAlerts.filter((alert): alert is AdminAlert => alert !== null);
  });

  if (openInterestCount) {
    alerts.unshift({
      id: "interest-queue",
      severity: "info",
      title: `${openInterestCount} interest forms waiting`,
      body: "Review onboarding requests and convert approved shops to owner invites.",
    });
  }

  if (!alerts.length) {
    return [
      {
        id: "all-clear",
        severity: "success",
        title: "No urgent alerts",
        body: "All tracked shops are currently inside expected operating range.",
      },
    ];
  }

  return alerts;
}

function toInterestStatus(status: unknown): InterestRequest["status"] {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "reviewing") return "Reviewing";
  return "New";
}

function buildUsersFromShops(shops: Shop[]): AdminUser[] {
  const owners = new Map<string, AdminUser>();

  shops.forEach((shop) => {
    if (!shop.ownerEmail) return;
    owners.set(shop.ownerEmail, {
      id: shop.ownerEmail,
      name: shop.ownerName || shop.ownerEmail.split("@")[0] || "Shop owner",
      email: shop.ownerEmail,
      role: "Owner",
      status: "Active",
      assigned: shop.name,
      lastSeen: shop.sensors[0]?.lastEventAt
        ? new Date(shop.sensors[0].lastEventAt).toLocaleString("en-IN")
        : "No sensor activity",
    });
  });

  const admins = adminEmails.map((email) => ({
    id: email,
    name: email.split("@")[0] || "Admin",
    email,
    role: "Admin" as const,
    status: "Active" as const,
    assigned: "All locations",
    lastSeen: "Current session",
  }));

  return [...admins, ...owners.values()];
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function average(values: number[]) {
  if (!values.length) return Number.NaN;
  return values.reduce((total, value) => total + value, 0) / values.length;
}
