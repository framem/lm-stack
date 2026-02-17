# LAI Feature-Implementierungsplan

> Ergebnis des Experten-Workshops (UX-Designer, Devil's Advocate, NextJS-Experte, Nutzer-Interview)
> Datum: 2026-02-16
> Update: 2026-02-17 — Agenten-Panel-Review (UX/UI-Designer, Devil's Advocate, NextJS-Experte, Platform-User)
> **Letzte Bereinigung:** 2026-02-17 — Abgeschlossene Sprints entfernt

## Strategische Ausrichtung

**LAI bleibt ein dokumentenbasiertes Lerntool.** Der USP ist: Eigenes Material hochladen (Vorlesungsfolien, Lehrbücher) und daraus personalisierte Übungen generieren. Sprachlernen wird als Spezialfall unterstützt — nicht als eigener Kurs-Modus (kein Duolingo-Klon), aber mit **Starter-Paketen** für Nutzer ohne eigenes Material.

**Kern-Insights:**
- Die Plattform hat starke Einzeltools (Chat, Quiz, Karteikarten), aber es fehlt die intelligente Orchestrierung. Die Tools wissen nichts voneinander.
- Für Sprach-Anfänger ohne eigenes Material braucht es kuratierte Einstiegsinhalte (Starter-Pakete pro Sprache/Level), die die bestehende Infrastruktur nutzen.
- Features NICHT streichen (Knowledge Map, Stats, 8 Fragetypen sind effizient implementiert), sondern priorisieren und besser verknüpfen.
- Audio via Web Speech API ist ein Quick Win ohne neue Dependencies.

---

## Offene Features

### Aus feature-backlog.md (Agenten-Team-Review)

Siehe `feature-backlog.md` für die vollständige priorisierte Liste der 15 noch offenen Features aus dem Agenten-Team-Review.

**Top-Prioritäten:**
- #2: Konversations-Evaluationen persistieren (Must-have)
- #4: Szenario-Beschreibungen Bug-Fix (Must-have)
- #7: Health-Check aus Layout entfernen (Performance-kritisch)

---

## Phase 2: Neue Fähigkeiten (noch offen)

### 2.5 Lokales TTS (Upgrade von Web Speech API)
- Aufwand: L
- Piper TTS / Coqui TTS als Docker-Container
- Höhere Audio-Qualität für Sprachlernen
- Vorgelesene Sätze, Diktate, Hörverständnis

---

## Phase 3: Plattform-Erweiterungen (langfristig)

### 3.3 Interaktive Schritt-für-Schritt-Übungen
- Aufwand: L
- Multi-Step-Aufgaben mit progressiven Hinweisen
- Neues Model `Exercise` mit `steps` (JSON-Array)

### 3.4 Grafische Visualisierungen (ER-Diagramme etc.)
- Aufwand: L-XL
- Mermaid.js-basiertes Rendering als erster Schritt
- LLM generiert Mermaid-Code aus Dokument-Inhalt
- Risiko: Lokale LLMs erzeugen oft fehlerhaften Mermaid-Code

---

## Abgeschlossene Sprints (Archiv)

<details>
<summary>✅ Phase 0 & 1 komplett abgeschlossen (Sprint 0-4)</summary>

### Sprint 0 — Kritische UX-Verbesserungen ✅
- ✅ 0.1 Onboarding personalisieren
- ✅ 0.2 Sidebar vereinfachen
- ✅ 0.3 Post-Upload CTA
- ✅ 0.4 CEFR-Fortschritts-Tracker
- ✅ 0.5 Daily Practice Flow
- ✅ 0.6 Erfolgs-Feedback und Mini-Gamification
- ✅ 0.7 Konversations-Feedback

### Sprint 0.5 — Technische Quick Wins ✅
- ✅ pgvector HNSW-Index
- ✅ Dashboard Caching
- ✅ Error Boundaries pro Modul
- ✅ Lazy Loading schwerer Komponenten
- ✅ Graceful Degradation ohne LLM
- ✅ userId-Feld vorbereiten

### Sprint 1 — Quick Wins ✅
- ✅ 1.1 Chat-Suche und Lesezeichen
- ✅ 1.2 Prüfungsmodus mit Zeitlimit
- ✅ 1.3 Vokabeltrainer mit Kontext und Konjugation
- ✅ 1.4 TTS via Web Speech API

### Sprint 2 — Adaptive Quiz-Schwierigkeit ✅
- ✅ 2.1 Adaptive Quiz-Schwierigkeit

### Sprint 3 — Neue Übungstypen ✅
- ✅ 3.1 Grammatikübungen und erweiterte Fragetypen (8 Typen implementiert)

### Sprint 4 — Zeitbasierter Lernplan ✅
- ✅ 4.1 Zeitbasierter Lernplan mit Prüfungstermin

### Phase 2 Features ✅
- ✅ 2.1 KI-Konversationsübungen / Rollenspiele
- ✅ 2.2 Wissenslandkarte / Kompetenz-Dashboard
- ✅ 2.3 Auto-Inhaltsverzeichnis
- ✅ 2.4 Einstufungstest (Sprachlernen)

</details>

---

## Entscheidungs-Log

| Entscheidung | Begründung |
|---|---|
| Kein eigener Sprachlern-Modus | LAI ist dokumentenbasiert, Sprachlernen als Spezialfall. Nutzerin bestätigt: "Ergänzung, nicht Ersatz für Duolingo" |
| Starter-Pakete statt Kurs-Engine | Kuratierte Einstiegsinhalte nutzen bestehende Infrastruktur. Kein Duolingo-Klon, aber kein leeres Dashboard für Anfänger (Konsens aller 4 Experten, Review 2026-02-17) |
| Features nicht streichen | Knowledge Map, Stats, 8 Fragetypen sind dünn und effizient implementiert (~200-500 Zeilen). Streichen spart kaum Aufwand, zerstört aber Funktionalität (NextJS-Experte, Review 2026-02-17) |
| Content-Sharing nicht in Phase 1 | Kein User-System vorhanden, XL-Aufwand, Nutzerin: "Nice-to-have, nicht existenziell" |
| Web Speech API statt lokales TTS | Null Infrastruktur-Aufwand, sofort einsetzbar. Qualität akzeptabel für MVP. STT (Spracheingabe) nicht priorisieren — zu unzuverlässig für Anfänger mit Akzent (Devil's Advocate, Review 2026-02-17) |
| Auth später, userId jetzt vorbereiten | Lern-Flow-Verbesserung hat direkten Impact auf Retention, Auth hat null Impact. Aber `userId @default("default")` jetzt setzen für spätere Migration (Konsens aller 4 Experten, Review 2026-02-17) |
| Einstufungstest mit Fragenpool statt LLM | Konsistenz und Zuverlässigkeit wichtiger als Flexibilität |
| Adaptive Schwierigkeit: 3 Stufen statt KI-Tutoring | Klar abgegrenzt, messbar, kein Over-Engineering |
| Grammatikübungen: 13B+ Model empfohlen | 7B-Models zu fehleranfällig bei Sprach-Grammatik |
| LernpfadGenerator durch Heuristik ersetzen | LLM-basierte Lernempfehlung mit 8B-Model unzuverlässig. Einfache Heuristik (fällige Wiederholungen > schwache Dokumente > neue Dokumente) ist schneller und deterministisch (Devil's Advocate, Review 2026-02-17) |
