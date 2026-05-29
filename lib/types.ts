export type ShopStatus = "healthy" | "needs-cleaning" | "offline" | "maintenance";

export type SensorReading = {
  deviceId: string;
  doorState: "OPEN" | "CLOSED";
  openCount: number;
  closeCount: number;
  sessionsToday: number;
  temperatureC?: number;
  humidityPct?: number;
  pressureHpa?: number;
  gasResistanceKohms?: number;
  airQualityIndex?: number;
  lastEventAt: string;
};

export type Shop = {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  category: string;
  address: string;
  locality: string;
  city: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  status: ShopStatus;
  rating: number;
  facilities: string[];
  sensors: SensorReading[];
};

export type JoinRequest = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  shopName: string;
  location: string;
  message: string;
  status?: "new" | "reviewing" | "approved" | "rejected";
  createdAt?: unknown;
};
