# LAI Implementierungsplan

> Ergebnis des UX-Review-Teams (Feb 2025): Nutzerin Lisa, UX-Designer Max, Devils Advocate Sarah, NextJS-Experte Tom

---

## Ausgangslage

LAI ist eine funktional solide RAG-Lernplattform (Upload → Chat → Quiz). Die Architektur ist sauber, Streaming professionell, UI modern. Aber fuer den produktiven Einsatz als **Lernplattform** fehlen entscheidende Features.

### Die 5 groessten Luecken (teamuebergreifender Konsens)

| # | Problem | Wer hat's gefunden | Schwere |
|---|---------|---------------------|---------|
| 1 | **Kein Onboarding** — Neuer Nutzer landet im leeren Chat, keine Anleitung | Lisa, Max | Kritisch |
| 2 | **Keine Dokument-Organisation** — Flache Liste, keine Tags/Faecher/Ordner | Lisa, Max, Tom | Kritisch |
| 3 | **Kein Spaced Repetition / Flashcards** — Kern effektiven Lernens fehlt | Lisa, Max, Tom | Kritisch |
| 4 | **Keine Authentifizierung** — Alles offen, kein User-Modell | Sarah | Kritisch |
| 5 | **Embedding-Modell nicht multilingual** — nomic-embed schlecht fuer DE/ES | Sarah, Tom | Hoch |

---

## Phase 1: Quick Wins (1–2 Tage)

Minimaler Aufwand, maximaler Impact. Kein Schema-Change noetig.

### 1.1 CTA "Jetzt starten" → Dashboard statt Chat
- **Problem:** Landing Page Button fuehrt zu `/learn/chat` — leerer Chat ohne Material
- **Loesung:** Link zu `/learn` aendern (1 Zeile in `page.tsx`)
- **Impact:** Verhindert sofortigen Abbruch neuer Nutzer

### 1.2 Onboarding Empty State im Dashboard
- **Problem:** Dashboard zeigt nur "0" bei leeren Zaehlen
- **Loesung:** Bei 0 Dokumenten einen prominenten Onboarding-Block anzeigen:
  - Schritt 1: "Lade dein erstes Lernmaterial hoch" → Upload-Button
  - Schritt 2: "Stelle deine erste Frage" (ausgegraut bis Schritt 1 erledigt)
  - Schritt 3: "Teste dein Wissen" (ausgegraut bis Schritt 2 erledigt)
- **Datei:** `src/app/learn/page.tsx`

### 1.3 Chat-Einstiegsvorschlaege
- **Problem:** Leerer Chat-State sagt nur "Stelle eine Frage" — keine Inspiration
- **Loesung:** 3–4 klickbare Vorschlaege anzeigen:
  - "Fasse das Dokument zusammen"
  - "Erklaere die wichtigsten Konzepte"
  - "Erstelle mir eine Uebersicht"
  - "Was sind die Kernaussagen?"
- **Datei:** `src/components/ChatInterface.tsx`

### 1.4 alert()/confirm() durch Toast/AlertDialog ersetzen
- **Problem:** Native Browser-Dialoge wirken unprofessionell
- **Loesung:** Sonner Toasts (bereits als Dependency?) + shadcn AlertDialog
- **Dateien:** Alle Stellen mit `alert()` und `confirm()`

### 1.5 "Keine Quellen gefunden" Feedback im Chat
- **Problem:** Wenn RAG keine Chunks findet, bekommt der LLM "Kein relevanter Kontext" — aber der Nutzer sieht kein Signal
- **Loesung:** Wenn `contexts.length === 0`, im UI einen Hinweis-Banner anzeigen: "Keine passenden Quellen gefunden. Versuche eine andere Formulierung."
- **Dateien:** `src/lib/rag.ts`, `src/components/ChatInterface.tsx`

### 1.6 LLM Health-Check + spezifische Fehlermeldung
- **Problem:** Wenn Ollama nicht laeuft → generischer "Interner Serverfehler"
- **Loesung:** Health-Check beim App-Start oder bei erstem Request. Banner im Dashboard: "KI-Server nicht erreichbar — bitte Ollama starten."
- **Dateien:** `src/lib/llm.ts`, `src/app/learn/layout.tsx`

---

## Phase 2: Dokument-Organisation + UX (3–5 Tage)

### 2.1 Faecher/Tags-System

**Schema-Erweiterung (Prisma):**
```prisma
model Document {
  // ... bestehende Felder ...
  language  String?    // "de", "en", "es" — fuer BM25 Stemming + UI
  subject   String?    // "Spanisch", "Mathematik" — Hauptfach
  tags      String[]   // Freitext-Tags, z.B. ["Vokabeln", "Semester 3"]
}
```

**UI-Aenderungen:**
- Dokumenten-Seite: Filter-Chips oben ("Alle", "Spanisch", "Mathe", ...)
- Upload-Dialog: Optionales Fach + Tags Feld
- DocumentCard: Farbiger Tag-Chip
- Dashboard: Wissensstand gruppiert nach Fach
- Chat-Dokumentfilter: Gruppierung nach Fach

### 2.2 Sortierung + erweiterte Filter fuer Dokumente
- Sortierung nach: Datum, Name, Groesse, Letzter Aktivitaet
- Filter nach: Dateityp, Fach, Zeitraum
- **Datei:** `src/app/learn/documents/page.tsx`

### 2.3 Breadcrumbs im Header
- **Problem:** Header zeigt nur "LAI" — kein Kontext wo man ist
- **Loesung:** "LAI > Lernmaterial > Spanisch-Grundlagen.pdf"
- **Datei:** `src/app/learn/layout.tsx` oder eigene `Breadcrumb`-Komponente

### 2.4 Quiz-UX Verbesserungen
- "Ueberspringen"-Button bei Quiz-Fragen
- "Zurueck"-Button zu vorherigen Fragen
- "Abbrechen"-Button waehrend Quiz
- Quiz wiederholen (gleiche Fragen nochmal)
- **Dateien:** `src/components/QuizPlayer.tsx`, `src/components/QuizResults.tsx`

### 2.5 Multi-Dokument-Quiz
- **Problem:** Quiz nur pro Einzeldokument — zu einschraenkend
- **Loesung:** Dokumenten-Multiselect oder "Quiz ueber Fach X" (nutzt alle Docs mit subject="X")
- **Dateien:** `src/app/learn/quiz/page.tsx`, `src/app/api/quiz/generate/route.ts`

### 2.6 KI-Zusammenfassung pro Dokument
- Auf der Dokument-Detailseite: Button "Zusammenfassung generieren"
- LLM fasst die Chunks zusammen und speichert das Ergebnis (neues Feld `summary` auf Document)
- **Dateien:** `src/app/learn/documents/[id]/page.tsx`, neue API Route

---

## Phase 3: Lern-Engine — Spaced Repetition + Flashcards (5–7 Tage)

### 3.1 Spaced Repetition Algorithmus (SM-2)

**Neues Prisma-Modell:**
```prisma
model QuestionProgress {
  id             String    @id @default(cuid())
  questionId     String
  easeFactor     Float     @default(2.5)   // SM-2 Ease Factor
  interval       Int       @default(1)      // Tage bis naechste Review
  repetitions    Int       @default(0)
  nextReviewAt   DateTime
  lastReviewedAt DateTime?

  question QuizQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  @@unique([questionId])
  @@index([nextReviewAt])
}
```

**Implementierung:**
- `src/lib/spaced-repetition.ts` — SM-2 Algorithmus (~50 Zeilen)
- Nach jeder Quiz-Antwort: `QuestionProgress` aktualisieren
- Dashboard-Widget: "12 Fragen warten auf Wiederholung"
- Neue Seite/Mode: "Review-Queue" — zeigt faellige Fragen

### 3.2 Flashcards / Karteikarten

**Neues Prisma-Modell:**
```prisma
model Flashcard {
  id         String   @id @default(cuid())
  documentId String
  front      String   // Frage / Vokabel
  back       String   // Antwort / Uebersetzung
  context    String?  // Beispielsatz
  chunkId    String?  // Quell-Chunk
  createdAt  DateTime @default(now())

  document Document      @relation(fields: [documentId], references: [id], onDelete: Cascade)
  chunk    DocumentChunk? @relation(fields: [chunkId], references: [id])
  progress FlashcardProgress?
}

model FlashcardProgress {
  id             String    @id @default(cuid())
  flashcardId    String    @unique
  easeFactor     Float     @default(2.5)
  interval       Int       @default(1)
  repetitions    Int       @default(0)
  nextReviewAt   DateTime
  lastReviewedAt DateTime?

  flashcard Flashcard @relation(fields: [flashcardId], references: [id], onDelete: Cascade)
  @@index([nextReviewAt])
}
```

**Features:**
- KI-generierte Flashcards aus Dokument-Chunks ("Extrahiere Vokabeln / Kernbegriffe")
- Manuelle Flashcard-Erstellung
- Lern-Modus: Karte anzeigen → umdrehen → Bewerten (Kenne ich / Unsicher / Kenne ich nicht)
- Spaced Repetition auf Flashcard-Ebene
- **Ideal fuer Sprachenlernen:** Front = "el gato", Back = "die Katze", Context = "El gato duerme en el sofá"

### 3.3 Lernfortschritt-Dashboard
- Wissensstand pro Fach (Balkendiagramm)
- Trend ueber Zeit (Liniendiagramm — letzte 7/30 Tage)
- Faellige Reviews heute
- Schwache Themen identifizieren ("Du hast Schwierigkeiten mit Verbkonjugation")
- **Library-Empfehlung:** `recharts` (bereits React-basiert)

---

## Phase 4: RAG-Qualitaet + Performance (3–5 Tage)

### 4.1 Multilinguales Embedding-Modell
- Wechsel von `nomic-embed-text` zu `bge-m3` oder `multilingual-e5-large`
- `.env` Konfiguration anpassen
- Alle Dokumente re-embedden (Admin-Refresh existiert bereits)
- **Aufwand:** 1h Code + Rechenzeit fuer Re-Embedding

### 4.2 HNSW-Index auf Embedding-Spalte
```sql
CREATE INDEX idx_chunk_embedding_hnsw
  ON "DocumentChunk"
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```
- Vektor-Suche von O(n) auf O(log n)
- **Kritisch ab ~10.000 Chunks**

### 4.3 Batch-Embedding in Upload-Pipeline
- Statt einzelner Embedding-Requests: Array von Texten senden
- Upload 5–10x schneller bei grossen Dokumenten
- **Datei:** `src/app/api/documents/route.ts`, `src/lib/embeddings.ts`

### 4.4 Hybrid Search (BM25 + Vector)
```sql
ALTER TABLE "DocumentChunk"
  ADD COLUMN tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('german', content)) STORED;
CREATE INDEX idx_chunk_tsv ON "DocumentChunk" USING GIN (tsv);
```
- Kombinierter Score: `0.7 * vector_score + 0.3 * bm25_score`
- Besser fuer exakte Begriffe, Fachwoerter, Formeln
- **Dateien:** `src/lib/rag.ts`, `src/data-access/documents.ts`

### 4.5 Pagination + Lazy Loading
- `getDocuments(page, limit)` mit Cursor-based Pagination
- Sidebar: Sessions lazy nachladen
- Chat-Dokumentfilter: Virtualisierte Liste bei vielen Docs
- **Dateien:** `src/data-access/documents.ts`, `src/data-access/chat.ts`, `src/components/Sidebar.tsx`

### 4.6 Error Boundaries + Loading States
- `error.tsx` und `loading.tsx` in allen Route Segments
- Spezifische Fehlermeldungen statt generische 500er
- **Dateien:** Neue Dateien in jedem `app/learn/*/` Ordner

---

## Phase 5: Authentifizierung (Optional, 2–3 Tage)

### 5.1 User-Modell + NextAuth

**Schema:**
```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  image     String?
  createdAt DateTime @default(now())

  documents    Document[]
  chatSessions ChatSession[]
  quizzes      Quiz[]
}
```

**Implementierung:**
- NextAuth mit Credentials-Provider (oder GitHub/Google fuer SaaS)
- Middleware: `/learn/*` nur fuer eingeloggte User
- Alle Queries: `WHERE userId = currentUser.id`
- Landing Page bleibt oeffentlich

### 5.2 Personalisierung
- "Willkommen zurueck, Lisa!" auf Dashboard
- Lern-Streak pro User
- Benutzerdefinierte Einstellungen (Sprache, Schwierigkeitsgrad)

---

## Phase 6: Gamification + Engagement (Optional, 5–7 Tage)

### 6.1 Streak-System
- Taeglicher Login/Aktivitaet = Streak
- Dashboard: "5 Tage in Folge gelernt!"
- Motivation durch Streak-Verlust-Angst (Duolingo-Effekt)

### 6.2 XP + Achievements
- Chat-Frage = 5 XP, Quiz bestanden = 20 XP, Perfektes Quiz = 50 XP
- Badges: "Erstes Material", "10 Quizze", "7-Tage-Streak", "100 Flashcards"
- Level-System mit Fortschrittsbalken

### 6.3 Wiederholungs-Hinweise
- Dashboard: "Du hast 'Spanisch Vokabeln' vor 3 Tagen mit 60% bestanden — Zeit fuer Wiederholung?"
- Sortierung: "Am laengsten nicht geubt" zuerst
- Optional: Push-Benachrichtigungen (PWA)

---

## Zusammenfassung: Empfohlene Reihenfolge

```
Phase 1 (Quick Wins)          ██░░░░░░░░  1-2 Tage    → Sofort spuerbarer Impact
Phase 2 (Organisation + UX)   ████░░░░░░  3-5 Tage    → Plattform wird nutzbar fuer mehrere Faecher
Phase 3 (Lern-Engine)         ██████░░░░  5-7 Tage    → Das "Killer-Feature" — Spaced Repetition
Phase 4 (RAG + Performance)   ████░░░░░░  3-5 Tage    → Qualitaet + Skalierung
Phase 5 (Auth)                ███░░░░░░░  2-3 Tage    → Multi-User-Faehigkeit
Phase 6 (Gamification)        ██████░░░░  5-7 Tage    → Retention + Motivation
```

**Gesamtaufwand: ~20–30 Tage fuer alle Phasen**

Phase 1 + 2 sollten sofort umgesetzt werden — sie machen die Plattform fuer den taeglichen Einsatz nutzbar. Phase 3 (Spaced Repetition + Flashcards) ist das Feature, das LAI von einem "Chat mit PDFs" zu einer echten Lernplattform macht.

---

## Offene Fragen

1. **Zielgruppe:** Nur Eigennutzung oder auch fuer andere Studierende? (bestimmt ob Auth P0 oder P5 ist)
2. **Hosting:** Lokal (Ollama) oder Cloud-deployed? (bestimmt Background-Job-Strategie)
3. **Sprachfokus:** Primaer Deutsch oder multilingual? (bestimmt Embedding-Modell-Wahl)
4. **Offline:** Soll LAI als PWA offline funktionieren? (bestimmt Architektur-Entscheidungen)
