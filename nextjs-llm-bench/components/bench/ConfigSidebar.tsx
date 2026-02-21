"use client";

import { BenchmarkConfig } from "@/lib/types";
import { Play, Square, RotateCcw, Zap, Cpu, Flame, CheckCircle2, XCircle } from "lucide-react";

const CONCURRENCY_OPTIONS = [1, 2, 4, 5, 10, 20];

// OKLCH color stops: blue(cold) → amber(neutral) → red(hot)
// Stops: [temperature, L, C, H]
const TEMP_STOPS = [
  [0.0,  0.72, 0.14, 220],  // cyan-blue
  [1.0,  0.80, 0.19,  78],  // amber
  [2.0,  0.62, 0.22,  28],  // red
] as const;

function tempToColor(t: number): string {
  const v = Math.max(0, Math.min(2, t));
  // Find surrounding stops
  let i = 1;
  while (i < TEMP_STOPS.length - 1 && TEMP_STOPS[i][0] < v) i++;
  const [t0, l0, c0, h0] = TEMP_STOPS[i - 1];
  const [t1, l1, c1, h1] = TEMP_STOPS[i];
  const f = (v - t0) / (t1 - t0);
  const lerp = (a: number, b: number) => a + (b - a) * f;
  return `oklch(${lerp(l0, l1).toFixed(3)} ${lerp(c0, c1).toFixed(3)} ${lerp(h0, h1).toFixed(1)})`;
}

const PRESET_PROMPTS = [
  { label: "Story", value: "Write a short story about an astronaut who discovers something unexpected on Mars. Be creative and detailed." },
  { label: "Code", value: "Write a Python function that implements a binary search tree with insert, search, and delete operations. Include docstrings." },
  { label: "Explain", value: "Explain how neural networks learn through backpropagation. Use analogies and be thorough." },
  { label: "List", value: "Give me 20 creative startup ideas in the AI space with a brief description of each." },
];

type WarmupStatus = "idle" | "warming" | "ready" | "error";

interface Props {
  config: BenchmarkConfig;
  onChange: (c: BenchmarkConfig) => void;
  running: boolean;
  warmupStatus: WarmupStatus;
  onRun: () => void;
  onStop: () => void;
  onClear: () => void;
  onWarmup: () => void;
}

export function ConfigSidebar({ config, onChange, running, warmupStatus, onRun, onStop, onClear, onWarmup }: Props) {
  const set = (patch: Partial<BenchmarkConfig>) => onChange({ ...config, ...patch });

  return (
    <aside
      className="flex flex-col h-full border-r overflow-y-auto"
      style={{
        width: 280,
        minWidth: 280,
        background: "var(--app-surface)",
        borderColor: "var(--app-border)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: "var(--app-border)" }}
      >
        <Cpu size={14} style={{ color: "var(--app-accent)" }} />
        <span className="font-display font-700 text-sm tracking-wide" style={{ color: "var(--app-accent)", fontFamily: "Syne, sans-serif", fontWeight: 700 }}>
          KONFIGURATION
        </span>
      </div>

      <div className="flex flex-col gap-5 p-4 flex-1">

        {/* Endpoint */}
        <div>
          <label className="section-label block mb-1.5">Endpoint URL</label>
          <input
            type="text"
            value={config.baseURL}
            onChange={(e) => set({ baseURL: e.target.value })}
            placeholder="http://localhost:11434/v1"
            spellCheck={false}
            className="w-full rounded px-2.5 py-1.5 text-xs font-mono-app outline-none"
            style={{
              background: "var(--app-bg)",
              border: `1px solid var(--app-border-2)`,
              color: "var(--app-text)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 11,
            }}
          />
        </div>

        {/* API Key */}
        <div>
          <label className="section-label block mb-1.5">API Key</label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => set({ apiKey: e.target.value })}
            placeholder="ollama / sk-..."
            className="w-full rounded px-2.5 py-1.5 text-xs font-mono-app outline-none"
            style={{
              background: "var(--app-bg)",
              border: `1px solid var(--app-border-2)`,
              color: "var(--app-text)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 11,
            }}
          />
        </div>

        {/* Model */}
        <div>
          <label className="section-label block mb-1.5">Model</label>
          <input
            type="text"
            value={config.model}
            onChange={(e) => set({ model: e.target.value })}
            placeholder="llama3.2, gpt-4o-mini, …"
            className="w-full rounded px-2.5 py-1.5 text-xs font-mono-app outline-none"
            style={{
              background: "var(--app-bg)",
              border: `1px solid var(--app-border-2)`,
              color: "var(--app-text)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 11,
            }}
          />
        </div>

        {/* Prompt */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="section-label">Prompt</label>
            <div className="flex gap-1">
              {PRESET_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => set({ prompt: p.value })}
                  className="px-1.5 py-0.5 rounded text-xs transition-colors"
                  style={{
                    background: config.prompt === p.value ? "var(--app-accent)" : "var(--app-surface-3)",
                    color: config.prompt === p.value ? "#000" : "var(--app-text-2)",
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={config.prompt}
            onChange={(e) => set({ prompt: e.target.value })}
            rows={5}
            className="w-full rounded px-2.5 py-2 text-xs outline-none resize-none"
            style={{
              background: "var(--app-bg)",
              border: `1px solid var(--app-border-2)`,
              color: "var(--app-text)",
              fontSize: 11,
              lineHeight: 1.6,
            }}
          />
        </div>

        {/* Temperature */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="section-label">Temperature</label>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 11,
                fontWeight: 600,
                color: tempToColor(config.temperature),
              }}
            >
              {config.temperature.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={config.temperature}
            onChange={(e) => set({ temperature: parseFloat(e.target.value) })}
            className="w-full"
            style={{ accentColor: tempToColor(config.temperature) }}
          />
          <div className="flex justify-between mt-1">
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "var(--app-text-3)" }}>deterministisch</span>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "var(--app-text-3)" }}>kreativ</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div>
          <label className="section-label block mb-2">Max Tokens</label>
          <div className="flex gap-1.5 flex-wrap">
            {[512, 1024, 2048, 4096].map((n) => {
              const active = config.maxTokens === n;
              return (
                <button
                  key={n}
                  onClick={() => set({ maxTokens: n })}
                  className="rounded transition-all"
                  style={{
                    padding: "4px 8px",
                    background: active ? "var(--app-surface-3)" : "var(--app-surface-3)",
                    border: `1px solid ${active ? "var(--app-accent)" : "var(--app-border-2)"}`,
                    color: active ? "var(--app-accent)" : "var(--app-text-3)",
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 10,
                    fontWeight: active ? 700 : 400,
                    letterSpacing: "0.04em",
                  }}
                >
                  {n >= 1024 ? `${n / 1024}k` : n}
                </button>
              );
            })}
          </div>
        </div>

        {/* Concurrency */}
        <div>
          <label className="section-label block mb-2">Parallele Requests</label>
          <div className="flex gap-1.5 flex-wrap">
            {CONCURRENCY_OPTIONS.map((n) => {
              const active = config.concurrency === n;
              return (
                <button
                  key={n}
                  onClick={() => set({ concurrency: n })}
                  className="relative flex items-center justify-center rounded transition-all"
                  style={{
                    width: 44,
                    height: 44,
                    background: active ? "var(--app-accent)" : "var(--app-surface-3)",
                    border: `1px solid ${active ? "var(--app-accent)" : "var(--app-border-2)"}`,
                    color: active ? "#000" : "var(--app-text-2)",
                    fontFamily: "Syne, sans-serif",
                    fontWeight: active ? 800 : 500,
                    fontSize: 15,
                    boxShadow: active ? "0 0 16px rgba(240,165,0,0.3)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs" style={{ color: "var(--app-text-3)", fontFamily: "JetBrains Mono, monospace", fontSize: 10 }}>
            {config.concurrency}× simultane Anfragen
          </p>
        </div>

        {/* Unload after run */}
        <div
          className="flex items-center justify-between rounded px-3 py-2"
          style={{ background: "var(--app-surface-3)", border: "1px solid var(--app-border)" }}
        >
          <div>
            <p className="section-label">Nach Benchmark entladen</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--app-text-3)", fontFamily: "JetBrains Mono, monospace", fontSize: 9 }}>
              Modell aus VRAM entfernen
            </p>
          </div>
          <button
            role="switch"
            aria-checked={config.unloadAfterRun}
            onClick={() => set({ unloadAfterRun: !config.unloadAfterRun })}
            className="relative flex-shrink-0 rounded-full transition-colors"
            style={{
              width: 36,
              height: 20,
              background: config.unloadAfterRun ? "var(--app-green)" : "var(--app-border-2)",
              transition: "background 0.2s",
            }}
          >
            <span
              className="absolute top-0.5 rounded-full"
              style={{
                width: 16,
                height: 16,
                background: "#fff",
                left: config.unloadAfterRun ? "calc(100% - 18px)" : 2,
                transition: "left 0.2s",
              }}
            />
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex flex-col gap-2 pb-2">
          {!running ? (
            <button
              onClick={onRun}
              className="btn-shimmer flex items-center justify-center gap-2 w-full rounded py-2.5 font-600 text-sm transition-all"
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                color: "#000",
                letterSpacing: "0.05em",
              }}
            >
              <Play size={14} fill="currentColor" />
              BENCHMARK STARTEN
            </button>
          ) : (
            <button
              onClick={onStop}
              className="flex items-center justify-center gap-2 w-full rounded py-2.5 text-sm transition-all"
              style={{
                background: "var(--app-red)",
                color: "#fff",
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              <Square size={14} fill="currentColor" />
              ABBRECHEN
            </button>
          )}

          {/* Warmup button */}
          <button
            onClick={onWarmup}
            disabled={warmupStatus === "warming" || running}
            className="flex items-center justify-center gap-2 w-full rounded py-2 text-xs transition-all"
            style={{
              background: warmupStatus === "ready"
                ? "rgba(0,232,122,0.08)"
                : warmupStatus === "error"
                ? "rgba(255,68,85,0.08)"
                : "var(--app-surface-3)",
              border: `1px solid ${
                warmupStatus === "ready"
                  ? "rgba(0,232,122,0.25)"
                  : warmupStatus === "error"
                  ? "rgba(255,68,85,0.25)"
                  : warmupStatus === "warming"
                  ? "rgba(0,200,232,0.3)"
                  : "var(--app-border)"
              }`,
              color: warmupStatus === "ready"
                ? "var(--app-green)"
                : warmupStatus === "error"
                ? "var(--app-red)"
                : warmupStatus === "warming"
                ? "var(--app-cyan)"
                : "var(--app-text-2)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10,
              letterSpacing: "0.08em",
              opacity: (warmupStatus === "warming" || running) ? 0.6 : 1,
              cursor: (warmupStatus === "warming" || running) ? "not-allowed" : "pointer",
            }}
          >
            {warmupStatus === "warming" ? (
              <>
                <Zap size={11} style={{ animation: "blink 0.8s step-end infinite" }} />
                WIRD AUFGEWÄRMT…
              </>
            ) : warmupStatus === "ready" ? (
              <>
                <CheckCircle2 size={11} />
                MODELL BEREIT
              </>
            ) : warmupStatus === "error" ? (
              <>
                <XCircle size={11} />
                AUFWÄRMEN FEHLGESCHLAGEN
              </>
            ) : (
              <>
                <Flame size={11} />
                LLM AUFWÄRMEN
              </>
            )}
          </button>

          <button
            onClick={onClear}
            className="flex items-center justify-center gap-2 w-full rounded py-2 text-xs transition-colors"
            style={{
              background: "var(--app-surface-3)",
              color: "var(--app-text-2)",
              fontFamily: "JetBrains Mono, monospace",
              letterSpacing: "0.08em",
            }}
          >
            <RotateCcw size={11} />
            Ergebnisse löschen
          </button>
        </div>
      </div>
    </aside>
  );
}
