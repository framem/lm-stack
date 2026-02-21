# Langfuse TypeScript — LLM Observability

TypeScript-Mirror des [Python-Projekts](../langfuse/) — gleiche Lernziele, andere Sprache. Alle fünf Skripte decken dieselben Konzepte ab (Tracing, Prompt Management, Evaluation, RAG-Pipeline), nutzen aber die TypeScript-Idiome des Langfuse JS/TS SDK.

Für Grundlagen zu Langfuse (Was sind Traces? Was ist Prompt Management?) siehe das [Python-README](../langfuse/README.md). Dieses README fokussiert sich auf Setup, Ausführung und die Unterschiede zur Python-Variante.

## Wann TypeScript, wann Python?

| Kriterium | Python | TypeScript |
|-----------|--------|------------|
| **ML-Kontext** | PyTorch, scikit-learn, Notebooks, LangChain | - |
| **Evaluation-Pipelines** | Batch-Processing, Offline-Analyse | - |
| **Web-Anwendungen** | - | Next.js, Express, Fastify |
| **Vercel AI SDK / Edge Functions** | - | Nativer Support |
| **Frontend-nahe LLM-Features** | - | Streaming, Chat-UIs |
| **Full-Stack JS/TS** | - | Einheitliche Sprache im Stack |

Beide SDKs bieten dieselben Kernkonzepte. Die Wahl hängt vom Einsatzkontext ab, nicht von der Feature-Parität. Für einen detaillierten API-Vergleich siehe [docs/PY_VS_TS.md](docs/PY_VS_TS.md).

## Setup

### Voraussetzungen

- **Node.js** >= 18 (getestet mit Node 24)
- **LM Studio** mit geladenem Modell (z.B. Qwen3), Server gestartet auf Port 1234
- **Langfuse-Konto** (Cloud oder Self-hosted) mit API-Keys

### Installation

```bash
cd langfuse-ts
npm install
```

### Konfiguration

`.env` aus dem Python-Projekt kopieren — die Variablen sind identisch:

```bash
cp ../langfuse/.env .env
```

Oder manuell eine `.env` anlegen:

```env
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com

LM_STUDIO_BASE_URL=http://localhost:1234/v1
LM_STUDIO_MODEL=qwen3
```

## Skripte ausführen

Alle Skripte werden über npm-Scripts mit `tsx` ausgeführt:

```bash
npm run 01:basic       # Erster Trace — einfacher LLM-Call
npm run 01:chain       # Mehrstufige Kette mit nested Spans
npm run 02:prompts     # Prompt-Versionierung mit Labels
npm run 03:judge       # LLM-as-Judge Evaluation
npm run 04:rag         # Vollständige RAG-Pipeline
```

## Lernpfad

Die Skripte bauen aufeinander auf — in dieser Reihenfolge durcharbeiten:

### 1. Basics — Erster Trace

`src/01_tracing/tracingBasic.ts`

Ein einzelner LLM-Call als Trace mit Generation. Zeigt die Grundstruktur: `langfuse.trace()` erzeugt den Trace, `trace.generation()` loggt den LLM-Call mit Input, Output und Token-Usage.

### 2. Chaining — Mehrstufige Ketten

`src/01_tracing/tracingChain.ts`

Dreistufige Verarbeitungskette: Vorverarbeitung → LLM-Call → Nachbearbeitung. Jeder Schritt wird als eigener Span (`trace.span()`) bzw. Generation (`trace.generation()`) im Trace abgebildet.

### 3. Prompt Management — Versionierung

`src/02_prompt_management/promptVersioning.ts`

Prompt-Template mit Variablen (`{{concept}}`, `{{audience}}`, `{{length}}`) in Langfuse erstellen, per Label abrufen und mit `compile()` befüllen. Die Generation wird automatisch mit der Prompt-Version verknüpft.

### 4. Evaluation — LLM-as-Judge

`src/03_evaluation/llmAsJudge.ts`

Ein LLM beantwortet eine Frage, ein zweiter LLM-Call bewertet die Antwort auf einer Skala von 1-10. Der Score wird mit `langfuse.score({ traceId })` am Trace gespeichert.

### 5. Pipeline — RAG

`src/04_pipeline/ragPipeline.ts`

Vollständige RAG-Pipeline: Keyword-Retrieval → Prompt-Augmentation → LLM-Generation. Jeder Schritt als eigener Span/Generation im Trace sichtbar.

## Projektstruktur

```
langfuse-ts/
├── src/
│   ├── 01_tracing/
│   │   ├── tracingBasic.ts        # npm run 01:basic
│   │   └── tracingChain.ts        # npm run 01:chain
│   ├── 02_prompt_management/
│   │   └── promptVersioning.ts    # npm run 02:prompts
│   ├── 03_evaluation/
│   │   └── llmAsJudge.ts          # npm run 03:judge
│   └── 04_pipeline/
│       └── ragPipeline.ts         # npm run 04:rag
├── docs/
│   └── PY_VS_TS.md               # Detailvergleich Python vs. TypeScript SDK
├── package.json
└── tsconfig.json
```
