import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, ShieldCheck } from "lucide-react";
import { SensorGrid } from "@/components/sensor-grid";
import { StatusPill } from "@/components/status-pill";
import { getShop, shops } from "@/lib/mock-data";

export function generateStaticParams() {
  return shops.map((shop) => ({ shopId: shop.id }));
}

export default async function ShopDashboardPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;
  const shop = getShop(shopId);
  if (!shop) notFound();

  const sensor = shop.sensors[0];
  const lastEvent = new Date(sensor.lastEventAt);

  return (
    <main className="detail-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={17} />
        Search results
      </Link>

      <section className="detail-hero">
        <div>
          <span className="eyebrow">{shop.category}</span>
          <h1>{shop.name}</h1>
          <p>
            <MapPin size={17} />
            {shop.address}
          </p>
        </div>
        <StatusPill status={shop.status} />
      </section>

      <section className="split-layout">
        <div>
          <div className="section-heading">
            <h2>Sensor dashboard</h2>
            <span>
              <Clock size={16} />
              {lastEvent.toLocaleString("en-IN")}
            </span>
          </div>
          <SensorGrid reading={sensor} />
        </div>

        <aside className="side-panel">
          <ShieldCheck size={24} />
          <h2>Facility details</h2>
          <dl>
            <div>
              <dt>Owner</dt>
              <dd>{shop.ownerName}</dd>
            </div>
            <div>
              <dt>Device</dt>
              <dd>{sensor.deviceId}</dd>
            </div>
            <div>
              <dt>Door cycles</dt>
              <dd>
                {sensor.openCount} opens / {sensor.closeCount} closes
              </dd>
            </div>
          </dl>
          <div className="facility-row">
            {shop.facilities.map((facility) => (
              <span key={facility}>{facility}</span>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
