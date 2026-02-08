# n8n - Integration Testing

[n8n](https://n8n.io/) dient in diesem Stack als zentrale Testumgebung, um die Verbindung zu den umliegenden Systemen zu verifizieren:

- **PostgreSQL (pgvector)** - Datenbank / RAG-Speicher
- **Ollama** - Lokale LLM-Inferenz
- **LM Studio** - Alternative LLM-Inferenz (Host)
- **MCP Server** - Model Context Protocol Tools

## Starten

```bash
# n8n + Datenbank + Ollama (GPU)
docker compose up n8n ollama-gpu db -d

# oder mit CPU-only Ollama
docker compose up n8n ollama-cpu db -d
```

n8n ist dann erreichbar unter: `http://localhost:5678`

## Netzwerk-Übersicht

n8n läuft als Docker-Container im Netzwerk `agents`. Der Zugriff auf andere Services unterscheidet sich je nachdem, ob diese ebenfalls im Docker-Netzwerk oder auf dem Host laufen.

### Services im Docker-Netzwerk (`agents`)

Container im selben Docker-Netzwerk erreichen sich gegenseitig über ihren **Service-Namen** als Hostnamen:

| Service    | URL aus n8n heraus              |
| ---------- | ------------------------------- |
| Ollama     | `http://ollama:11434`           |
| PostgreSQL | `postgres:5432` (User/PW: `postgres`/`password`, DB: `example_db`) |

### Services auf dem Host

Services, die direkt auf dem Host-System laufen (nicht in Docker), sind aus einem Container heraus **nicht** über `localhost` erreichbar. `localhost` zeigt innerhalb eines Containers auf den Container selbst, nicht auf den Host.

Stattdessen wird `host.docker.internal` verwendet, das Docker auf die IP des Host-Systems auflöst:

| Service    | URL aus n8n heraus                         |
| ---------- | ------------------------------------------ |
| MCP Server | `http://host.docker.internal:3001/mcp`     |
| LM Studio  | `http://host.docker.internal:1234/v1`      |

> **Warum nicht `localhost`?**
> Docker-Container laufen in einem isolierten Netzwerk. `localhost` (`127.0.0.1`) zeigt innerhalb eines Containers auf den Container selbst. Um den Host zu erreichen, stellt Docker Desktop den DNS-Namen `host.docker.internal` bereit, der auf eine Gateway-IP des Hosts auflöst. Voraussetzung ist, dass der Service auf dem Host auf `0.0.0.0` lauscht (nicht nur auf `localhost`), damit er Verbindungen von der Docker-Bridge akzeptiert.

## Workflows exportieren

Workflows werden im Ordner `workflows/` versioniert. Um alle aktuellen Workflows aus dem laufenden Container zu exportieren:

```bash
./scripts/export-workflows.sh
```

Das Script exportiert alle Workflows als einzelne JSON-Dateien via `n8n export:workflow`.

## Umgebungsvariablen

Die folgenden Variablen werden über `docker-compose.yml` gesetzt:

| Variable              | Wert              | Beschreibung                  |
| --------------------- | ----------------- | ----------------------------- |
| `OLLAMA_HOST`         | `ollama:11434`    | Ollama-Endpoint (Docker-intern) |
| `DB_POSTGRESDB_HOST`  | `postgres`        | PostgreSQL Host (Docker-intern) |
| `DB_POSTGRESDB_PORT`  | `5432`            | PostgreSQL Port               |
| `QDRANT_HOST`         | `qdrant`          | Qdrant Host (aktuell deaktiviert) |
