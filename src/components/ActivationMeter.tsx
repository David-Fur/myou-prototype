import type { BodyRegion } from "../lib/metrics";
import { REGION_LABEL } from "../lib/metrics";

interface ActivationMeterProps {
  region: BodyRegion;
  value: number;
  band: [number, number];
}

type Status = "low" | "good" | "high";

function statusOf(value: number, band: [number, number]): Status {
  if (value < band[0]) return "low";
  if (value > band[1]) return "high";
  return "good";
}

const STATUS_COLOR: Record<Status, string> = {
  low: "var(--warning)",
  good: "var(--good)",
  high: "var(--serious)",
};

const STATUS_TEXT: Record<Status, string> = {
  low: "Below target — engage more",
  good: "On target",
  high: "Above target — ease off",
};

export function ActivationMeter({ region, value, band }: ActivationMeterProps) {
  const status = statusOf(value, band);
  const color = STATUS_COLOR[status];
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{REGION_LABEL[region]}</span>
        <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", color }}>{STATUS_TEXT[status]}</span>
      </div>
      <div
        style={{
          position: "relative",
          height: 14,
          borderRadius: 999,
          background: "var(--surface-2)",
          overflow: "hidden",
        }}
      >
        {/* target band */}
        <div
          style={{
            position: "absolute",
            left: `${band[0]}%`,
            width: `${band[1] - band[0]}%`,
            top: 0,
            bottom: 0,
            background: "color-mix(in oklab, var(--good) 18%, transparent)",
          }}
        />
        {/* current fill */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${clamped}%`,
            background: color,
            borderRadius: 999,
            transition: "width 120ms linear, background 200ms ease",
          }}
        />
      </div>
    </div>
  );
}
