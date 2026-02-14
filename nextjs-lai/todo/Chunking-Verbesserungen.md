# Chunking & Search Improvements

## Chunking-Verbesserungen

### 1. Semantic Chunking statt fixer Zeichengrenze

**Status:** Offen
**Impact:** Hoch
**Aufwand:** Mittel

Aktuell wird nach Saetzen gesplittet bis `TARGET_CHARS` erreicht ist. Das zerschneidet oft zusammengehoerige Absaetze oder Konzepte.

**Idee:** Chunks an Markdown-Headings / Absatzgrenzen ausrichten. Ein `## Kapitel` sollte nie mitten in einem Chunk beginnen, sondern immer einen neuen Chunk starten. Das verbessert die Kohaerenz pro Chunk massiv.

**Betroffene Datei:** `src/lib/chunking.ts`

---

### 2. Strukturierte Metadaten pro Chunk

**Status:** Offen
**Impact:** Mittel
**Aufwand:** Mittel

Aktuell speichern wir nur `chunkIndex` und `pageNumber`. Wenn wir Heading-Hierarchie (`h1 > h2 > h3`) und Dokumenttyp (Vorlesung, Uebung, Code-Beispiel) mitspeichern, kann der Retriever diese Metadaten als Filter oder Boost nutzen.

**Betroffene Dateien:** `src/lib/chunking.ts`, `prisma/schema/documents.prisma`

---

### 3. Code-Bloecke gesondert behandeln

**Status:** Offen
**Impact:** Mittel
**Aufwand:** Mittel

Jupyter-Notebooks und Markdown-Dateien enthalten Code-Zellen. Aktuell werden die einfach als Text gechunkt. Code-Chunks separat markieren und ggf. mit dem umgebenden Erklaerungstext als Kontext verknuepfen waere besser, weil Code-Embeddings sich semantisch anders verhalten.

**Betroffene Dateien:** `src/lib/chunking.ts`, `src/app/api/admin/import/route.ts`

---

## Such-Verbesserungen

### 4. Hybrid Search (BM25 + Vector)

**Status:** Offen
**Impact:** Sehr hoch
**Aufwand:** Mittel

Aktuell ist die Suche rein vektorbasiert. Keyword-Suche (BM25/Volltextsuche) faengt genau die Faelle ab, die Vektor-Suche schlecht kann: exakte Begriffe, Fachbegriffe, Formeln, Variablennamen.

**Umsetzung:** PostgreSQL hat `tsvector`/`tsquery` eingebaut. Eine `tsvector`-Spalte auf `DocumentChunk` hinzufuegen und dann beide Scores kombinieren (z.B. `0.7 * vector_score + 0.3 * bm25_score`).

**Sprachproblem:** `to_tsvector` braucht eine Sprach-Config fuer Stemming und Stoppwoerter. Da die Lernmaterialien gemischt sind (deutscher Fliesstext + englische Fachbegriffe wie "Backpropagation", "Loss Function"), gibt es drei Optionen:

- **Option A — `'simple'`:** Kein Stemming, keine Stoppwoerter, rein Exact-Match. Robust bei gemischten Sprachen, aber "Lernrate" findet nicht "Lernraten". Da die Vektor-Suche semantische Varianten abdeckt, ist das oft ausreichend.
- **Option B — Zwei `tsvector`-Spalten (empfohlen):** Je eine fuer Deutsch und Englisch, besten Score nehmen. Korrektes Stemming fuer beide Sprachen, mehr Speicher.
- **Option C — `'simple'` + Vektor als Kompromiss:** BM25 nur fuer exakte Treffer, Vektor-Suche faengt Synonyme/Plural ab. Einfachste Loesung.

```sql
-- Option B: Zwei Spalten
ALTER TABLE "DocumentChunk"
  ADD COLUMN tsv_de tsvector
    GENERATED ALWAYS AS (to_tsvector('german', content)) STORED,
  ADD COLUMN tsv_en tsvector
    GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

-- Abfrage: besten Score aus beiden nehmen
SELECT *,
  GREATEST(
    ts_rank(tsv_de, plainto_tsquery('german', $1)),
    ts_rank(tsv_en, plainto_tsquery('english', $1))
  ) as bm25_score
FROM "DocumentChunk"
WHERE tsv_de @@ plainto_tsquery('german', $1)
   OR tsv_en @@ plainto_tsquery('english', $1)
ORDER BY bm25_score DESC;
```

**Betroffene Dateien:** `prisma/schema/documents.prisma`, `src/data-access/documents.ts`, `src/lib/rag.ts`

---

### 5. Reranking mit Cross-Encoder

**Status:** Offen
**Impact:** Hoch
**Aufwand:** Mittel

Aktuell: Top-5 direkt aus der Vektor-Suche. Besser: Top-20 holen, dann mit einem Cross-Encoder (z.B. ein kleines Reranker-Modell in LM Studio) auf Top-5 reranken. Cross-Encoder sind deutlich praeziser als Bi-Encoder-Embeddings, weil sie Query und Chunk gemeinsam verarbeiten.

**Betroffene Dateien:** `src/lib/rag.ts`, `src/lib/llm.ts`

---

### 6. Query Expansion / HyDE

**Status:** Offen
**Impact:** Hoch
**Aufwand:** Mittel

Die User-Frage direkt als Embedding-Query zu nehmen ist oft suboptimal. HyDE (Hypothetical Document Embedding): Das LLM generiert erst eine hypothetische Antwort, diese wird embeddet, und damit wird gesucht. Das verbessert den Recall bei vagen Fragen deutlich.

**Betroffene Dateien:** `src/lib/rag.ts`, `src/lib/llm.ts`

---

### 7. Contextual Retrieval (Anthropic-Ansatz)

**Status:** Offen
**Impact:** Hoch
**Aufwand:** Mittel-Hoch

Jeder Chunk bekommt beim Erstellen einen kurzen kontextuellen Prefix vom LLM: *"Dieser Chunk stammt aus Kapitel X ueber Thema Y und behandelt..."*. Dieser Prefix wird mit-embeddet. Das loest das Problem, dass isolierte Chunks ohne Kontext schwer zuzuordnen sind.

**Betroffene Dateien:** `src/lib/chunking.ts`, `src/app/api/documents/route.ts`, `src/app/api/admin/import/route.ts`

---

## Quick Wins

### 8. Similarity-Threshold anpassen

**Status:** Offen
**Impact:** Mittel
**Aufwand:** Niedrig

Der aktuelle Threshold von `0.5` (bzw. Distance `0.8`) ist sehr permissiv. Chunks mit Similarity 0.2-0.5 sind oft irrelevant und verwirren das LLM. Ein hoeherer Threshold (z.B. `0.6`) plus dynamische Anpassung waere besser.

**Betroffene Dateien:** `src/lib/rag.ts`

---

### 9. Chunk-Overlap mit ganzen Saetzen

**Status:** Offen
**Impact:** Mittel
**Aufwand:** Niedrig

Der Overlap ist aktuell zeichenbasiert (`OVERLAP_CHARS = 240`), was Saetze mitten drin abschneiden kann. Besser: Die letzten N ganzen Saetze des vorherigen Chunks als Overlap nehmen.

**Betroffene Datei:** `src/lib/chunking.ts`

---

### 10. Deduplizierung der Ergebnisse

**Status:** Offen
**Impact:** Mittel
**Aufwand:** Niedrig

Wenn mehrere ueberlappende Chunks zurueckkommen, enthalten sie redundanten Text. Eine einfache Deduplizierung (z.B. Jaccard-Similarity > 0.7 → nur den mit hoeherem Score behalten) wuerde den Kontext fuer das LLM kompakter machen.

**Betroffene Dateien:** `src/lib/rag.ts`, `src/data-access/documents.ts`

---

## Embedding-Modell

Aktuell: `nomic-embed-text-v1.5` (768 Dim., EN-fokussiert)

Multilingual-Alternativen vergleichen: [MTEB Leaderboard (Hugging Face)](https://huggingface.co/spaces/mteb/leaderboard)

---

## Empfohlene Reihenfolge

1. **Hybrid Search** (4) - groesster einzelner Hebel
2. **Semantic Chunking** (1) - bessere Chunk-Qualitaet
3. **Contextual Retrieval** (7) - bessere Embeddings
4. **Reranking** (5) - praezisere Ergebnisse
5. **Satz-Overlap** (9) - Quick Win
6. **Threshold-Anpassung** (8) - Quick Win
7. **Deduplizierung** (10) - Quick Win
8. **Query Expansion / HyDE** (6) - bei Bedarf
9. **Strukturierte Metadaten** (2) - bei Bedarf
10. **Code-Bloecke** (3) - bei Bedarf
