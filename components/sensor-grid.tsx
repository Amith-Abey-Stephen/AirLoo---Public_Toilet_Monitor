import { Activity, DoorOpen, Droplets, Gauge, Thermometer, Wind } from "lucide-react";
import type { SensorReading } from "@/lib/types";

export function SensorGrid({ reading }: { reading: SensorReading }) {
  const metrics = [
    { label: "Door", value: reading.doorState, icon: DoorOpen },
    { label: "Sessions today", value: reading.sessionsToday, icon: Activity },
    { label: "Temperature", value: formatMaybe(reading.temperatureC, "C"), icon: Thermometer },
    { label: "Humidity", value: formatMaybe(reading.humidityPct, "%"), icon: Droplets },
    { label: "Air quality", value: formatMaybe(reading.airQualityIndex, "IAQ"), icon: Wind },
    { label: "Gas resistance", value: formatMaybe(reading.gasResistanceKohms, "kOhm"), icon: Gauge },
  ];

  return (
    <div className="sensor-grid">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div className="metric-card" key={metric.label}>
            <Icon size={20} />
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        );
      })}
    </div>
  );
}

function formatMaybe(value: number | undefined, suffix: string) {
  if (value === undefined) return "Waiting";
  return `${value}${suffix}`;
}
