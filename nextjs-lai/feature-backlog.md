# Feature-Backlog: nextjs-LAI

> Erstellt am 17.02.2026 durch Agenten-Team-Analyse (UX/UI-Designer, Devils Advocate, Next.js-Experte, Lerner-Persona "Maria")
> **Letzte Aktualisierung:** 17.02.2026 — Tasks #5, #6 und #9 abgeschlossen (11/18 erledigt, 61%)

---

## Analysierte User Journeys

### Journey 1: Spanisch A1 erreichen
1. Einstieg & Ziel festlegen → 2. Vokabeln lernen → 3. Konversation üben → 4. Fortschritt prüfen → 5. Weiterkommen

### Journey 2: Eigenes Material hochladen
1. Texte/PDFs hochladen → 2. Fragen stellen (RAG-Chat) → 3. Quiz/Karteikarten generieren → 4. Wiederholen & vertiefen

---

## Konsens-Themen (von 3+ Agenten unabhängig identifiziert)

**1. Kein Sprachlern-Einstieg** — UX-Designer, Maria, Devils Advocate
> Die Plattform ist auf Dokument-Upload optimiert. Ein Nutzer der "Spanisch A1 lernen" will, findet keinen dedizierten Einstieg. Onboarding zeigt nur den Dokument-Pfad.

**2. Konversations-Evaluationen gehen verloren** — Devils Advocate, NextJS-Experte, UX-Designer, Maria
> Scores (Grammatik/Wortschatz/Kommunikation) werden nur im React-State gehalten. Kein DB-Modell, keine Persistierung, keine Einbindung in Statistiken.

**3. Kein CEFR-Fortschritts-Tracking** — Alle 4
> Trotz 3.300+ CEFR-Referenzwörtern in der DB gibt es nirgends "Du kannst 127/400 A1-Wörter". Kein Sprachfortschritt sichtbar.

**4. Konversations-UI wechselt Sprache** — Maria
> Szenario-Beschreibungen wechseln auf die Zielsprache — Anfänger verstehen die Beschreibung dann nicht mehr.

---

## Offene Features (7/18)

| # | Status | Feature | Vorgeschlagen von | Priorität | Aufwand | Journey |
|---|--------|---------|-------------------|-----------|---------|---------|
| 2 | ✅ | ~~**Konversations-Evaluationen persistieren** — Neues DB-Modell `ConversationEvaluation`, Scores speichern, in Statistiken einfließen~~ | DA, NJS, UX | **Must-have** | Mittel | J1 |
| 4 | ✅ | ~~**Szenario-Beschreibungen auf Deutsch halten** — Nur Gespräch in Zielsprache, UI-Texte bleiben Deutsch~~ | Maria | **Must-have** | Klein | J1 |
| 5 | ✅ | ~~**"Jetzt lernen"-Block auf Dokumentendetailseite** — 3 Buttons: Quiz, Karteikarten, Chat (Dokument vorausgewählt)~~ | UX, Maria | **Must-have** | Klein | J2 |
| 6 | ✅ | ~~**Karteikarten editierbar machen** — Löschen und Editieren von Karteikarten~~ | DA | **Must-have** | Klein | J2 |
| 7 | ✅ | ~~**Health-Check aus Layout entfernen** — Client-Polling statt blockierendem `await` im Layout~~ | NJS | **Sollte** | Klein | Beide |
| 8 | ✅ | ~~**Dashboard vereinfachen** — TodayLearning + NextStep zusammenfassen, Stat-Cards kompakter, Quick Actions kontextbasiert~~ | UX, DA | **Sollte** | Klein | Beide |
| 9 | ✅ | ~~**Qualitätsfeedback nach Dokument-Upload** — "X Abschnitte erkannt, Ø Y Wörter pro Abschnitt"~~ | DA | **Sollte** | Klein | J2 |
| 10 | ❌ | **Sprachfilter für Vokabeln/Quiz** — Filter-UI wenn EN + ES importiert sind | NJS | **Sollte** | Klein | J1 |
| 11 | ❌ | **Documents-Seite → Server Component** — `searchParams`-basiert statt Client-seitigem `useEffect` | NJS | **Sollte** | Mittel | J2 |
| 12 | ✅ | ~~**Navigation konsolidieren** — Wissenslandkarte + Lernpfad + Statistiken zusammenführen~~ | DA, UX | **Sollte** | Mittel | Beide |
| 13 | ❌ | **Szenario-Fortschritt persistent speichern** — Badge "geübt/nicht geübt", bester Score pro Szenario | UX, Maria | **Sollte** | Mittel | J1 |
| 14 | ❌ | **Embedding-Recovery** — Button "Embeddings regenerieren" für Dokumente ohne Embeddings | NJS | **Nice-to-have** | Klein | J2 |
| 15 | ❌ | **Mobile Bottom-Tab-Navigation** — Top 4 Items als Tab-Bar auf Smartphone | UX | **Nice-to-have** | Mittel | Beide |
| 16 | ❌ | **Karteikarten ohne Dokument-Zuordnung** — Freie manuelle Karten erlauben | Maria | **Nice-to-have** | Klein | J2 |
| 17 | ❌ | **Mehr/dynamische Konversationsszenarien** — KI-generierte Szenarien statt nur 6 statische | DA | **Nice-to-have** | Groß | J1 |
| 18 | ❌ | **Strukturierter Lernpfad für Sprachen** — Automatische A1→A2→B1 Progression | DA, Maria | **Nice-to-have** | Groß | J1 |

**Legende:** DA = Devils Advocate, UX = UX-Designer, NJS = Next.js-Experte, Maria = Lerner-Persona, J1 = Journey 1, J2 = Journey 2

---

## Implementierungs-Status

**✅ Abgeschlossen (11/18):**
- ~~#1 Sprachlern-Onboarding~~ (`OnboardingWizard.tsx`)
- ~~#2 Konversations-Evaluationen persistieren~~ (DB-Modell, API, Stats-Integration)
- ~~#3 CEFR-Fortschrittsanzeige~~ (`CefrProgressRing.tsx`, Dashboard)
- ~~#4 Szenario-Beschreibungen auf Deutsch~~ (Bug-Fix: nur Gespräch wechselt Sprache)
- ~~#5 "Jetzt lernen"-Block~~ (Prominenter Aktionsblock mit 3 großen Buttons auf Dokumentendetailseite)
- ~~#6 Karteikarten editierbar~~ (Löschen und Editieren vollständig implementiert)
- ~~#7 Health-Check aus Layout~~ (Client-Polling via `/api/health`, kein Blocking mehr)
- ~~#8 Dashboard vereinfachen~~ (TodayActionWidget kombiniert, Stat-Badges kompakt, Quick Actions kontextbasiert)
- ~~#9 Qualitätsfeedback nach Upload~~ (Metriken-Panel mit Abschnitte/Wörter/Tokens)
- ~~#12 Navigation konsolidieren~~ (Neue `/learn/progress`-Seite mit Tabs, Redirects von alten URLs)

**⚠️ Teilweise umgesetzt (0/18):**
- (keine)

**❌ Noch komplett offen (7/18):**
- **Quick Wins:** #10, #14
- **Größere Features:** #11, #13, #15-18

## Quick Wins (Klein + Must-have/Sollte)

~~Features #4, #5, #6, #7, #8, #9, #10 sind mit geringem Aufwand umsetzbar und haben sofortigen Impact.~~

**✅ Erledigt:** #4 (Szenario-Beschreibungen), #5 ("Jetzt lernen"-Block), #7 (Health-Check), #9 (Upload-Qualitätsfeedback)

**Noch offen mit geringem Aufwand:**
- #10 Sprachfilter
- #14 Embedding-Recovery-Button

---

## Detail-Analysen der Agenten

### UX/UI-Designer

#### Journey 1: Spanisch A1

- **Kein sprachspezifischer Einstiegspunkt:** Dashboard und Onboarding sind komplett auf Dokument-Upload ausgerichtet. Kein "Welche Sprache möchtest du lernen?"-Flow.
  - *Lösung:* Zweiter Onboarding-Pfad "Sprache lernen" im Wizard als Auswahl.
- **Fehlende Fortschrittsanzeige für Sprachziele:** Statistikseite zeigt generische Charts, keine sprachspezifische Ansicht.
  - *Lösung:* Horizontaler Fortschrittsbalken pro CEFR-Niveau mit Aufschlüsselung.
- **Konversationsübungen ohne Fortschrittsspeicherung:** Kein Verlauf, kein Score-Tracking, kein "schon gemacht"-Badge.
  - *Lösung:* Status-Badge auf Szenario-Karten, bester Score persistent speichern.

#### Journey 2: Material hochladen

- **Kein "Aus diesem Dokument lernen"-Einstieg:** Nach Upload landet Nutzer auf Dokumentenliste ohne prominenten Lern-CTA.
  - *Lösung:* Aktionsblock auf Dokumentendetailseite: Quiz / Karteikarten / Chat Buttons.
- **Dashboard-Informationsdichte:** 8-9 Sections mit flacher visueller Hierarchie.
  - *Lösung:* TodayLearning + NextStep zusammenfassen, Stat-Cards als kompakte Badges.
- **Fehlende Suche im Dokumenten-Picker:** Chat/Quiz-Dokumentenauswahl hat kein Suchfeld.
  - *Lösung:* Suchfeld im Popover analog zur Documents-Page.

#### Übergreifend

- **Positiv:** Konsistentes shadcn/ui Design, gutes Onboarding, Dark Mode durchgängig, LLM-Health-Banner nützlich
- **Mobile:** Sidebar mit 10+ Einträgen auf kleinen Bildschirmen problematisch → Bottom-Tab-Bar empfohlen
- **Barrierefreiheit:** Szenario-Karten ohne `role="button"`, Subject-Chips ohne `aria-pressed`
- **Loading States:** Skeleton-Loader nur auf Documents-Page, Rest nur Spinner

---

### Devils Advocate

#### Journey 1: Spanisch A1

- **Kein roter Faden:** Plattform ist Werkzeugkasten ohne Bauanleitung. Vokabel-Sets, Szenarien, CEFR-Daten existieren, aber nichts verbindet sie.
- **6 statische Szenarien und dann?** Keine benutzerdefinierten Szenarien, Evaluationen nicht gespeichert, kein Wiederholwert.
- **Vokabeltrainer isoliert:** Kuratierte Sets müssen über Admin importiert werden. CEFR-Fortschrittsanzeige fehlt trotz vorhandener Daten.

#### Journey 2: Material hochladen

- **Kein Upload-Qualitätsfeedback:** Nutzer merkt schlechtes Parsing erst wenn Chat Unsinn antwortet.
- **Quiz/Karteikarten nicht editierbar:** Fire-and-forget Generierung, keine Qualitätskontrolle. Bei kleinen LLMs problematisch.
- **Feature-Bloat?** 12 Sidebar-Punkte, 4 verschiedene "Fortschritt anzeigen"-Seiten (Wissenslandkarte, Lernpfad, Statistiken, Dashboard).

#### Generelle Einschätzung

| Feature | Was passiert ohne? | Einschätzung |
|---|---|---|
| Konversation | Sprachlernen verliert wichtigste Komponente | Behalten, aber Ergebnisse speichern |
| Wissenslandkarte | Niemand vermisst ein Radar-Chart | Zusammenführen mit Statistiken |
| Lern-Session | Nutzer geht direkt zu Quiz/Karteikarten | Könnte Button im Dashboard sein |
| Lernpfad | Dashboard + NextStepWidget deckt das ab | Zusammenführen |
| CEFR-Referenzdaten | 3.300 Wörter ohne Verwendung | Einbauen oder entfernen |

---

### Next.js-Experte

#### Architektur-Stärken
- Server Components korrekt für Dashboard, Stats, Paths
- Saubere Schichttrennung: `data-access/` → `actions/` → `components/`
- `unstable_cache` mit Tag-basierter Revalidierung
- SSE-Streaming für lange Operationen gut implementiert
- Vercel AI SDK korrekt integriert
- SM-2 und pgvector solide implementiert

#### Journey 1: Spanisch A1

- **Konversationsseite unnötig Client-seitig:** Statische Szenario-Daten im Client-Bundle. Server Component für Grid möglich.
- **Kein CEFR-Tracking in DB:** Kein `LanguageProgress`-Modell. Evaluationen nicht persistiert.
- **Vokabel-Quiz ohne Sprachfilter:** Bei mehreren importierten Sprachen werden Vokabeln gemischt.

#### Journey 2: Material hochladen

- **Upload-Pipeline ohne Retry/Resume:** Embedding-Fehler bei Chunk 47/100 → Dokument ohne Embeddings, kein Recovery.
- **Documents-Seite Client-seitig:** `useEffect`-basiertes Fetching statt Server Component mit `searchParams`.
- **Health-Check blockt Layout:** `await checkLLMHealth()` in `learn/layout.tsx` blockiert jede Navigation (3s Timeout).

#### Architektur-Bewertung

| Aspekt | Status |
|--------|--------|
| Server Components | Teilweise (Dashboard gut, Documents/Conversation unnötig Client-seitig) |
| Streaming/SSE | Gut implementiert |
| Data Fetching | Gemischt (Dashboard cached, Rest useEffect) |
| Prisma-Schema | Solide |
| API-Design | Konsistent |
| Error Handling | Ausbaufähig (kein Error-Boundary) |
| Caching | Grundlage vorhanden |

---

### Lerner-Persona "Maria"

#### Journey 1: Spanisch A1

- **Erster Eindruck:** Landing Page spricht nur Studenten an ("Von Skripten zu Karteikarten"), nicht Sprachlerner. Dashboard-Onboarding zeigt nur Dokument-Pfad.
- **Vokabeltrainer:** Leerer Zustand frustrierend — "Keine Vokabeln vorhanden, lade ein Dokument hoch." Erwartet wurde: Sprache auswählen → sofort lernen.
- **Konversation:** Szenarien gut, aber UI wechselt auf Zielsprache (Beschreibungen auf Spanisch unverständlich für Anfänger). Sprachauswahl nicht persistent.
- **Fortschritt:** Nirgends "Spanisch A1: 60%". Statistiken nur für Quiz/Karteikarten, nicht für Sprachniveau.
- **Weiter zu A2:** Kein strukturierter Weg, kein automatischer Übergang.

#### Journey 2: Uni-Skripte

- **Upload:** Klar und unkompliziert, Suche und Fach-Filter praktisch.
- **Chat:** Intuitiv, Quellenangaben hilfreich, fühlt sich wie echter Tutor an.
- **Quiz:** Killer-Feature — vielseitige Fragetypen, Prüfungsmodus, klare Fortschrittsanzeige.
- **Karteikarten:** Gut erklärt (Spaced Repetition Info-Box), übersichtlich. Aber: Manuelle Karten brauchen immer ein Dokument.
- **Fehlend:** Kein direkter Weg vom Dokument zum Chat ("Frage stellen"-Button auf Dokumentendetailseite).

#### Was gut funktioniert (Maria-Perspektive)
- Konversationsszenarien alltagsnah, vorgefertigte Sätze helfen Anfängern
- Quiz-Generator ist das beste Feature
- Karteikarten mit Spaced Repetition gut erklärt
- Gesamte App auf Deutsch — kein halb-englisches Interface
- Professionelles, hochwertiges UI-Design
