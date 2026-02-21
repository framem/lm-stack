"use client";

import { useState, useCallback } from "react";
import { ConfigSidebar } from "@/components/bench/ConfigSidebar";
import { RequestCard } from "@/components/bench/RequestCard";
import { MetricsChart } from "@/components/bench/MetricsChart";
import { HistoryTable } from "@/components/bench/HistoryTable";
import { LiveStats } from "@/components/bench/LiveStats";
import { useBenchmark } from "@/lib/use-benchmark";
import { BenchmarkConfig } from "@/lib/types";
import { BarChart2, GitBranch } from "lucide-react";

const DEFAULT_CONFIG: BenchmarkConfig = {
  baseURL: "http://localhost:1234/v1",
  apiKey: "lm-studio",
  model: "qwen/qwen3-8b",
  prompt:
    "Write a short story about an astronaut who discovers something unexpected on Mars. Be creative and detailed.",
  concurrency: 4,
  unloadAfterRun: true,
};

export default function Home() {
  const [config, setConfig] = useState<BenchmarkConfig>(DEFAULT_CONFIG);
  const { requests, history, running, run, stop, clear } = useBenchmark();

  const handleRun = useCallback(() => run(config), [run, config]);

  const hasRequests = requests.length > 0;
  const hasHistory = history.length > 0;

  // Responsive grid columns
  const cols =
    config.concurrency === 1 ? 1 :
    config.concurrency === 2 ? 2 :
    config.concurrency <= 5 ? 3 :
    config.concurrency <= 10 ? 4 : 5;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--app-bg)" }}>
      {/* Sidebar */}
      <ConfigSidebar
        config={config}
        onChange={setConfig}
        running={running}
        onRun={handleRun}
        onStop={stop}
        onClear={clear}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <header
          className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
          style={{ borderColor: "var(--app-border)", background: "var(--app-surface)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ background: "var(--app-accent)" }}
            >
              <BarChart2 size={13} color="#000" />
            </div>
            <h1
              className="text-sm"
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "var(--app-text)",
              }}
            >
              LLM BENCH
            </h1>
            <div className="h-4 w-px" style={{ background: "var(--app-border-2)" }} />
            <span
              className="text-xs"
              style={{ color: "var(--app-text-3)", fontFamily: "JetBrains Mono, monospace", fontSize: 10 }}
            >
              Parallel Request Analyzer
            </span>
          </div>

          <div className="flex items-center gap-4">
            {running && (
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "var(--app-cyan)",
                    boxShadow: "0 0 6px var(--app-cyan)",
                    animation: "blink 1s step-end infinite",
                  }}
                />
                <span
                  className="text-xs"
                  style={{ color: "var(--app-cyan)", fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.12em" }}
                >
                  RUNNING
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <GitBranch size={11} style={{ color: "var(--app-text-3)" }} />
              <span className="section-label">{config.model}</span>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 flex flex-col gap-5">

            {/* Empty state */}
            {!hasRequests && !hasHistory && (
              <div
                className="flex flex-col items-center justify-center rounded border py-20 gap-4"
                style={{ borderColor: "var(--app-border)", borderStyle: "dashed", minHeight: 300 }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "var(--app-surface-2)" }}
                >
                  <BarChart2 size={28} style={{ color: "var(--app-text-3)" }} />
                </div>
                <div className="text-center">
                  <p
                    className="text-sm mb-1"
                    style={{ fontFamily: "Syne, sans-serif", color: "var(--app-text-2)", fontWeight: 600 }}
                  >
                    Bereit zum Benchmarken
                  </p>
                  <p className="text-xs" style={{ color: "var(--app-text-3)" }}>
                    Konfiguriere Model und Prompt, dann klicke auf{" "}
                    <span style={{ color: "var(--app-accent)" }}>BENCHMARK STARTEN</span>
                  </p>
                </div>
              </div>
            )}

            {/* Live stats */}
            {hasRequests && <LiveStats requests={requests} running={running} />}

            {/* Request cards */}
            {hasRequests && (
              <section>
                <p className="section-label mb-2.5">
                  Anfragen — {config.concurrency}× parallel
                </p>
                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                >
                  {requests.map((r, i) => (
                    <RequestCard key={r.id} result={r} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Chart */}
            {hasHistory && <MetricsChart history={history} />}

            {/* History table */}
            {hasHistory && <HistoryTable history={history} />}

          </div>
        </div>
      </main>
    </div>
  );
}
