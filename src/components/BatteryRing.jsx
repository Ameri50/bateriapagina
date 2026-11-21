import { BatteryCharging, BatteryFull, BatteryLow, PlugZap } from "lucide-react";

const RADIUS = 104;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function tone(level) {
  if (level == null) return "muted";
  if (level <= 15) return "danger";
  if (level <= 35) return "warn";
  return "good";
}

export function BatteryRing({ level, charging, supported = true, size = 280 }) {
  const clamped = level == null ? 0 : Math.max(0, Math.min(100, level));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
  const status = !supported
    ? "No disponible"
    : charging == null
      ? "Leyendo batería"
      : charging
        ? level >= 100
          ? "Completa"
          : "Cargando"
        : "Descargando";
  const StatusIcon = !supported ? BatteryLow : charging ? (level >= 100 ? BatteryFull : BatteryCharging) : BatteryLow;

  return (
    <div className={`ring ring--${tone(level)}`} style={{ "--ring-size": `${size}px` }}>
      <svg viewBox="0 0 240 240" aria-hidden="true">
        <defs>
          <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--ring-start)" />
            <stop offset="100%" stopColor="var(--ring-end)" />
          </linearGradient>
        </defs>
        <circle className="ring__track" cx="120" cy="120" r={RADIUS} />
        <circle
          className="ring__progress"
          cx="120"
          cy="120"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={level == null ? CIRCUMFERENCE : offset}
        />
      </svg>
      <div className="ring__center">
        <span className="ring__value">
          {level == null ? "—" : level}
          {level == null ? null : <small>%</small>}
        </span>
        <span className="ring__status">
          {charging ? <PlugZap size={13} strokeWidth={2.4} /> : <StatusIcon size={13} strokeWidth={2.4} />}
          {status}
        </span>
      </div>
    </div>
  );
}
