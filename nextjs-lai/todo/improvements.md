# Vokabeltrainer — Verbesserungsplan

## 1. IST-Analyse

Der Vokabeltrainer ist bereits solide aufgestellt:

| Feature | Status |
|---|---|
| Flip-Modus (3D-Animation) | ✅ |
| Tipp-Modus (Levenshtein-Similarity) | ✅ |
| SM-2 Spaced Repetition | ✅ |
| TTS (Web Speech API) | ✅ |
| Konjugationstabellen | ✅ |
| 10 Quiz-Fragetypen | ✅ |
| Statistische Übersicht | ✅ |
| Richtungs-Toggle (bidirektional) | ✅ |
| KI-gestützte Flashcard-Generierung | ✅ |
| Sprachsets: EN/ES A1/A2 | ✅ |

---

## 2. Konkurrenzanalyse

### Vergleichsmatrix

| Dimension | Anki | Quizlet | Duolingo | Memrise | Brainscape | **LAI** |
|---|---|---|---|---|---|---|
| **Algorithmus** | FSRS (State-of-Art) | Memory Score | Birdbrain (ML) | Proprietary | CBR (1-5) | **SM-2** |
| **KI/LLM** | Keine | Magic Notes | GPT-4 (Roleplay) | GPT-3 Chat | Keine | **Flashcard-Gen** |
| **Gamification** | Minimal | Moderat | Branchenführend | Leicht | Leicht | **Keine** |
| **Custom Content** | Voll | Voll | Keine | Begrenzt | Voll | **Voll** |
| **Multi-Modal** | Text/Bild/Audio | Text/Bild/Audio | Sprechen/Hören/Lesen | Video-Clips | Nur Text | **Text + TTS** |
| **Analytics** | Sehr detailliert | Basis | XP/Streak | Basis | Confidence | **Basis** |
| **Kontext-Lernen** | Keine | Keine | Szenario-basiert | Konversation | Keine | **Beispielsätze** |

### LAIs Stärken gegenüber Konkurrenz

- **KI-Integration:** LLM für Flashcard-Generierung aus Dokumenten — kein Konkurrent bietet das so nahtlos
- **RAG-Kontext:** Vokabeln aus eigenem Lernmaterial extrahiert und verknüpft
- **Custom Content:** Flexibel wie Anki, aber mit moderner UX

### LAIs Lücken

1. **Kein FSRS** — SM-2 ist 30+ Jahre alt, FSRS braucht ~30% weniger Reviews bei gleicher Retention
2. **Keine Gamification** — Kein Streak, keine XP, keine Motivation-Loops
3. **Kein LLM-Kontext-Lernen** — Keine KI-generierten Erklärungen, Mnemonics, Fehler-Erklärungen
4. **Keine Spracheingabe** — TTS existiert, aber kein Speech-to-Text für Aussprache-Training
5. **Keine Lese-Integration** — Vokabeln werden nicht aus Lesetexten markiert/extrahiert
6. **Begrenzte Analytics** — Keine Retention-Kurven, Heatmaps, Vorhersagen

### Strategische Positionierung (USP)

> **FSRS + LLM + RAG + Custom Content** in einer Plattform — das gibt es nirgends.

- Anki hat FSRS, aber keine KI und veraltete UX
- Duolingo hat KI, aber kein Custom Content und keinen FSRS
- Quizlet hat Content, aber schwache SRS und hat KI-Tutor eingestellt

---

## 3. Verbesserungsvorschläge (priorisiert)

### Priorität 1 — High Impact, Moderate Effort

#### 1.1 FSRS-Algorithmus (statt SM-2)

**Was:** SM-2 durch FSRS (Free Spaced Repetition Scheduler) ersetzen
**Warum:** FSRS nutzt ML auf Basis von 700M+ Reviews, ~30% weniger Wiederholungen bei gleicher Retention. Anki hat 2023 umgestellt.

**Datenmodell-Änderung:**
```
FlashcardProgress:
  + difficulty      Float   (FSRS-Parameter)
  + stability       Float   (Gedächtnisstabilität)
  + retrievability   Float   (aktuelle Abrufwahrscheinlichkeit)
  ~ easeFactor      → entfällt (durch difficulty/stability ersetzt)
```

**Betroffene Dateien:**
- `src/lib/spaced-repetition.ts` — Algorithmus umschreiben
- `prisma/schema/flashcard.prisma` — DB-Migration
- `src/actions/flashcards.ts` — Review-Logik anpassen
- `vocab-study-content.tsx` — Rating-Buttons (Again/Hard/Good/Easy statt 1/3/5)

**Aufwand:** ~2-3 Tage

#### 1.2 Gamification-System

**Was:** Streaks, XP, Tagesziele, Fortschritts-Badges

**Komponenten:**
- **Daily Streak** — Tagessträhne mit Freeze-Option
- **XP-System** — Punkte pro Karte (gewichtet nach Schwierigkeit)
- **Tagesziel** — Konfigurierbares Lernziel (z.B. 20 Karten/Tag)
- **Badges/Meilensteine** — "100 Vokabeln gelernt", "7-Tage-Streak", "Meister in Spanisch A1"
- **Fortschrittsleiste** pro Sprachset

**Betroffene Dateien:**
- Neues Prisma-Schema `UserProgress` (streak, xp, badges, dailyGoal)
- `src/actions/gamification.ts` — Server Actions
- `vocab-content.tsx` — Streak-Anzeige, XP-Bar, Tagesziel
- Neue Komponenten: `StreakBadge`, `XPBar`, `DailyGoalWidget`, `BadgeOverview`

**Aufwand:** ~3-4 Tage

#### 1.3 LLM-gestütztes Kontext-Lernen

**Was:** KI generiert dynamische Lernhilfen beim Üben

**Features:**
- **Kontext-Sätze on-demand** — "Zeig mir 3 weitere Beispielsätze mit diesem Wort"
- **Eselsbrücken/Mnemonics** — KI generiert Merksprüche
- **Wort-Erklärung** — Etymologie, verwandte Wörter, Falsche Freunde
- **Fehler-Erklärung** — "Warum war meine Antwort falsch?" (à la Duolingo "Explain My Answer")

**Betroffene Dateien:**
- `src/actions/vocab-ai.ts` — Neue Server Actions für KI-Features
- `vocab-study-content.tsx` — UI für Kontext-Buttons
- LLM-Integration existiert bereits, nur neue Prompts + UI nötig

**Aufwand:** ~2-3 Tage

---

### Priorität 2 — High Impact, Higher Effort

#### 2.1 Sprech-Modus (Speech-to-Text)

**Was:** Neuer Lernmodus — Nutzer spricht die Vokabel aus
**Technik:** Web Speech Recognition API (`SpeechRecognition`)
**Flow:** Karte zeigt deutsches Wort → Nutzer spricht Fremdsprache → STT prüft → Feedback

**Aufwand:** ~2-3 Tage

#### 2.2 Vokabel-Extraktion aus Lesetexten

**Was:** Beim Lesen von Dokumenten unbekannte Wörter markieren → automatisch als Vokabelkarte erstellen

**Flow:**
1. Nutzer liest Dokument in LAI
2. Markiert unbekanntes Wort (Highlight/Rechtsklick)
3. LLM generiert: Übersetzung, Beispielsatz, Wortart, Konjugation
4. Karte wird dem Vokabel-Deck hinzugefügt

**Aufwand:** ~3-4 Tage

#### 2.3 Erweiterte Analytics

**Was:** Detaillierte Lernstatistiken

**Features:**
- **Retention-Kurve** — Vergessenskurve pro Karte/Set
- **Review-Heatmap** — GitHub-Style Aktivitäts-Kalender
- **Vorhersage** — "Morgen sind X Karten fällig"
- **Schwierige Wörter** — Top 10 häufig falsche Karten
- **Lernzeit-Tracking** — Minuten/Tag, Wochendurchschnitt

**Aufwand:** ~3-4 Tage

---

### Priorität 3 — Nice-to-Have

#### 3.1 Weitere Sprachen

- Französisch, Italienisch, Portugiesisch (A1/A2)
- TTS-Mapping existiert bereits im Code
- **Aufwand:** ~1-2 Tage pro Sprache (Datensatz erstellen/kuratieren)

#### 3.2 Bilder-Modus

- KI-generierte Bilder zu Vokabeln (via DALL-E / Stable Diffusion)
- Visuelles Lernen verstärkt Gedächtnis signifikant
- **Aufwand:** ~2-3 Tage

#### 3.3 KI-Konversationspartner

- Freies Gespräch mit KI, die gezielt gelernte Vokabeln einbaut
- Ähnlich Duolingo Roleplay / Memrise AI Partner
- **Aufwand:** ~3-5 Tage

#### 3.4 Import/Export

- Anki (.apkg) Import
- CSV Import/Export
- **Aufwand:** ~2 Tage

---

## 4. Implementierungsplan

### Phase 1: Kern-Verbesserungen (Woche 1-2)

| Tag | Task | Dateien |
|---|---|---|
| 1-2 | **FSRS implementieren** — `spaced-repetition.ts` umschreiben, DB-Migration (difficulty, stability, retrievability) | `src/lib/spaced-repetition.ts`, `prisma/schema/flashcard.prisma`, `src/actions/flashcards.ts` |
| 3 | **FSRS-Rating UI** — Bewertungs-Buttons anpassen (Again/Hard/Good/Easy) | `vocab-study-content.tsx` |
| 4-5 | **Gamification DB & Logik** — Schema `UserProgress`, Server Actions | Neues Prisma-Schema, `src/actions/gamification.ts` |
| 6-7 | **Gamification UI** — Streak, XP-Bar, Tagesziel, Badges | `vocab-content.tsx`, neue Komponenten |
| 8-9 | **LLM Kontext-Features** — Mnemonics, Fehler-Erklärung, Zusatz-Beispielsätze | `src/actions/vocab-ai.ts`, `vocab-study-content.tsx` |
| 10 | **Testing & Polish** — E2E-Tests, Performance, Edge Cases | Tests |

### Phase 2: Erweiterte Features (Woche 3-4)

| Tag | Task |
|---|---|
| 11-12 | **Sprech-Modus** — SpeechRecognition API, neuer Lernmodus |
| 13-14 | **Vokabel-Extraktion** — Wort-Markierung in Dokumenten, Auto-Kartenerstellung |
| 15-17 | **Erweiterte Analytics** — Heatmap, Retention-Kurven, Vorhersagen |
| 18-19 | **Neue Sprachen** — FR A1, IT A1 Datensätze |
| 20 | **Integration Testing & Release** |

### Phase 3: Innovation (Woche 5+)

| Task | Beschreibung |
|---|---|
| KI-Konversationspartner | Chat-basiertes Vokabel-Training mit Szenarios |
| Bilder-Modus | KI-generierte Illustrationen für Vokabeln |
| Import/Export | Anki-Kompatibilität (.apkg), CSV |
