"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, MapPin, ShieldCheck } from "lucide-react";
import { SensorGrid } from "@/components/sensor-grid";
import { StatusPill } from "@/components/status-pill";
import { getPublicShop } from "@/lib/firebase/firestore";
import type { Shop } from "@/lib/types";

export default function ShopDashboardPage() {
  const params = useParams();
  const shopId = params.shopId as string;
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Shop Dashboard | AirLoo";
  }, []);

  useEffect(() => {
    getPublicShop(shopId)
      .then((shop) => {
        setShop(shop);
        if (shop) {
          document.title = `${shop.name} | AirLoo`;
        }
      })
      .finally(() => setLoading(false));
  }, [shopId]);

  if (loading) {
    return (
      <main className="detail-page">
        <p className="toast">Loading...</p>
      </main>
    );
  }

  if (!shop) {
    return (
      <main className="detail-page">
        <h1>Shop not found</h1>
        <Link className="back-link" href="/">
          <ArrowLeft size={17} />
          Search results
        </Link>
      </main>
    );
  }

  const sensor = shop.sensors[0];
  const lastEvent = sensor?.lastEventAt ? new Date(sensor.lastEventAt) : null;

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
              {lastEvent ? lastEvent.toLocaleString("en-IN") : "Waiting for first event"}
            </span>
          </div>
          {sensor ? <SensorGrid reading={sensor} /> : <p>No sensor data available.</p>}
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
              <dd>{sensor?.deviceId ?? "--"}</dd>
            </div>
            <div>
              <dt>Door cycles</dt>
              <dd>
                {sensor ? `${sensor.openCount} opens / ${sensor.closeCount} closes` : "--"}
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
