import type { ShopStatus } from "@/lib/types";

const labels: Record<ShopStatus, string> = {
  healthy: "Healthy",
  "needs-cleaning": "Needs cleaning",
  offline: "Offline",
  maintenance: "Maintenance",
};

export function StatusPill({ status }: { status: ShopStatus }) {
  return <span className={`status-pill ${status}`}>{labels[status]}</span>;
}
