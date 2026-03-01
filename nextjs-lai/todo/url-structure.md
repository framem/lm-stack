# URL-Struktur Konsolidierung — LAI

## Motivation

Die aktuelle URL-Struktur hat mehrere Schwächen:

1. **Sprachname statt Code in URLs**: `/learn/language/Spanisch` statt `/learn/language/es` — Umlaute, Encoding-Probleme, nicht URL-freundlich
2. **Vokabeln sind losgelöst von der Sprache**: `/learn/vocabulary` existiert als eigener Bereich, obwohl Vokabeln immer zu einer Sprache gehören
3. **Lektionsübersicht schwer erreichbar**: `/learn/vocabulary/sets/es-a1` (Lektionen & Fortschritt) ist nur über einen versteckten Button auf einer Kachel in einem Submenü zugänglich
4. **CEFR-Fortschritt fehlt auf der Sprachübersicht**: `/learn/languages` zeigt keinen CEFR-Progress-Ring

---

## Neue URL-Struktur

### Übersicht der Änderungen

| Aktuell | Neu | Beschreibung |
|---------|-----|--------------|
| `/learn/language` | `/learn/language` | Sprachübersicht (bleibt, wird erweitert) |
| `/learn/language/Spanisch` | `/learn/language/es` | Sprach-Hub (ISO-Code statt Name) |
| `/learn/vocabulary` | `/learn/language/es/vocabulary` | Vokabel-Übersicht pro Sprache |
| `/learn/vocabulary/sets/es-a1` | `/learn/language/es/a1` | Set-Detail (Lektionen) direkt unter Sprache |
| `/learn/vocabulary/study?language=Spanisch` | `/learn/language/es/study?mode=flip` | Lernen im Sprachkontext |
| — | `/learn/language/es/a1/lesson/3` | (Optional) Direkt-Einstieg in eine Lektion |

### Detail-Spezifikation

#### 1. `/learn/language` — Sprachübersicht (erweitert)

**Aktuell**: Zeigt Karten mit Sprachname, Flag, Fortschrittsbalken, Link zum Sprachtrainer.

**Neu — zusätzlich**:
- **CEFR-Progress-Ring** (`<CefrProgressRing>`) pro Sprache direkt auf der Karte einbetten
  - Zeigt aktuelles Level, Fortschritt in %, beherrschte/Ziel-Wörter
  - Komponente existiert bereits (`src/components/CefrProgressRing.tsx`), wird aktuell nur auf dem Dashboard verwendet
- Karten verlinken auf `/learn/language/{code}` statt `/learn/language/{Name}`

#### 2. `/learn/language/[code]` — Sprach-Hub (ISO-Codes)

**Aktuell**: URL nutzt deutschen Sprachnamen (`/learn/language/Spanisch`).

**Neu**: URL nutzt ISO 639-1 Codes (`/learn/language/es`).

**Mapping** (bidirektional, zentral definiert):
```
es ↔ Spanisch
en ↔ Englisch
de ↔ Deutsch
fr ↔ Französisch
it ↔ Italienisch
```

**Umsetzung**:
- Dynamischer Segment-Param `[code]` statt `[lang]`
- Neues Utility `resolveLanguage(code: string): { code, name, flag }` in `src/lib/language-utils.ts`
- Reverse-Lookup `resolveLanguageCode(name: string): string` ebenfalls dort
- Alle internen Links anpassen (Sidebar, Dashboard, Breadcrumbs)
- **Redirect**: `/learn/language/Spanisch` → `/learn/language/es` (für Bookmarks) via `next.config.js` Redirects

**Inhalt der Seite bleibt gleich** (Stats, Quick Actions, Sets, Quiz, Konversation), aber:
- **Lektionsübersicht prominent einbauen** (siehe Punkt 5)

#### 3. `/learn/language/[code]/vocabulary` — Vokabeln pro Sprache

**Aktuell**: `/learn/vocabulary` zeigt ALLE Sprachen gruppiert.

**Neu**: Vokabel-Übersicht wird sprachspezifisch unter `/learn/language/[code]/vocabulary`.

**Inhalt**:
- Gefilterter View des aktuellen `VocabContent` — nur Cards der jeweiligen Sprache
- Stats (Total, Neu, Fällig, Beherrscht)
- Lern-Buttons (Flip, Type, Speech)
- Analytics-Toggle
- Liste der Vokabelsets mit Fortschritt
- "Sonstige Vokabeln" (manuell erstellte Karten der Sprache)

**Migration**:
- `/learn/vocabulary` wird entweder:
  - **(a) Entfernt** und durch die sprachspezifischen Seiten ersetzt, oder
  - **(b) Zum Redirect** auf `/learn/language` (Sprachübersicht), da man dort die Sprache wählt
- **Empfehlung**: Option (b) — `/learn/vocabulary` redirected auf `/learn/language`

#### 4. `/learn/language/[code]/[level]` — Set-Detail (Lektionen)

**Aktuell**: `/learn/vocabulary/sets/es-a1` — versteckt, schwer erreichbar.

**Neu**: `/learn/language/es/a1` — direkt unter der Sprache, prominent verlinkt.

**Inhalt** (bleibt gleich):
- Set-Titel, CEFR-Level-Badge, Beschreibung
- Stats: Gesamt, Neu, In Arbeit, Beherrscht
- Knowledge Distribution Bar
- **Lektions-Timeline** (essenziell!):
  - Sequentielle Lektionen mit Unlock-System
  - Fortschritt pro Lektion
  - Quick-Actions pro Lektion
  - Expandierbare Vokabelliste

**Wichtige Verbesserung**: Direkter Link von der Sprach-Hub-Seite aus — nicht in einem Submenü versteckt, sondern als prominente Kachel/Tab.

#### 5. Sprach-Hub erweitern: Lektionsübersicht prominent machen

**Problem**: Die Lektionsübersicht (aktuell unter `/learn/vocabulary/sets/es-a1`) ist essenziell für:
- Überblick über den Lernfortschritt pro Lektion
- Grundlage für Lernplan-Erstellung
- Erkennen, welche Lektionen abgeschlossen/offen sind

**Lösung auf der Sprach-Hub-Seite** (`/learn/language/es`):
- **Tab-Navigation** oder **Sections** mit direktem Zugang:
  - "Übersicht" (aktuelle Stats + Quick Actions)
  - "Lektionen" (Lektions-Timeline des aktiven Sets — inline oder als prominenter Link)
  - "Vokabeln" (Link zu `/learn/language/es/vocabulary`)
  - "Quiz" / "Konversation" (wie bisher)
- Pro importiertem Set: **Direkte Lektionsliste** als aufklappbare Section oder als prominenter Button "Lektionen anzeigen" → `/learn/language/es/a1`

#### 6. `/learn/language/[code]/study` — Lern-Session

**Aktuell**: `/learn/vocabulary/study?language=Spanisch&mode=flip`

**Neu**: `/learn/language/es/study?mode=flip`

**Query-Params** (bleiben ähnlich):
- `mode=flip|type|speech`
- `doc=<docId>` (spezifisches Set)
- `category=<category>` (spezifische Lektion)
- `new=true|all=true`

---

## Sidebar-Anpassungen

**Aktuell**:
```
Sprachen
  └─ Übersicht          → /learn/language
  └─ 🇪🇸 Spanisch        → /learn/language/Spanisch
  └─ 🇬🇧 Englisch        → /learn/language/Englisch
```

**Neu**:
```
Sprachen
  └─ Übersicht          → /learn/language
  └─ 🇪🇸 Spanisch        → /learn/language/es
  └─ 🇬🇧 Englisch        → /learn/language/en
```

- Sidebar-Links generieren `/learn/language/{code}` statt `/learn/language/{name}`
- `getVocabularyLanguages()` muss auch den Language-Code zurückgeben (nicht nur den Namen)

---

## Betroffene Dateien

### Zu erstellende Dateien
| Datei | Zweck |
|-------|-------|
| `src/lib/language-utils.ts` | Zentrales Language-Code ↔ Name Mapping, `resolveLanguage()`, `resolveLanguageCode()` |
| `src/app/learn/language/[code]/vocabulary/page.tsx` | Vokabel-Übersicht pro Sprache |
| `src/app/learn/language/[code]/[level]/page.tsx` | Set-Detail (Lektionen) unter neuem Pfad |
| `src/app/learn/language/[code]/study/page.tsx` | Lernen im Sprachkontext |

### Zu ändernde Dateien
| Datei | Änderung |
|-------|----------|
| `src/app/learn/language/[lang]/page.tsx` | Umbenennen zu `[code]/page.tsx`, Param-Logik anpassen |
| `src/app/learn/language/[lang]/language-hub.tsx` | `lang` (Name) → `code` (ISO), Language-Resolve, Lektionen prominent |
| `src/app/learn/language/language-overview.tsx` | CEFR-Progress-Ring einbauen, Links auf `/language/{code}` |
| `src/app/learn/vocabulary/page.tsx` | Redirect auf `/learn/language` |
| `src/app/learn/vocabulary/vocab-content.tsx` | Refactor: sprachspezifisch filterbar machen |
| `src/app/learn/vocabulary/sets/[id]/page.tsx` | Redirect auf `/learn/language/{code}/{level}` |
| `src/app/learn/vocabulary/study/page.tsx` | Redirect oder Wrapper für neuen Pfad |
| `src/components/Sidebar.tsx` | Links auf `/{code}` umstellen |
| `src/components/CefrProgressRing.tsx` | Ggf. kleinere Variante für Sprachübersicht |
| `src/app/learn/page.tsx` (Dashboard) | Links auf neue Pfade umstellen |
| `src/app/learn/language/page.tsx` | CEFR-Ring einbauen |
| `src/data-access/flashcards.ts` | Optional: Language-Code Support in Queries |
| `next.config.js` | Redirects für alte URLs |

### Zu löschende Dateien (nach Migration)
| Datei | Grund |
|-------|-------|
| `src/app/learn/vocabulary/sets/[id]/page.tsx` | Ersetzt durch `/language/[code]/[level]/page.tsx` |
| `src/app/learn/vocabulary/page.tsx` | Wird Redirect |

---

## Implementierungsreihenfolge

### Phase 1: Fundament
1. `src/lib/language-utils.ts` erstellen (Code ↔ Name Mapping)
2. `[lang]` → `[code]` Rename im Dateisystem
3. `language-hub.tsx` anpassen: Code statt Name als Param
4. Sidebar-Links anpassen
5. Dashboard-Links anpassen
6. Redirects in `next.config.js` für alte URLs

### Phase 2: Vokabeln unter Sprache verschieben
7. `/learn/language/[code]/vocabulary/page.tsx` erstellen
8. `VocabContent` refactoren: sprachspezifisch filterbar
9. `/learn/vocabulary` → Redirect auf `/learn/language`
10. `/learn/language/[code]/study/page.tsx` erstellen
11. Alte Study-Route redirecten

### Phase 3: Lektionen prominent machen
12. `/learn/language/[code]/[level]/page.tsx` erstellen (bestehende Set-Detail-Logik migrieren)
13. Sprach-Hub erweitern: Lektions-Section prominent einbauen
14. `/learn/vocabulary/sets/[id]` → Redirect auf `/learn/language/{code}/{level}`
15. Alte Sets-Route löschen

### Phase 4: CEFR auf Sprachübersicht
16. `language-overview.tsx` erweitern: CEFR-Progress-Ring pro Sprache einbauen
17. Ggf. kompakte Variante des Progress-Rings erstellen

### Phase 5: Aufräumen & Testen
18. Alle internen Links prüfen (Grep nach alten Pfaden)
19. Breadcrumbs verifizieren
20. Redirects testen
21. Nicht mehr benötigte Dateien entfernen

---

## Offene Fragen / Entscheidungen

1. **Vocabulary-Sammelseite**: Soll `/learn/vocabulary` komplett weg oder als Redirect bestehen bleiben?
   - **Empfehlung**: Redirect auf `/learn/language` (Übersicht)

2. **Set-Detail Routing-Konflikt**: `/learn/language/es/a1` — der `[level]` Param könnte mit anderen Sub-Routes kollidieren (z.B. `vocabulary`, `study`). Lösung:
   - Next.js prüft zuerst statische Segmente (`vocabulary`, `study`), dann dynamische (`[level]`)
   - Funktioniert, solange Level-Werte (`a1`, `a2`, `b1`) nie mit statischen Routen-Namen kollidieren ✅

3. **Conversation-Route**: Aktuell `/learn/conversation?language=es` — soll das auch unter `/learn/language/es/conversation` umgehängt werden?
   - **Empfehlung**: Ja, Konsistenz; aber niedrigere Priorität

4. **Quiz-Route**: Ähnlich — soll Quiz sprachspezifisch werden (`/learn/language/es/quiz`)?
   - **Empfehlung**: Nein, Quizze sind nicht ausschließlich sprachgebunden (auch Dokument-Quizze)
