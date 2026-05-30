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
  const [notice, setNotice] = useState("");

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

  function handleLocate() {
    if (!navigator.geolocation) {
      setNotice("Location is not supported on this browser. Search by area instead.");
      return;
    }

    setNotice("Checking your location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setShops((currentShops) =>
          currentShops
            .map((shop) => ({
              ...shop,
              distanceKm: distanceKm(latitude, longitude, shop.latitude, shop.longitude),
            }))
            .sort((a, b) => (a.distanceKm ?? Number.MAX_VALUE) - (b.distanceKm ?? Number.MAX_VALUE)),
        );
        setNotice("Sorted shops by distance from your current location.");
      },
      () => setNotice("Could not access location. Please allow location permission or search manually."),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

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
          <button className="icon-button" type="button" title="Use my location" onClick={handleLocate}>
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
        {notice ? <p className="toast">{notice}</p> : null}

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

function distanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
