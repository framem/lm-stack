"use client";

import { RunSummary } from "@/lib/types";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

interface Props {
  history: RunSummary[];
}

const ACCENT = "#f0a500";
const CYAN   = "#00c8e8";
const GREEN  = "#00e87a";
const TEXT2  = "#6a8898";
const BORDER = "#1e2830";
const BG     = "#0e1215";

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number; unit?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded px-3 py-2.5 text-xs"
      style={{
        background: "#141a1f",
        border: "1px solid #283540",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 11,
        minWidth: 160,
      }}
    >
      <div className="mb-1.5" style={{ color: "#f0a500", fontWeight: 600 }}>
        {label}× parallel
      </div>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-4" style={{ color: entry.color }}>
          <span>{entry.name}</span>
          <span>{typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function MetricsChart({ history }: Props) {
  if (history.length === 0) return null;

  const data = history.map((h) => ({
    name: h.concurrency,
    "Avg TPS": h.avgTPS !== null ? +h.avgTPS.toFixed(2) : 0,
    "Avg TTFT (ms)": h.avgTTFT !== null ? +h.avgTTFT.toFixed(0) : 0,
    "Avg Total (ms)": h.avgTotalTime !== null ? +h.avgTotalTime.toFixed(0) : 0,
    "Erfolg": h.successCount,
  }));

  return (
    <div
      className="rounded border p-4"
      style={{ background: BG, borderColor: BORDER }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="section-label mb-0.5">Performance-Analyse</p>
          <p className="text-xs" style={{ color: TEXT2, fontFamily: "DM Sans, sans-serif" }}>
            TPS & Latenz nach Parallelität
          </p>
        </div>
        <span
          className="px-2 py-0.5 rounded text-xs"
          style={{
            background: "var(--app-surface-3)",
            color: TEXT2,
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 9,
          }}
        >
          {history.length} RUN{history.length !== 1 ? "S" : ""}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={BORDER} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: TEXT2, fontFamily: "JetBrains Mono, monospace", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: BORDER }}
            tickFormatter={(v) => `${v}×`}
          />
          <YAxis
            yAxisId="tps"
            orientation="left"
            tick={{ fill: CYAN, fontFamily: "JetBrains Mono, monospace", fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(v) => `${v}`}
          />
          <YAxis
            yAxisId="ms"
            orientation="right"
            tick={{ fill: ACCENT, fontFamily: "JetBrains Mono, monospace", fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            width={50}
            tickFormatter={(v) => `${v}ms`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Legend
            wrapperStyle={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: TEXT2, paddingTop: 8 }}
          />
          <Bar yAxisId="tps" dataKey="Avg TPS" fill={CYAN} radius={[2, 2, 0, 0]} opacity={0.85} maxBarSize={40} />
          <Line
            yAxisId="ms"
            type="monotone"
            dataKey="Avg TTFT (ms)"
            stroke={ACCENT}
            strokeWidth={2}
            dot={{ fill: ACCENT, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: ACCENT }}
          />
          <Line
            yAxisId="ms"
            type="monotone"
            dataKey="Avg Total (ms)"
            stroke={GREEN}
            strokeWidth={1.5}
            strokeDasharray="4 2"
            dot={{ fill: GREEN, r: 2, strokeWidth: 0 }}
            activeDot={{ r: 4, fill: GREEN }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
