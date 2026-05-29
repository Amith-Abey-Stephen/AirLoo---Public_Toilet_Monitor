"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Filter, LocateFixed, Search } from "lucide-react";
import { ShopCard } from "@/components/shop-card";
import { listPublicShops } from "@/lib/firebase/firestore";
import type { Shop } from "@/lib/types";

const statuses = ["all", "healthy", "needs-cleaning", "offline"] as const;

export default function PublicSearchPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("all");

  useEffect(() => {
    document.title = "AirLoo | Public Toilet Monitor";
  }, []);

  useEffect(() => {
    listPublicShops()
      .then(setShops)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return shops.filter((shop) => {
      const matchesQuery =
        !needle ||
        [shop.name, shop.locality, shop.city, shop.category, shop.address]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      const matchesStatus = status === "all" || shop.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status, shops]);

  const totalDevices = shops.reduce((total, shop) => total + shop.sensors.length, 0);

  return (
    <main>
      <section className="hero-band">
        <div className="hero-copy">
          <span className="eyebrow">Public search</span>
          <h1>Find a nearby monitored toilet before you walk in.</h1>
          <p>
            Search by shop, locality, or facility type. Open any shop card to see live sensor values,
            door activity, and cleaning status.
          </p>
        </div>
        <div className="quick-panel">
          <strong>Current coverage</strong>
          {loading ? (
            <span>Loading...</span>
          ) : (
            <>
              <span>{shops.length} shops</span>
              <span>{totalDevices} devices</span>
            </>
          )}
          <Link href="/join">Add your shop</Link>
        </div>
      </section>

      <section className="workspace">
        <div className="toolbar">
          <label className="search-box">
            <Search size={19} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search shop, area, city..."
            />
          </label>
          <button className="icon-button" type="button" title="Use my location">
            <LocateFixed size={19} />
          </button>
          <label className="filter-box">
            <Filter size={18} />
            <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              <option value="all">All status</option>
              <option value="healthy">Healthy</option>
              <option value="needs-cleaning">Needs cleaning</option>
              <option value="offline">Offline</option>
            </select>
          </label>
        </div>

        <div className="shop-grid">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="shop-card" style={{ height: 200, opacity: 0.4 }}>
                  Loading...
                </div>
              ))
            : filtered.map((shop) => <ShopCard key={shop.id} shop={shop} />)}
        </div>
      </section>
    </main>
  );
}
