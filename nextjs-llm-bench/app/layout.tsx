import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Bench — Parallel Request Analyzer",
  description: "Benchmark LLM throughput and latency under concurrent load",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
