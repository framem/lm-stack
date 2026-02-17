# LAI Feature-Implementierungsplan

> Ergebnis des Experten-Workshops (UX-Designer, Devil's Advocate, NextJS-Experte, Nutzer-Interview)
> Datum: 2026-02-16
> Update: 2026-02-17 — Agenten-Panel-Review (UX/UI-Designer, Devil's Advocate, NextJS-Experte, Platform-User)

## Strategische Ausrichtung

**LAI bleibt ein dokumentenbasiertes Lerntool.** Der USP ist: Eigenes Material hochladen (Vorlesungsfolien, Lehrbuecher) und daraus personalisierte Uebungen generieren. Sprachlernen wird als Spezialfall unterstuetzt — nicht als eigener Kurs-Modus (kein Duolingo-Klon), aber mit **Starter-Paketen** fuer Nutzer ohne eigenes Material.

**Kern-Insights:**
- Die Plattform hat starke Einzeltools (Chat, Quiz, Karteikarten), aber es fehlt die intelligente Orchestrierung. Die Tools wissen nichts voneinander.
- Fuer Sprach-Anfaenger ohne eigenes Material braucht es kuratierte Einstiegsinhalte (Starter-Pakete pro Sprache/Level), die die bestehende Infrastruktur nutzen.
- Features NICHT streichen (Knowledge Map, Stats, 8 Fragetypen sind effizient implementiert), sondern priorisieren und besser verknuepfen.
- Audio via Web Speech API ist ein Quick Win ohne neue Dependencies.

---

## Phase 0: UX & Onboarding (aus Review 2026-02-17)

### Sprint 0 — Kritische UX-Verbesserungen

#### ~~0.1 Onboarding personalisieren~~ ✅
**Konsens: Alle 4 Experten — hoechste Prioritaet**
- Aufwand: S-M (2-3 Tage)
- Risiko: Niedrig

**Problem:** Neuer Nutzer landet auf leerem Dashboard. Onboarding-Wizard laedt generisches Beispiel-Dokument ueber Lernmethoden — fuer Sprachlerner oder Fachstudierende irrelevant. Kein "Aha-Moment" in den ersten 30 Sekunden.

**Loesung:**
- Onboarding fragt: "Was lernst du?" (Fach/Sprache auswaehlen)
- Starter-Pakete pro Sprache: Vorinstallierte A1-Vokabelsets (existieren bereits als `en-a1`, `es-a1`, `en-a2`, `es-a2` mit CEFR-Validierung) als ein-Klick-Import anbieten
- Fuer Fachstudierende: Fachspezifische Beispiel-Dokumente statt generischem "Lernmethoden"-Text
- Danach: Direkter CTA "Jetzt erstes Quiz starten" oder "Karteikarten lernen"

---

#### ~~0.2 Sidebar vereinfachen~~ ✅
**Konsens: UX-Designer + Platform-User — hohe Prioritaet**
- Aufwand: S (1-2 Tage)
- Risiko: Niedrig

**Problem:** 12 gleichwertige Menuepunkte in der Sidebar ueberfordern. Auf Mobile kaum nutzbar.

**Loesung:**
- Gruppierung in "Lernen" (Quiz, Karteikarten, Vokabeln, Konversation, Session) und "Verwalten" (Dokumente, Faecher, Statistiken)
- Knowledge Map und Lernpfad unter "Fortschritt" zusammenfassen
- Mobile: Breakpoint-Fixes (`sm:grid-cols-2 lg:grid-cols-4` statt `md:grid-cols-4`)
- `text-xs` (10px) durch `text-sm` (14px) ersetzen fuer Touch-Elemente

---

#### ~~0.3 Post-Upload CTA~~ ✅
- Aufwand: XS (0.5 Tage)
- Risiko: Niedrig

**Problem:** Nach Dokument-Upload landet der Nutzer auf der Dokument-Liste. Kein naechster Schritt vorgeschlagen.

**Loesung:** Nach erfolgreichem Upload automatisch fragen: "Dokument verarbeitet! Moechtest du jetzt ein Quiz erstellen oder Karteikarten generieren?"

---

#### ~~0.4 CEFR-Fortschritts-Tracker (Sprachlernen)~~ ✅
- Aufwand: M (2-3 Tage)
- Risiko: Niedrig

**Problem:** Kein uebergreifender CEFR-Tracker. Nutzer sieht nirgends "Du beherrschst 65% des A1-Wortschatzes".

**Loesung:**
- Neues Model `LearningGoal` (Zielsprache, CEFR-Level, Deadline)
- Fortschritts-Berechnung basierend auf Vocab-Coverage (CEFR-Referenzdaten existieren: Goethe A1/A2/B1) + Quiz-Performance
- CEFR-Fortschrittsring im Dashboard statt generischer Prozentbalken
- Quellen: Goethe-Institut Wortlisten via DWDS API (bereits eingebaut in `src/data/cefr-reference/`)

---

#### ~~0.5 Daily Practice Flow~~ ✅
- Aufwand: M (2-3 Tage)
- Risiko: Niedrig

**Problem:** Kein kuratiertes taegliches Lernformat. Nutzer muss selbst entscheiden, was er macht.

**Loesung:**
- Mini-Session: 2 faellige Vokabeln + 1 Quiz-Frage + 1 Konversations-Prompt
- "Heute 5 Minuten lernen"-Button auf dem Dashboard
- Nutzt bestehende SM-2-Daten fuer Priorisierung (faellige Wiederholungen zuerst)

---

#### ~~0.6 Erfolgs-Feedback und Mini-Gamification~~ ✅
- Aufwand: S-M (1-2 Tage)
- Risiko: Niedrig

**Problem:** Richtige Quiz-Antwort zeigt nur gruenen Badge "Richtig". Kein Belohnungsgefuehl. Streak allein reicht nicht fuer Motivation.

**Loesung:**
- Confetti/Animation bei richtigem Quiz-Ergebnis
- Meilenstein-Badges: "50 Vokabeln gelernt", "7-Tage-Streak", "Erstes A1-Quiz bestanden"
- Optional: XP-System (jede Aktivitaet gibt Punkte, sichtbar in Sidebar)

---

#### ~~0.7 Konversations-Feedback~~ ✅
- Aufwand: M (2-3 Tage)
- Risiko: Mittel

**Problem:** Nach Konversationsuebung kein strukturiertes Feedback. System-Prompt sagt sogar: "Korrigiere den Gast NICHT." Fuer Lernende kontraproduktiv.

**Loesung:**
- Nach jeder Session: Evaluation mit erkannten Grammatikfehlern, neuen Vokabeln, Score
- Evaluation-API existiert (`/api/chat/conversation/evaluate`) — ausfuehrlicheres Feedback generieren
- `language`-Feld auf `ChatSession` hinzufuegen fuer sprachspezifische Evaluation

---

### Sprint 0.5 — Technische Quick Wins (parallel)

#### ~~pgvector HNSW-Index~~ ✅
- Aufwand: XS (5 Minuten)
- **Kritisch fuer Performance bei wachsenden Datenmengen**

```sql
CREATE INDEX ON "DocumentChunk" USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
```

#### ~~Dashboard Caching~~ ✅
- Aufwand: S (1 Tag)
- Dashboard-Seite fuehrt 9 parallele DB-Queries bei jedem Seitenaufruf aus
- `next/cache` mit `revalidateTag` fuer Dashboard-Daten (Tags: `documents`, `quizzes`, `flashcards`)
- `React.cache()` fuer Request-Deduplizierung

#### ~~Error Boundaries pro Modul~~ ✅
- Aufwand: XS (wenige Stunden)
- `error.tsx` in `/learn/quiz/`, `/learn/chat/`, `/learn/flashcards/` etc.
- Freundliche Fehlermeldung wenn LLM nicht erreichbar

#### ~~Lazy Loading schwerer Komponenten~~ ✅
- Aufwand: XS (wenige Stunden)
- `next/dynamic` mit `ssr: false` fuer @xyflow/react (Knowledge Map)
- Reduziert Initial-Bundle um ~50KB+ gzipped

#### ~~Graceful Degradation ohne LLM~~ ✅
- Aufwand: S (0.5 Tage)
- Vocab-Quizze und Karteikarten-Review funktionieren ohne LLM (deterministische Generierung)
- UI klar zeigen, welche Features verfuegbar sind wenn LLM-Server nicht laeuft

#### ~~userId-Feld vorbereiten~~ ✅
- Aufwand: XS (1 Stunde)
- `userId String? @default("default")` auf Document, ChatSession, Quiz, Flashcard, UserStats
- Ermoeglicht spaetere Auth-Integration ohne Schema-Migration

---

## Phase 1: Bestehendes besser machen

### Sprint 1 — Quick Wins (parallel umsetzbar)

#### ~~1.1 Chat-Suche und Lesezeichen~~ ✅
**Konsens: Hoechste Prioritaet aller Experten**
- Aufwand: S (1-2 Tage)
- Risiko: Niedrig

**Problem:** Gute KI-Erklaerungen gehen im Chat-Verlauf verloren. Nutzerin scrollt ewig und findet nichts.

**Loesung:**
- `bookmarked: Boolean` Feld auf `ChatMessage` (Prisma-Migration)
- PostgreSQL Volltextsuche mit `to_tsvector`/`to_tsquery` auf `ChatMessage.content`
- Frontend: Suchleiste in Chat-Sidebar + Lesezeichen-Button pro Nachricht
- Ergebnisliste mit Kontext-Snippet und Link zurueck zur Chat-Session

**Technische Details:**
- Kein neues Model noetig, nur Feld-Erweiterung auf bestehendem `ChatMessage`
- PostgreSQL GIN-Index fuer performante Volltextsuche
- Client Component fuer Suchleiste, Server Action fuer Suche

---

#### ~~1.2 Pruefungsmodus mit Zeitlimit~~ ✅
**Konsens: Lisas Top 3, niedrigstes Risiko**
- Aufwand: S-M (2-3 Tage)
- Risiko: Niedrig

**Problem:** Keine Moeglichkeit, Klausur unter realistischen Bedingungen zu simulieren.

**Loesung:**
- Timer-Countdown-Komponente (Client-Side, kein Server noetig)
- Neuer Modus beim Quiz-Start: `examMode: Boolean`, `timeLimit: Number` (Minuten)
- Im Exam-Mode: Alle Fragen auf einer Seite, kein sofortiges Feedback, Auswertung erst nach Abgabe
- Optional: `timeSpent`-Feld auf `QuizAttempt` speichern

**Technische Details:**
- Quiz-Infrastruktur (`Quiz`, `QuizQuestion`, `QuizAttempt`) existiert komplett
- Kein LLM-Involvement, reine UI-Logik
- Erweiterung der bestehenden Quiz-Seite (`/learn/quiz/[id]`) um Exam-Modus

---

#### ~~1.3 Vokabeltrainer mit Kontext und Konjugation~~ ✅ (Bonus Quick Win)
- Aufwand: S (0.5-1 Tag)
- Risiko: Niedrig

**Problem:** Vokabeln ohne Beispielsaetze und Konjugation = stumpfes Auswendiglernen.

**Loesung:**
- Neues JSON-Feld `conjugation` auf `Flashcard` (fuer Verben)
- LLM-Prompt bei Flashcard-Generierung anpassen: Bei Verben automatisch Konjugationsformen mitgenerieren
- UI: Ausklappbare Konjugationstabelle unter Vokabelkarte bei `partOfSpeech === 'verb'`

**Technische Details:**
- `exampleSentence` und `context` existieren bereits auf Flashcard
- Nur Prompt-Anpassung in `/api/flashcards/generate` + kleine UI-Erweiterung

---

#### ~~1.4 TTS via Web Speech API~~ ✅ (Bonus Quick Win)
- Aufwand: S (wenige Stunden)
- Risiko: Niedrig

**Problem:** Sprachlernen ohne Audio ist wie eine Sprache nur lesen koennen.

**Loesung:**
- "Vorlesen"-Button neben jeder Vokabel im `VocabStudyContent`
- Browser-natives `speechSynthesis.speak()` mit `lang: "es-ES"` (oder passende Sprache)
- Keine Server-Infrastruktur noetig

**Einschraenkung:** Qualitaet variiert nach Browser/OS. Kein Ersatz fuer echtes Hoerverstaendnis-Training. Spaeter ggf. Upgrade auf Piper TTS.

---

### Sprint 2 — Adaptive Quiz-Schwierigkeit

#### ~~2.1 Adaptive Quiz-Schwierigkeit~~ ✅
**Konsens: Lisas #1, UX-Designer #1, alle Experten in Top 3**
- Aufwand: M (1-2 Wochen)
- Risiko: Mittel

**Problem:** Quiz-Fragen wiederholen sich auf gleichem Level. Kein Lernfortschritt spuerbar.

**Loesung:**
- Neues Feld `difficulty: Int` (1-5) auf `QuizQuestion`
- Schwierigkeits-Tracking: Aus bisherigen `QuizAttempts` die tatsaechliche Schwierigkeit berechnen (% korrekt)
- Quiz-Generierung anpassen: LLM-Prompt erhaelt gewuenschte Schwierigkeit ("Stelle eine Verstaendnisfrage" vs. "Stelle eine Detailfrage die Transferwissen erfordert")
- Automatische Hochstufung: Nach 2x korrekt auf gleichem Level -> naechstes Level
- Frontend: Schwierigkeits-Badge auf Fragen, optionale manuelle Schwierigkeitswahl

**Technische Details:**
- Baut auf bestehendem `QuestionProgress` (easeFactor, interval, repetitions) auf
- 3 klar definierte Stufen: Grundwissen -> Verstaendnis -> Transfer/Anwendung
- Cold-Start: Erste Fragen auf Stufe 1, danach adaptiv
- LLM-Prompt-Templates pro Schwierigkeitsstufe

**Abhaengigkeit:** Keine harte Abhaengigkeit, aber profitiert von Nutzungsdaten aus Sprint 1.

---

### Sprint 3 — Neue Uebungstypen

#### ~~3.1 Grammatikuebungen und erweiterte Fragetypen~~ ✅
**Strategie-relevant: Kern der "Ergaenzungs"-Positionierung fuer Sprachlernen**
- Aufwand: M-L (2-3 Wochen)
- Risiko: Mittel

**Problem:** Nur Karteikarten und MC-Quiz. Fuer Sprachlernen und technische Faecher zu wenig Uebungsvielfalt.

**Neue Fragetypen:**
1. **Lueckentext (fillInBlanks):** LLM generiert Satz mit `___`-Platzhaltern + korrekte Antworten. Funktioniert fuer Sprache UND Fachlernen ("Die dritte Normalform erfordert, dass alle Attribute ___-abhaengig vom Primaerschluessel sind").
2. **Konjugation (conjugation):** Tabelle mit Verb + Person -> User fuellt Form aus. Primaer fuer Sprachlernen.
3. **Satzordnung (sentenceOrder):** Woerter durcheinander -> User ordnet per Drag&Drop. Library: `@dnd-kit/core`.

**Technische Details:**
- Erweiterung des Quiz-Enums um neue Typen
- Neue UI-Komponenten pro Fragetyp (Client Components)
- SSE-basierte Generierung erweitern (bestehender `/api/quiz/generate`)
- LLM-Prompt-Templates pro Fragetyp
- Validierung: Antwort-Matching mit Toleranz (Gross/Kleinschreibung, Akzente)

**Risiko:** LLM muss grammatikalisch korrekte Uebungen generieren. Bei lokalen 7B-Models fehleranfaellig -> 13B+ empfohlen. Robuste Fehlerbehandlung noetig.

---

### Sprint 4 — Zeitbasierter Lernplan

#### ~~4.1 Zeitbasierter Lernplan mit Pruefungstermin~~ ✅
**Lisas wichtigstes Einzelfeature**
- Aufwand: M-L (2-3 Wochen)
- Risiko: Mittel

**Problem:** Ohne Plan lernt die Nutzerin planlos und hat staendig schlechtes Gewissen.

**Loesung:**
- Neues Model `StudyPlan`: Relation zu Documents, Zieldatum, Status
- Neues Model `StudyTask`: Tagesaufgaben (Typ: Quiz/Karteikarten/Lesen), Relation zu Document/Topic
- LLM analysiert Document-Inhalte -> identifiziert Themen/Kapitel
- Algorithmus verteilt Themen ueber verfuegbare Tage bis Klausur
- Wiederholungszyklen basierend auf `QuestionProgress` (Spaced Repetition existiert schon)
- Dashboard-Integration: "Heute: Normalformen (Quiz + Karteikarten), Morgen: SQL-Joins"

**Technische Details:**
- Schema-Migration: `StudyPlan` + `StudyTask` mit Relationen
- Server Action: `createStudyPlan(documentIds, examDate)` -> LLM-basierte Themenextraktion -> Verteilungsalgorithmus
- Neue Seite: `/learn/plan` mit Tagesansicht und Gesamtfortschritt
- Anbindung an bestehende `UserStats` (dailyGoal, currentStreak)

**Abhaengigkeiten:** Profitiert stark von Sprint 2 (adaptive Schwierigkeit -> Performance-Daten) und Sprint 1.2 (Pruefungsmodus -> Pruefungssimulation im Plan einplanbar).

---

## Phase 2: Neue Faehigkeiten (nach Phase 1)

### ~~2.1 KI-Konversationsuebungen / Rollenspiele~~ ✅
- ~~Aufwand: M~~
- ~~Neuer Chat-Modus `conversation` mit Szenario-System-Prompt~~
- ~~Szenario-Auswahl: Restaurant, Arztbesuch, Wegbeschreibung...~~
- ~~KI bewertet am Ende Grammatik, Wortschatz, Kommunikation~~
- ~~**Voraussetzung:** Validierung mit 13B+ Model (7B zu fehleranfaellig)~~

### ~~2.2 Wissenslandkarte / Kompetenz-Dashboard~~ ✅
- ~~Aufwand: M-L~~
- ~~LLM extrahiert Themen/Konzepte -> neues Model `Topic`~~
- ~~Wissensstand pro Topic aus QuizAttempts + FlashcardProgress~~
- ~~Radar-Chart oder Treemap-Visualisierung~~
- ~~Pro Thema: Beherrscht / Teilweise / Luecke~~

### ~~2.3 Auto-Inhaltsverzeichnis~~ ✅
- ~~Aufwand: S-M~~
- ~~LLM-basierte oder Heuristik-basierte Kapitelextraktion~~
- ~~Klickbare Navigation im Document-Viewer~~
- ~~Grundlage fuer verbesserten Lernplan~~

### ~~2.4 Einstufungstest (Sprachlernen)~~ ✅
- Aufwand: M
- Vorgefertigter Fragenpool pro CEFR-Level (seeded)
- Adaptive Logik: Binaere Suche ueber Niveaus
- **Voraussetzung:** Niveausystem / Lektionsstruktur

### 2.5 Lokales TTS (Upgrade von Web Speech API)
- Aufwand: L
- Piper TTS / Coqui TTS als Docker-Container
- Hoehere Audio-Qualitaet fuer Sprachlernen
- Vorgelesene Saetze, Diktate, Hoerverstaendnis

---

## Phase 3: Plattform-Erweiterungen (langfristig)

### 3.3 Interaktive Schritt-fuer-Schritt-Uebungen
- Aufwand: L
- Multi-Step-Aufgaben mit progressiven Hinweisen
- Neues Model `Exercise` mit `steps` (JSON-Array)

### 3.4 Grafische Visualisierungen (ER-Diagramme etc.)
- Aufwand: L-XL
- Mermaid.js-basiertes Rendering als erster Schritt
- LLM generiert Mermaid-Code aus Dokument-Inhalt
- Risiko: Lokale LLMs erzeugen oft fehlerhaften Mermaid-Code

---

## Sprint-Uebersicht

```
Sprint 0 (Woche 0-1):     Onboarding | Sidebar | Post-Upload CTA | CEFR-Tracker | Daily Practice
Sprint 0.5 (parallel):    HNSW-Index | Dashboard-Cache | Error Boundaries | Lazy Loading | userId
Sprint 1 (Woche 2-3):     Chat-Suche | Pruefungsmodus | Vokabel-Kontext + TTS
Sprint 2 (Woche 4-5):     Adaptive Quiz-Schwierigkeit
Sprint 3 (Woche 6-8):     Neue Uebungstypen (Lueckentext, Konjugation, Satzordnung)
Sprint 4 (Woche 9-11):    Zeitbasierter Lernplan
--- Phase 1 abgeschlossen ---
Phase 2 (Woche 12+):      ✅ KI-Konversation, ✅ Wissenslandkarte, ✅ Inhaltsverzeichnis...
Phase 3 (spaeter):         User-System, Sharing, Schritt-fuer-Schritt, Visualisierungen
```

## Entscheidungs-Log

| Entscheidung | Begruendung |
|---|---|
| Kein eigener Sprachlern-Modus | LAI ist dokumentenbasiert, Sprachlernen als Spezialfall. Nutzerin bestaetigt: "Ergaenzung, nicht Ersatz fuer Duolingo" |
| Starter-Pakete statt Kurs-Engine | Kuratierte Einstiegsinhalte nutzen bestehende Infrastruktur. Kein Duolingo-Klon, aber kein leeres Dashboard fuer Anfaenger (Konsens aller 4 Experten, Review 2026-02-17) |
| Features nicht streichen | Knowledge Map, Stats, 8 Fragetypen sind duenn und effizient implementiert (~200-500 Zeilen). Streichen spart kaum Aufwand, zerstoert aber Funktionalitaet (NextJS-Experte, Review 2026-02-17) |
| Content-Sharing nicht in Phase 1 | Kein User-System vorhanden, XL-Aufwand, Nutzerin: "Nice-to-have, nicht existenziell" |
| Web Speech API statt lokales TTS | Null Infrastruktur-Aufwand, sofort einsetzbar. Qualitaet akzeptabel fuer MVP. STT (Spracheingabe) nicht priorisieren — zu unzuverlaessig fuer Anfaenger mit Akzent (Devil's Advocate, Review 2026-02-17) |
| Auth spaeter, userId jetzt vorbereiten | Lern-Flow-Verbesserung hat direkten Impact auf Retention, Auth hat null Impact. Aber `userId @default("default")` jetzt setzen fuer spaetere Migration (Konsens aller 4 Experten, Review 2026-02-17) |
| Einstufungstest mit Fragenpool statt LLM | Konsistenz und Zuverlaessigkeit wichtiger als Flexibilitaet |
| Adaptive Schwierigkeit: 3 Stufen statt KI-Tutoring | Klar abgegrenzt, messbar, kein Over-Engineering |
| Grammatikuebungen: 13B+ Model empfohlen | 7B-Models zu fehleranfaellig bei Sprach-Grammatik |
| LernpfadGenerator durch Heuristik ersetzen | LLM-basierte Lernempfehlung mit 8B-Model unzuverlaessig. Einfache Heuristik (faellige Wiederholungen > schwache Dokumente > neue Dokumente) ist schneller und deterministisch (Devil's Advocate, Review 2026-02-17) |
