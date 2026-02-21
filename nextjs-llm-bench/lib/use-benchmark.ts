"use client";

import { useCallback, useRef, useState } from "react";
import {
  BenchmarkConfig,
  makeEmptyRequest,
  RequestResult,
  RunSummary,
  summarizeRun,
} from "./types";

type WarmupStatus = "idle" | "warming" | "ready" | "error";

export function useBenchmark() {
  const [requests, setRequests] = useState<RequestResult[]>([]);
  const [history, setHistory] = useState<RunSummary[]>([]);
  const [running, setRunning] = useState(false);
  const [warmupStatus, setWarmupStatus] = useState<WarmupStatus>("idle");
  const abortRef = useRef<AbortController | null>(null);
  const requestsRef = useRef<RequestResult[]>([]);

  const updateRequest = useCallback((id: number, patch: Partial<RequestResult>) => {
    setRequests((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
      requestsRef.current = next;
      return next;
    });
  }, []);

  const runSingleRequest = useCallback(
    async (id: number, config: BenchmarkConfig, signal: AbortSignal) => {
      const startTime = Date.now();
      updateRequest(id, { status: "streaming", startTime });

      let firstTokenTime: number | null = null;
      let charCount = 0;
      let text = "";

      try {
        const res = await fetch("/api/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: config.prompt,
            model: config.model,
            baseURL: config.baseURL,
            apiKey: config.apiKey,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
          }),
          signal,
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          if (!chunk) continue;

          if (!firstTokenTime) {
            firstTokenTime = Date.now();
            updateRequest(id, { firstTokenTime, ttft: firstTokenTime - startTime });
          }

          text += chunk;
          charCount += chunk.length;
          const elapsed = (Date.now() - firstTokenTime) / 1000;
          const liveTps = elapsed > 0 ? (charCount / 4) / elapsed : null;
          updateRequest(id, { text, charCount, tps: liveTps });
        }

        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const tokenCount = Math.round(charCount / 4);
        // TPS based on generation time only (excludes queue/TTFT wait)
        const generationTime = firstTokenTime ? endTime - firstTokenTime : totalTime;
        const tps = generationTime > 0 ? (tokenCount / generationTime) * 1000 : null;

        updateRequest(id, {
          status: "done",
          endTime,
          totalTime,
          tokenCount,
          charCount,
          tps,
          ttft: firstTokenTime ? firstTokenTime - startTime : null,
          text,
        });
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") {
          updateRequest(id, { status: "idle" });
        } else {
          updateRequest(id, { status: "error", error: (err as Error)?.message ?? "Fehler" });
        }
      }
    },
    [updateRequest]
  );

  const run = useCallback(
    async (config: BenchmarkConfig) => {
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      const initial = Array.from({ length: config.concurrency }, (_, i) => makeEmptyRequest(i));
      requestsRef.current = initial;
      setRequests(initial);
      setRunning(true);

      await Promise.allSettled(
        initial.map((r) => runSingleRequest(r.id, config, abort.signal))
      );

      setRunning(false);

      if (config.unloadAfterRun) {
        try {
          const base = config.baseURL.replace(/\/v1\/?$/, "");
          if (config.baseURL.includes(":11434")) {
            await fetch(`${base}/api/generate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ model: config.model, keep_alive: 0 }),
            });
          } else {
            await fetch(`${base}/api/v0/models/${encodeURIComponent(config.model)}`, {
              method: "DELETE",
            });
          }
        } catch { /* best-effort */ }
      }

      const summary = summarizeRun(requestsRef.current, config.concurrency);
      setHistory((h) => [...h, summary]);
    },
    [runSingleRequest]
  );

  const warmup = useCallback(async (config: BenchmarkConfig) => {
    setWarmupStatus("warming");
    try {
      const res = await fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Hi",
          systemPrompt: 'Always and only answer with "Hi".',
          model: config.model,
          baseURL: config.baseURL,
          apiKey: config.apiKey,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Drain the stream fully so the model loads completely
      const reader = res.body!.getReader();
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
      setWarmupStatus("ready");
    } catch {
      setWarmupStatus("error");
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setRunning(false);
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setRequests([]);
    requestsRef.current = [];
    setRunning(false);
  }, []);

  return { requests, history, running, warmupStatus, warmup, run, stop, clear };
}
