export type RequestStatus = "idle" | "pending" | "streaming" | "done" | "error";

export interface RequestResult {
  id: number;
  status: RequestStatus;
  text: string;
  startTime: number | null;
  firstTokenTime: number | null;
  endTime: number | null;
  tokenCount: number;    // completion tokens (from usage)
  charCount: number;     // running char count for live TPS estimate
  ttft: number | null;   // ms
  totalTime: number | null; // ms
  tps: number | null;    // tokens/sec (final, from usage)
  error: string | null;
}

export interface BenchmarkConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  prompt: string;
  concurrency: number;
  temperature: number;
  maxTokens: number;
  unloadAfterRun: boolean;
}

export interface RunSummary {
  concurrency: number;
  timestamp: number;
  results: RequestResult[];
  avgTTFT: number | null;
  avgTPS: number | null;
  avgTotalTime: number | null;
  totalTokens: number;
  successCount: number;
}

export function makeEmptyRequest(id: number): RequestResult {
  return {
    id,
    status: "pending",
    text: "",
    startTime: null,
    firstTokenTime: null,
    endTime: null,
    tokenCount: 0,
    charCount: 0,
    ttft: null,
    totalTime: null,
    tps: null,
    error: null,
  };
}

export function summarizeRun(results: RequestResult[], concurrency: number): RunSummary {
  const done = results.filter((r) => r.status === "done");
  const ttfts = done.map((r) => r.ttft).filter((v): v is number => v !== null);
  const tpss  = done.map((r) => r.tps).filter((v): v is number => v !== null);
  const times = done.map((r) => r.totalTime).filter((v): v is number => v !== null);

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  return {
    concurrency,
    timestamp: Date.now(),
    results,
    avgTTFT: avg(ttfts),
    avgTPS: avg(tpss),
    avgTotalTime: avg(times),
    totalTokens: done.reduce((s, r) => s + r.tokenCount, 0),
    successCount: done.length,
  };
}
