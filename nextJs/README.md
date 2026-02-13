# MovieFlix

Netflix-inspirierte Filmdatenbank mit KI-gestützter Suche und Chat-Empfehlungen.
Basiert auf den IMDB Top 1000 Filmen, mit Embedding-basierter Ähnlichkeitssuche (RAG) und einem Tool-gesteuerten AI-Agenten.

## Tech Stack

| Bereich | Technologie |
|---------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui |
| Backend | Next.js App Router (API Routes) |
| Datenbank | PostgreSQL 17 + pgvector |
| AI/LLM | Vercel AI SDK 6, Ollama / LM Studio / AI Gateway |
| Embeddings | nomic-embed-text-v1.5 (768 Dimensionen) |
| ORM | Prisma 7 |
| MCP | Model Context Protocol Server (Streamable HTTP) |

## Voraussetzungen

- **Node.js** >= 18
- **Docker** (für die PostgreSQL-Datenbank)
- **LLM-Server** — einer der folgenden:
  - [LM Studio](https://lmstudio.ai/) (lokal, empfohlen für Einsteiger)
  - [Ollama](https://ollama.com/) (lokal, auch via Docker)
  - [Vercel AI Gateway](https://vercel.com/ai-gateway) (Cloud)

## Setup

### 1. Datenbank starten

Aus dem Root-Verzeichnis (`lm-stack/`):

```bash
docker compose up db -d
```

Das startet einen PostgreSQL 17 Container mit pgvector-Extension auf Port `5432`.
Standard-Credentials: `postgres` / `password` / `example_db`

### 2. Environment konfigurieren

```bash
cp .env.example .env
```

Die `.env` anpassen — hier ein Beispiel für **LM Studio**:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/example_db"

# LLM Provider: "lmstudio" | "ollama" | "gateway"
LLM_PROVIDER="lmstudio"
LLM_MODEL="qwen3:8b"
LLM_PROVIDER_URL="http://localhost:1234/v1"

# Embedding (fällt auf LLM_PROVIDER zurück, wenn nicht gesetzt)
EMBEDDING_MODEL="nomic-embed-text-v1.5"
```

<details>
<summary>Beispiel: Ollama</summary>

```env
LLM_PROVIDER="ollama"
LLM_MODEL="qwen3:8b"
LLM_PROVIDER_URL="http://localhost:11434"
EMBEDDING_PROVIDER="ollama"
EMBEDDING_MODEL="nomic-embed-text-v1.5"
EMBEDDING_PROVIDER_URL="http://localhost:11434"
```

</details>

<details>
<summary>Beispiel: Vercel AI Gateway</summary>

```env
LLM_PROVIDER="gateway"
LLM_MODEL="alibaba/qwen-3-14b"
AI_GATEWAY_API_KEY="your-api-key"
```

</details>

### 3. Dependencies installieren

```bash
npm install
```

### 4. Prisma generieren & Schema pushen

```bash
npm run prisma
```

Das führt `prisma generate` (Client generieren) und `prisma db push` (Schema in die DB schreiben) aus.

### 5. Datenbank seeden

```bash
npm run prisma:seed:movies
```

Lädt die IMDB Top 1000 Filme aus der mitgelieferten CSV-Datei in die Datenbank.

### 6. Embeddings generieren

Starte die App und öffne das Admin-Dashboard:

```bash
npm run dev
```

Dann im Browser **http://localhost:3000/admin** aufrufen und auf **"Start Embedding"** klicken.

Die Embeddings werden einzeln generiert — der Fortschritt wird live per SSE angezeigt. Für alle 1000 Filme dauert das je nach Hardware ein paar Minuten.

> **Wichtig:** Ohne Embeddings funktionieren weder die semantische Suche noch die Filmempfehlungen ("Ähnliche Filme"). Die Titel-Suche und Genre-Filter funktionieren auch ohne Embeddings.

### 7. App starten

```bash
npm run dev
```

Die App läuft auf **http://localhost:3000**.

## Features

### Filmkatalog

- **Startseite** — Hero-Banner mit zufälligem Top-Film + Genre-Reihen (horizontal scrollbar)
- **Filmdetails** (`/movie/[slug]`) — Poster, Bewertung, Cast, Beschreibung + ähnliche Filme
- **Genre-Seiten** (`/genre/[slug]`) — Grid-Ansicht aller Filme eines Genres

### Hybride Suche

Die Suchleiste (`/api/search`) kombiniert zwei Strategien:

1. **Titel-Suche** — Case-insensitive Substring-Match (`ILIKE`)
2. **Semantische Suche** — Embedding-Ähnlichkeit via pgvector (`<=>` Distanz-Operator, Schwellwert: 0.7)

Titel-Treffer werden priorisiert, danach nach Embedding-Distanz sortiert.

### AI Chat-Agent

Ein schwebender Chat-Button (unten rechts) öffnet einen KI-Filmberater mit Tool-Zugriff:

| Tool | Funktion |
|------|----------|
| `searchByTitle` | Substring-Suche im Filmtitel |
| `getByGenre` | Top-Filme eines Genres |
| `getTopRated` | Bestbewertete Filme insgesamt |
| `findSimilarMovies` | Embedding-basierte Ähnlichkeitssuche |

Der Agent antwortet auf Deutsch (oder Englisch, wenn der Nutzer Englisch schreibt), verlinkt Filme direkt in der Antwort und nutzt bis zu 3 Tool-Aufrufe pro Anfrage.

### MCP Server

Die App stellt unter `/api/mcp` einen vollständigen [Model Context Protocol](https://modelcontextprotocol.io/) Server bereit (Streamable HTTP Transport).

**Verfügbare MCP-Tools:**
- `getAllMovies` — Top 3 Filme aus der Datenbank
- `getMoviesByCategory` — Filme nach Genre filtern

Kann z.B. mit dem [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) oder Claude Desktop getestet werden:

```
URL: http://localhost:3000/api/mcp
Transport: Streamable HTTP
```

### Admin Dashboard

Unter **http://localhost:3000/admin**:

- Embedding-Status (Fortschrittsbalken: x / 1000 Filme)
- Start/Stop der Embedding-Generierung
- Live-Updates via Server-Sent Events

## Projektstruktur

```
nextJs/
├── prisma/
│   ├── schema/
│   │   ├── schema.prisma          # Datasource + pgvector Extension
│   │   └── movies.prisma          # Movie-Model mit vector(768)
│   └── sampleData/
│       ├── seed-movies.ts         # CSV-Import-Script
│       └── imdb_top_1000.csv      # Filmdaten
├── src/
│   ├── app/
│   │   ├── (content)/             # Haupt-Layout (Navbar + Chat)
│   │   │   ├── page.tsx           # Startseite
│   │   │   ├── movie/[slug]/      # Filmdetails
│   │   │   └── genre/[slug]/      # Genre-Seite
│   │   ├── (admin)/admin/         # Embedding-Dashboard
│   │   └── api/
│   │       ├── chat/route.ts      # AI-Chat Endpoint (streamText)
│   │       ├── search/route.ts    # Hybride Suche
│   │       ├── admin/embeddings/  # Embedding-Verwaltung (SSE)
│   │       └── mcp/route.ts       # MCP Server
│   ├── components/
│   │   ├── ChatBot.tsx            # Chat-Widget
│   │   ├── SearchBar.tsx          # Suche mit Debouncing
│   │   ├── HeroSection.tsx        # Feature-Banner
│   │   ├── MovieCard.tsx          # Film-Karte (Lazy Loading)
│   │   └── GenreRowScroller.tsx   # Horizontaler Scroll
│   ├── data-access/
│   │   └── movies.ts              # DB-Queries (Prisma + Raw SQL)
│   └── lib/
│       ├── llm.ts                 # LLM + Embedding Provider
│       ├── prisma.ts              # Prisma Client Singleton
│       └── slug.ts                # URL-Slug Utilities
├── .env.example                   # Environment-Vorlage
└── package.json
```

## Scripts

| Script | Beschreibung |
|--------|-------------|
| `npm run dev` | Entwicklungsserver starten |
| `npm run build` | Produktions-Build |
| `npm start` | Produktions-Server starten |
| `npm test` | Tests ausführen (Vitest) |
| `npm run prisma` | Prisma Client generieren + Schema pushen |
| `npm run prisma:seed:movies` | Filmdaten in DB laden |
| `npm run lint` | ESLint ausführen |

## Environment-Variablen

| Variable | Default | Beschreibung |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL Connection String |
| `LLM_PROVIDER` | `lmstudio` | `lmstudio`, `ollama` oder `gateway` |
| `LLM_MODEL` | `qwen3:8b` | Modell-Name |
| `LLM_PROVIDER_URL` | je nach Provider | URL des LLM-Servers |
| `EMBEDDING_PROVIDER` | = `LLM_PROVIDER` | Separater Embedding-Provider (optional) |
| `EMBEDDING_MODEL` | — | Embedding-Modell (z.B. `nomic-embed-text-v1.5`) |
| `EMBEDDING_PROVIDER_URL` | = `LLM_PROVIDER_URL` | URL des Embedding-Servers (optional) |
| `AI_GATEWAY_API_KEY` | — | API-Key für Vercel AI Gateway |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` | Basis-URL für Film-Links im Chat |
