"use client";

import { RequestResult } from "@/lib/types";
import { Activity, Clock, Zap, CheckSquare } from "lucide-react";

interface Props {
  requests: RequestResult[];
  running: boolean;
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded px-3 py-2.5"
      style={{ background: "var(--app-surface-2)", border: "1px solid var(--app-border)" }}
    >
      <div style={{ color }}>{icon}</div>
      <div>
        <div className="section-label">{label}</div>
        <div
          className="text-sm font-mono-app mt-0.5"
          style={{ color, fontFamily: "JetBrains Mono, monospace", fontWeight: 500, fontSize: 14 }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export function LiveStats({ requests, running }: Props) {
  const done = requests.filter((r) => r.status === "done");
  const streaming = requests.filter((r) => r.status === "streaming");

  const avgTPS =
    done.length > 0
      ? done.reduce((s, r) => s + (r.tps ?? 0), 0) / done.length
      : streaming.length > 0
      ? streaming.reduce((s, r) => s + (r.tps ?? 0), 0) / streaming.length
      : null;

  const avgTTFT =
    done.length > 0
      ? done.reduce((s, r) => s + (r.ttft ?? 0), 0) / done.length
      : null;

  const totalTokens = requests.reduce((s, r) => s + r.tokenCount + Math.round(r.charCount / 4), 0);

  const completedCount = done.length + requests.filter((r) => r.status === "error").length;

  return (
    <div className="grid grid-cols-4 gap-2">
      <StatCard
        label="AKTIV"
        value={`${streaming.length} / ${requests.length}`}
        icon={<Activity size={14} />}
        color={streaming.length > 0 ? "var(--app-cyan)" : "var(--app-text-2)"}
      />
      <StatCard
        label="AVG TPS"
        value={avgTPS !== null ? `${avgTPS.toFixed(1)} t/s` : "—"}
        icon={<Zap size={14} />}
        color="var(--app-cyan)"
      />
      <StatCard
        label="AVG TTFT"
        value={avgTTFT !== null ? `${avgTTFT.toFixed(0)} ms` : "—"}
        icon={<Clock size={14} />}
        color="var(--app-accent)"
      />
      <StatCard
        label="ABGESCHLOSSEN"
        value={requests.length > 0 ? `${completedCount} / ${requests.length}` : "—"}
        icon={<CheckSquare size={14} />}
        color={completedCount === requests.length && requests.length > 0 ? "var(--app-green)" : "var(--app-text-2)"}
      />
    </div>
  );
}
