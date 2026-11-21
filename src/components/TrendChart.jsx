import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { clockTime, dayLabel, shortDay, startOfDay } from "../lib/format";

const DAY = 24 * 60 * 60 * 1000;

function buildData(samples, range) {
  const now = Date.now();
  if (range === "7d") {
    const days = [];
    for (let index = 6; index >= 0; index -= 1) days.push(startOfDay(now - index * DAY));
    return days
      .map((day) => {
        const list = samples.filter((sample) => sample.t >= day && sample.t < day + DAY);
        const average = list.length ? list.reduce((sum, sample) => sum + sample.level, 0) / list.length : null;
        return {
          label: shortDay(day),
          full: dayLabel(day),
          value: average == null ? null : Math.round(average),
          count: list.length,
        };
      })
      .filter((entry) => entry.count > 0);
  }

  const start = now - DAY;
  const list = samples.filter((sample) => sample.t >= start);
  const stride = Math.max(1, Math.ceil(list.length / 120));
  return list
    .filter((_, index) => index % stride === 0)
    .map((sample) => ({
      label: clockTime(sample.t),
      full: `${dayLabel(sample.t)} · ${clockTime(sample.t)}`,
      value: sample.level,
      count: 1,
    }));
}

function TrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  if (point.value == null) return null;
  return (
    <div className="chart-tooltip">
      <span>{point.full}</span>
      <strong>{point.value} %</strong>
    </div>
  );
}

export function TrendChart({ samples, range = "7d", height = 220 }) {
  const data = useMemo(() => buildData(samples, range), [samples, range]);

  return (
    <div className="chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.38} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            interval="preserveStartEnd"
            minTickGap={18}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            orientation="right"
            width={38}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            unit="%"
          />
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: "rgba(255,255,255,.18)", strokeDasharray: "4 4" }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={2.4}
            fill="url(#trendFill)"
            connectNulls
            dot={data.length === 1}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--bg)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function summarize(samples) {
  if (!samples.length) return null;
  const levels = samples.map((sample) => sample.level);
  return {
    count: samples.length,
    average: Math.round(levels.reduce((sum, level) => sum + level, 0) / levels.length),
    max: Math.max(...levels),
    min: Math.min(...levels),
    chargingShare: Math.round((samples.filter((sample) => sample.charging).length / samples.length) * 100),
  };
}
