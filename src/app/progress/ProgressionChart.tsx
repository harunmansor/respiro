"use client";

import { useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { DISCIPLINES, formatTime, type Discipline } from "@/lib/disciplines";

export interface ChartPoint {
  /** epoch millis (serializable) */
  t: number;
  value: number;
  best: number;
}

export interface ChartSeries {
  discipline: Discipline;
  points: ChartPoint[];
}

export function ProgressionChart({ series }: { series: ChartSeries[] }) {
  const [active, setActive] = useState<Discipline>(series[0].discipline);
  const current = series.find((s) => s.discipline === active) ?? series[0];
  const meta = DISCIPLINES[current.discipline];
  const timeBased = meta.resultKind === "time";

  const fmtValue = (v: number) =>
    timeBased ? formatTime(v) : `${v} ${meta.unit}`;
  const fmtDate = (t: number) =>
    new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short" });

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {series.map((s) => (
          <button
            key={s.discipline}
            type="button"
            onClick={() => setActive(s.discipline)}
            className={
              "rounded-lg px-3 py-1.5 text-sm font-medium transition " +
              (s.discipline === active
                ? "bg-current-400 text-abyss-950"
                : "border border-current-300/20 text-foam-200/80 hover:bg-surface-raised/60")
            }
          >
            {s.discipline}
          </button>
        ))}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={current.points} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
            <CartesianGrid stroke="#123150" strokeDasharray="3 3" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={fmtDate}
              stroke="#56b8e0"
              tick={{ fill: "#a9e0f2", fontSize: 11 }}
            />
            <YAxis
              tickFormatter={fmtValue}
              stroke="#56b8e0"
              tick={{ fill: "#a9e0f2", fontSize: 11 }}
              width={48}
              domain={["dataMin", "dataMax"]}
            />
            <Tooltip
              contentStyle={{
                background: "#0b2238",
                border: "1px solid #123150",
                borderRadius: 12,
                color: "#d9f2fb",
              }}
              labelFormatter={(t) => fmtDate(Number(t))}
              formatter={(v, name) => [
                fmtValue(Number(v)),
                name === "best" ? "PB so far" : "Result",
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2a98c9"
              strokeWidth={1.5}
              dot={{ r: 3, fill: "#2a98c9" }}
              opacity={0.6}
            />
            <Line
              type="stepAfter"
              dataKey="best"
              stroke="#56b8e0"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
