"use client";

import { RunSummary } from "@/lib/types";

interface Props {
  history: RunSummary[];
}

function fmt(ms: number | null): string {
  if (ms === null) return "—";
  return ms < 1000 ? `${ms.toFixed(0)} ms` : `${(ms / 1000).toFixed(2)} s`;
}

export function HistoryTable({ history }: Props) {
  if (history.length === 0) return null;

  return (
    <div
      className="rounded border overflow-hidden"
      style={{ borderColor: "var(--app-border)", background: "var(--app-bg)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: "var(--app-border)", background: "var(--app-surface)" }}
      >
        <span className="section-label">Verlauf</span>
        <span
          className="text-xs"
          style={{ color: "var(--app-text-3)", fontFamily: "JetBrains Mono, monospace", fontSize: 9 }}
        >
          {history.length} RUN{history.length !== 1 ? "S" : ""}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--app-surface-2)" }}>
              {["#", "Parallel", "Erfolg", "Avg TPS", "Avg TTFT", "Avg Total", "Tokens"].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-2"
                  style={{
                    color: "var(--app-text-3)",
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid var(--app-border)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...history].reverse().map((run, i) => (
              <tr
                key={run.timestamp}
                style={{
                  borderBottom: i < history.length - 1 ? "1px solid var(--app-border)" : "none",
                  background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                }}
              >
                <td className="px-4 py-2.5" style={{ color: "var(--app-text-3)", fontFamily: "JetBrains Mono, monospace", fontSize: 10 }}>
                  {history.length - i}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className="px-2 py-0.5 rounded"
                    style={{
                      background: "var(--app-surface-3)",
                      color: "var(--app-accent)",
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {run.concurrency}×
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span style={{ color: run.successCount === run.concurrency ? "var(--app-green)" : "var(--app-red)", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                    {run.successCount}/{run.concurrency}
                  </span>
                </td>
                <td className="px-4 py-2.5" style={{ color: "var(--app-cyan)", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                  {run.avgTPS !== null ? `${run.avgTPS.toFixed(1)} t/s` : "—"}
                </td>
                <td className="px-4 py-2.5" style={{ color: "var(--app-accent)", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                  {fmt(run.avgTTFT)}
                </td>
                <td className="px-4 py-2.5" style={{ color: "var(--app-text)", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                  {fmt(run.avgTotalTime)}
                </td>
                <td className="px-4 py-2.5" style={{ color: "var(--app-text-2)", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                  {run.totalTokens.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
