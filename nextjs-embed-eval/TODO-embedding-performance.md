# Embedding Performance — TODO

Ergebnisse der Analyse durch ein 3-Agenten-Team (Devils Advocate, RAG-Experte, Next.js-Experte).
Validiert gegen den aktuellen Code-Stand (2026-02-16).

---

## P1 — Hoch

### GET → POST für alle Embed/Evaluate-Routes
- **Status:** OFFEN
- **Problem:** Alle 4 SSE-Routes (`/api/embed`, `/api/embed-all`, `/api/rechunk-embed`, `/api/evaluate`) verwenden GET-Handler, führen aber DB-Schreiboperationen aus. REST-Verstoß — Browser-Prefetch, Crawler oder Caching-Layer könnten versehentlich Runs auslösen.
- **Lösung:** `export async function GET()` → `POST()` ändern. `useSSE`-Hook auf `fetch(url, { method: 'POST' })` umstellen.
- **Dateien:** `src/app/api/embed/route.ts`, `embed-all/route.ts`, `rechunk-embed/route.ts`, `evaluate/route.ts`, `src/hooks/useSSE.ts`

### `dynamic` + `maxDuration` auf API-Routes
- **Status:** OFFEN
- **Problem:** Keine der SSE-Routes setzt `export const dynamic = 'force-dynamic'` oder `export const maxDuration`. Next.js könnte Responses cachen; bei Deployment auf Serverless gibt es harte Timeout-Limits.
- **Lösung:** In jede SSE-Route einfügen:
  ```ts
  export const dynamic = 'force-dynamic'
  export const maxDuration = 300
  ```
- **Dateien:** `src/app/api/embed/route.ts`, `embed-all/route.ts`, `rechunk-embed/route.ts`, `evaluate/route.ts`

### ~~Server-seitiges Abort-Handling~~ ✅
- **Status:** ERLEDIGT
- `request.signal.aborted`-Checks in allen 3 Embed-Routes (embed, embed-all, rechunk-embed) vor jedem Batch-Loop

### ~~DB: Batch-Writes statt Einzel-Upserts~~ ✅
- **Status:** ERLEDIGT
- `saveChunkEmbeddingsBatch()` und `savePhraseEmbeddingsBatch()` mit `$transaction([deleteMany, createMany])` in `embeddings.ts`
- Alle 3 Embed-Routes nutzen die Batch-Funktionen

---

## P2 — Mittel

### ~~Embedding-Caching (unveränderte Chunks überspringen)~~ ✅
- **Status:** ERLEDIGT
- SHA-256 `contentHash` auf `TextChunk` und `ChunkEmbedding`
- Alle 4 Embed-Routes (`embed`, `embed-all`, `rechunk-embed`, `grid-search`) prüfen vor Embedding ob Hash übereinstimmt → überspringen
- **Dateien:** `prisma/schema/source.prisma`, `prisma/schema/embedding.prisma`, `src/data-access/source-texts.ts`, `src/data-access/embeddings.ts`, Route-Handler

### SSE-Heartbeat gegen Proxy-Timeouts
- **Status:** OFFEN
- **Problem:** Kein Heartbeat im SSE-Stream. Wenn ein Batch lange dauert (langsames Modell), können Reverse-Proxies oder Load-Balancer die idle Verbindung schließen.
- **Lösung:** `setInterval(() => send({ type: 'heartbeat' }), 15000)` im Stream-Handler. Im `useSSE`-Hook `heartbeat`-Events ignorieren.
- **Dateien:** Alle SSE-Route-Handler, `src/hooks/useSSE.ts`

### ~~useSSE: Unmount-Cleanup~~ ✅
- **Status:** ERLEDIGT
- `useEffect` Cleanup in `useSSE.ts` — abortet Stream bei Component-Unmount

---

## P3 — Niedrig

### BATCH_SIZE pro Provider konfigurierbar
- **Status:** OFFEN
- **Problem:** `BATCH_SIZE = 50` ist in allen Routes hardcoded. Optimale Größe hängt vom Provider ab (GPU VRAM, Modell-Größe).
- **Richtwerte nach Ollama-Fix:** 8 GB VRAM → 32–64, 16 GB → 64–128, 24 GB → 128–256.
- **Lösung:** Als Feld auf `EmbeddingModel` oder als Environment-Variable.
- **Dateien:** Route-Handler, ggf. `prisma/schema/embedding.prisma`

### ~~Token-Schätzung für Deutsch ungenau~~ ✅
- **Status:** ERLEDIGT
- `estimateTokens()` Faktor von 4 auf 3.5 angepasst, alle 3 Chunking-Strategien konsistent aktualisiert
