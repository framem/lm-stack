# Langfuse — LLM Observability

Strukturiertes Tracing, Prompt-Versionierung und automatische Evaluation für LLM-Anwendungen — die fehlende Observability-Schicht zwischen `print()`-Debugging und Produktionsbetrieb.

## Was ist Langfuse?

Klassische Software hat Application Monitoring: Logs, Metriken, Traces. Wenn ein API-Endpoint langsam antwortet, sieht man das sofort im Dashboard — Latenz, Fehlerrate, Durchsatz, alles messbar.

Bei LLM-Anwendungen fehlt diese Transparenz. Ein Chat-Bot antwortet plötzlich Unsinn? Ohne Tracing weiß man nicht, ob das Problem am Prompt, am Retrieval, an der Temperatur oder am Modell selbst liegt. Die typische Reaktion — `print(response)` in den Code streuen — skaliert nicht und geht in der Konsole verloren.

**Langfuse** ist ein Open-Source-Observability-Tool speziell für LLM-Anwendungen. Es macht jeden Schritt einer LLM-Pipeline sichtbar: welcher Prompt wurde gesendet, welche Tokens kamen zurück, wie lange hat es gedauert, was hat es gekostet. Statt flüchtige Print-Ausgaben zu lesen, hat man ein durchsuchbares Dashboard mit der kompletten Historie.

| print-Debugging | Langfuse Tracing |
|----------------|------------------|
| Flüchtig, nur in der Konsole | Persistent, durchsuchbar im Dashboard |
| Kein Kontext (welcher Request?) | Jeder Trace hat eine eindeutige ID |
| Keine Metriken | Token-Verbrauch, Latenz, Kosten |
| Kein Zusammenhang zwischen Schritten | Hierarchie: Trace → Span → Generation |
| Kein Scoring | Automatische und manuelle Bewertungen |

## Kernkonzepte

### Traces, Spans, Generierungen

Langfuse organisiert Observability-Daten in einer Baumstruktur:

- **Trace** — Ein vollständiger Request-Durchlauf von Anfang bis Ende. Beispiel: Ein Nutzer stellt eine Frage → Retrieval → LLM-Call → Antwort. Das alles ist *ein* Trace.
- **Span** — Ein Teilschritt innerhalb des Traces, der keinen LLM-Call darstellt. Beispiel: Vorverarbeitung der Eingabe, Keyword-Suche im Retrieval, Nachbearbeitung der Ausgabe.
- **Generation** — Ein konkreter LLM-Call innerhalb des Traces. Hier werden Modell, Input-Messages, Output, Token-Verbrauch und Latenz erfasst.

```
Trace: "rag-pipeline"
├── Span: "retrieval"           (Keyword-Suche, 12ms)
├── Span: "augmentation"        (Prompt zusammenbauen, 1ms)
└── Generation: "llm-call"      (Qwen3, 847 Tokens, 2.3s)
```

### Prompt Management

Prompts direkt im Code zu ändern und per Git zu versionieren funktioniert — aber nur, solange eine Person an einem Prompt arbeitet. Langfuse bietet ein dediziertes Prompt Management:

- **Versionierung**: Jede Änderung erzeugt automatisch eine neue Version. Alte Versionen bleiben erhalten.
- **Labels**: Prompts können mit Labels wie `"production"` oder `"staging"` markiert werden. Der Code fragt immer das aktuelle Production-Label ab — ohne Deployment.
- **Variablen**: Templates mit Platzhaltern (`{{concept}}`, `{{audience}}`), die zur Laufzeit mit `compile()` befüllt werden.
- **Nachvollziehbarkeit**: Jede Generation wird automatisch mit der verwendeten Prompt-Version verknüpft. Wenn die Qualität einbricht, sieht man sofort, welche Prompt-Änderung verantwortlich ist.

### Evaluation & Scoring

Wie misst man, ob ein LLM gute Antworten gibt? Langfuse unterstützt mehrere Strategien:

- **LLM-as-Judge**: Ein zweiter LLM-Call bewertet die Antwort des ersten automatisch auf Kriterien wie Korrektheit, Vollständigkeit und Verständlichkeit. Das Ergebnis wird als Score am Trace gespeichert.
- **Manuelles Scoring**: In der Langfuse-UI kann man Traces manuell bewerten — nützlich zum Aufbau von Ground-Truth-Datensätzen.
- **Metriken über Zeit**: Scores lassen sich im Dashboard als Zeitreihen verfolgen. Sinkt die durchschnittliche Qualität nach einem Prompt-Update? Das sieht man sofort.

### Datasets

Langfuse unterstützt auch **Datasets** — kuratierte Sammlungen von Input/Expected-Output-Paaren, gegen die man Prompts und Pipelines testen kann. Datasets sind in den Lern-Skripten nicht enthalten, aber ein wichtiges Konzept für systematische Evaluation in Produktivsystemen.

## Setup

### Schritt 1: Langfuse-Konto

**Option A: Cloud** (empfohlen zum Einstieg)
- Konto erstellen auf [cloud.langfuse.com](https://cloud.langfuse.com)
- Kostenloser Free Tier mit 50.000 Observations/Monat
- Neues Projekt anlegen → API Keys generieren (Public Key + Secret Key)

**Option B: Self-hosted via Docker**
- Langfuse benötigt eine PostgreSQL-Datenbank (bereits im `docker-compose.yml` des lm-stack enthalten)
- Details: [Langfuse Self-Hosting Docs](https://langfuse.com/docs/deployment/self-host)

### Schritt 2: LM Studio

- [LM Studio](https://lmstudio.ai/) installieren und öffnen
- Ein Modell laden (z.B. Qwen3)
- Auf **"Start Server"** klicken — der Server startet auf Port 1234 und bietet eine OpenAI-kompatible API

### Schritt 3: Projekt konfigurieren

```bash
cd langfuse
cp .env.example .env
```

Dann in der `.env` die Keys eintragen:

```env
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com

LM_STUDIO_BASE_URL=http://localhost:1234/v1
LM_STUDIO_MODEL=qwen3
```

### Schritt 4: venv aktivieren und Skripte starten

```bash
# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

# Erstes Skript ausführen
python 01_tracing/tracing_basic.py
```

## Lernpfad

Die Skripte bauen aufeinander auf — in dieser Reihenfolge durcharbeiten:

### 1. Basics — Erster Trace in Langfuse

`01_tracing/tracing_basic.py`

Ein einzelner LLM-Call wird als Trace mit einer Generation geloggt. Man sieht Input, Output, Modell, Token-Verbrauch und Latenz in der Langfuse-UI. Der einfachste Einstiegspunkt, um die Grundstruktur zu verstehen.

### 2. Chaining — Mehrstufige Ketten tracen

`01_tracing/tracing_chain.py`

Eine dreistufige Verarbeitungskette: Eingabe-Vorverarbeitung → LLM-Call → Ausgabe-Nachbearbeitung. Jeder Schritt ist ein eigener Span/Generation im Trace. Zeigt, wie Parent-Child-Beziehungen zwischen Spans funktionieren.

### 3. Prompt Management — Prompts versionieren

`02_prompt_management/prompt_versioning.py`

Ein Prompt-Template mit Variablen (`{{concept}}`, `{{audience}}`, `{{length}}`) wird in Langfuse erstellt, mit dem Label `"production"` versehen, abgerufen und kompiliert. Die Generation wird automatisch mit der Prompt-Version verknüpft.

### 4. Evaluation — Qualität automatisch messen

`03_evaluation/llm_as_judge.py`

Das LLM-as-Judge-Pattern: Ein LLM beantwortet eine Frage, ein zweiter LLM-Call bewertet die Antwort auf einer Skala von 1-10. Der Score wird am Trace gespeichert und ist im Dashboard sichtbar. Nutzt `rich` für formatierte Konsolenausgabe.

### 5. Pipeline — Alles zusammen in einer RAG-Pipeline

`04_pipeline/rag_pipeline.py`

Eine vollständige RAG-Pipeline (Retrieval-Augmented Generation): Keyword-basiertes Retrieval aus einer kleinen Wissensbasis → Prompt-Augmentation mit den gefundenen Chunks → LLM-Generation. Jeder Schritt wird als eigener Span/Generation im Trace abgebildet.

## Verbindung zum lm-stack

Langfuse ergänzt die anderen Teile des lm-stack als Observability-Schicht:

- Die **languageModel**-Evaluation (LLM-as-Judge Notebook) evaluiert Modellqualität offline — Langfuse macht dasselbe **zur Laufzeit** und speichert Scores persistent.
- Der **LangGraph Agent** führt mehrstufige Tool-Calls aus — mit Langfuse-Tracing wird jeder Schritt im Graphen sichtbar (Retrieval, Tool-Call, LLM-Antwort).
- **LM Studio** dient als lokaler Inference-Server — Langfuse loggt dabei Token-Verbrauch und Latenz pro Request, ohne dass der Server selbst modifiziert werden muss.
- Der **MCP Server** stellt Tools bereit — wenn ein Agent diese Tools nutzt, kann jeder Tool-Call als Span im Trace erscheinen.
