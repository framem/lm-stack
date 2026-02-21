"use client";

import { RequestResult } from "@/lib/types";
import { CheckCircle, XCircle } from "lucide-react";
import { useEffect, useRef } from "react";

function fmt(ms: number | null): string {
  if (ms === null) return "—";
  return ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

interface Props {
  result: RequestResult;
  index: number;
}

export function RequestCard({ result, index }: Props) {
  const textRef = useRef<HTMLDivElement>(null);
  const isStreaming = result.status === "streaming";
  const isDone     = result.status === "done";
  const isError    = result.status === "error";
  const isPending  = result.status === "pending";

  // Auto-scroll while streaming
  useEffect(() => {
    if (textRef.current && isStreaming) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [result.text, isStreaming]);

  const borderColor = isStreaming
    ? "rgba(0,200,232,0.5)"
    : isDone
    ? "var(--app-border-2)"
    : isError
    ? "rgba(255,68,85,0.4)"
    : "var(--app-border)";

  const liveTPS = result.tps !== null ? result.tps.toFixed(1) : null;
  const liveElapsed = result.startTime
    ? ((Date.now() - result.startTime) / 1000).toFixed(1)
    : null;

  return (
    <div
      className="flex flex-col rounded relative overflow-hidden"
      style={{
        background: "var(--app-surface)",
        border: `1px solid ${borderColor}`,
        height: 340,
        transition: "border-color 0.4s, box-shadow 0.4s",
        boxShadow: isStreaming
          ? "0 0 12px rgba(0,200,232,0.1)"
          : isDone
          ? "0 0 0 rgba(0,232,122,0)"
          : "none",
      }}
    >
      {/* Scan-line sweep while streaming */}
      {isStreaming && (
        <div
          style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 1, zIndex: 10,
            background: "linear-gradient(90deg, transparent, var(--app-cyan), transparent)",
            animation: "scan 2.5s linear infinite",
            pointerEvents: "none",
          }}
        />
      )}

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-3 py-1.5 flex-shrink-0"
        style={{ background: "var(--app-surface-2)", borderBottom: "1px solid var(--app-border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: isPending ? "var(--app-text-3)" : isStreaming ? "var(--app-cyan)" : isDone ? "var(--app-green)" : "var(--app-red)",
              boxShadow: isStreaming ? "0 0 5px var(--app-cyan)" : "none",
              transition: "all 0.2s",
            }}
          />
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "var(--app-text-3)", letterSpacing: "0.1em" }}>
            REQ {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isDone  && <CheckCircle size={11} style={{ color: "var(--app-green)" }} />}
          {isError && <XCircle    size={11} style={{ color: "var(--app-red)" }} />}
          {isStreaming && liveTPS && (
            <span
              className="px-1.5 py-0.5 rounded"
              style={{ background: "rgba(0,200,232,0.1)", color: "var(--app-cyan)", fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.08em" }}
            >
              {liveTPS} t/s
            </span>
          )}
          {isDone && result.tps && (
            <span
              className="px-1.5 py-0.5 rounded"
              style={{ background: "rgba(0,232,122,0.08)", color: "var(--app-green)", fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 600 }}
            >
              {result.tps.toFixed(1)} t/s
            </span>
          )}
        </div>
      </div>

      {/* ── Chat / Token stream area ── */}
      <div
        ref={textRef}
        className="flex-1 overflow-y-auto px-4 py-3"
        style={{
          color: "var(--app-text)",
          fontSize: 13,
          lineHeight: 1.7,
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        {isError ? (
          <span style={{ color: "var(--app-red)", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
            ✕ {result.error}
          </span>
        ) : isPending ? (
          <span style={{ color: "var(--app-text-3)", fontFamily: "JetBrains Mono, monospace", fontSize: 10 }}>
            Verbindung wird aufgebaut…
          </span>
        ) : (
          <span className={isStreaming ? "cursor-blink" : ""}>{result.text}</span>
        )}
      </div>

      {/* ── Footer metrics ── */}
      <div
        className="flex items-center gap-4 px-3 py-1.5 flex-shrink-0"
        style={{ borderTop: "1px solid var(--app-border)", background: "var(--app-surface-2)" }}
      >
        <Metric label="TTFT"  value={fmt(result.ttft)}       color="var(--app-accent)"  dim={!result.ttft} />
        <Metric label="Total" value={fmt(result.totalTime)}  color="var(--app-text-2)"  dim={!result.totalTime} />
        <Metric label="Tok"   value={isDone ? String(result.tokenCount) : result.charCount > 0 ? `~${Math.round(result.charCount / 4)}` : "—"} color="var(--app-text-3)" dim={result.charCount === 0} />
        {isStreaming && liveElapsed && (
          <span style={{ marginLeft: "auto", fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "var(--app-text-3)" }}>
            {liveElapsed}s
          </span>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, color, dim }: { label: string; value: string; color: string; dim: boolean }) {
  return (
    <div className="flex items-center gap-1" style={{ opacity: dim ? 0.35 : 1 }}>
      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8, color: "var(--app-text-3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
