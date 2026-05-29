import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { StatusPill } from "@/components/status-pill";
import type { Shop } from "@/lib/types";

export function ShopCard({ shop }: { shop: Shop }) {
  const sensor = shop.sensors[0];

  return (
    <Link className="shop-card" href={`/shops/${shop.id}`}>
      <div className="card-row">
        <div>
          <span className="eyebrow">{shop.category}</span>
          <h3>{shop.name}</h3>
        </div>
        <StatusPill status={shop.status} />
      </div>
      <p>
        <MapPin size={16} />
        {shop.address}
      </p>
      <div className="facility-row">
        {shop.facilities.slice(0, 3).map((facility) => (
          <span key={facility}>{facility}</span>
        ))}
      </div>
      <div className="card-footer">
        <span>
          <Star size={16} />
          {shop.rating}
        </span>
        <span>{shop.distanceKm?.toFixed(1) ?? "--"} km away</span>
        <span>{sensor.sessionsToday} visits today</span>
      </div>
    </Link>
  );
}
