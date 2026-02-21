# Langfuse SDK: Python vs. TypeScript

Beide SDKs bieten dieselben Kernkonzepte — Traces, Spans, Generations, Prompt Management, Scoring — aber die konkrete API unterscheidet sich in Namensgebung, Lifecycle-Management und asynchronem Verhalten. Dieses Dokument zeigt die Unterschiede anhand der echten Skripte aus dem `langfuse/` (Python) und `langfuse-ts/` (TypeScript) Projekt.

---

## Client initialisieren

**Python** (`01_tracing/tracing_basic.py`):

```python
from langfuse import Langfuse

langfuse = Langfuse()

# Synchronous auth check available
if not langfuse.auth_check():
    sys.exit(1)
```

**TypeScript** (`src/01_tracing/tracingBasic.ts`):

```typescript
import Langfuse from "langfuse";

const langfuse = new Langfuse();
// No built-in auth_check() — connection errors surface at first API call
```

**Unterschied:** Beide Clients lesen Credentials automatisch aus Umgebungsvariablen (`LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST`). Der Python-Client bietet eine synchrone **`auth_check()`**-Methode, um die Verbindung vorab zu prüfen. Im TypeScript-SDK gibt es kein Äquivalent — Authentifizierungsfehler zeigen sich erst beim ersten API-Call.

---

## Trace erstellen

**Python:**

```python
trace = langfuse.start_span(
    name="simple-question",
    input={"question": question},
)
```

**TypeScript:**

```typescript
const trace = langfuse.trace({
    name: "simple-question",
    input: { question },
});
```

**Unterschied:** Python nutzt **`start_span()`** als Einstiegspunkt — der Top-Level-Span fungiert als Trace. TypeScript hat dafür die dedizierte **`trace()`**-Methode, die explizit einen Trace erzeugt. Konzeptionell ist das Ergebnis identisch, aber die TS-API trennt Traces und Spans klarer auf API-Ebene.

---

## Spans und Generierungen

Das Erzeugen und Beenden von Spans zeigt den größten idiomatischen Unterschied zwischen den SDKs.

**Python** — Mutable State + explizites `end()`:

```python
# Child span erzeugen
input_span = trace.start_span(name="input-processing", input={"raw": raw_input})

# Arbeit erledigen...
processed = preprocess(raw_input)

# Span mit Output aktualisieren, dann schließen
input_span.update(output={"processed": processed})
input_span.end()
```

```python
# Generation erzeugen
generation = trace.start_generation(
    name="llm-call",
    model=model,
    input=messages,
    model_parameters={"temperature": 0.7, "max_tokens": 256},
)

# Nach dem LLM-Call:
generation.update(output=answer, usage_details=usage_details)
generation.end()
```

**TypeScript** — Deklarativer mit `end({ ... })`:

```typescript
// Child span erzeugen
const inputSpan = trace.span({
    name: "input-processing",
    input: { raw: rawInput },
});

// Arbeit erledigen...
const processed = preprocess(rawInput);

// Span mit Output in einem Schritt beenden
inputSpan.end({ output: { processed: processedInput } });
```

```typescript
// Generation erzeugen
const generation = trace.generation({
    name: "llm-call",
    model,
    input: messages,
    modelParameters: { temperature: 0.7, max_tokens: 256 },
});

// Nach dem LLM-Call — Output direkt an end() übergeben:
generation.end({ output: answer, usageDetails });
```

**Unterschied:**

| Aspekt | Python | TypeScript |
|--------|--------|------------|
| Span erstellen | `trace.start_span()` | `trace.span()` |
| Generation erstellen | `trace.start_generation()` | `trace.generation()` |
| Output setzen | `span.update(output=...)` | direkt in `end({ output })` |
| Beenden | separates `span.end()` | `span.end({ output })` in einem Schritt |
| Parameter-Stil | `model_parameters=` | `modelParameters:` |

Python folgt einem **Zwei-Schritt-Muster**: erst `update()`, dann `end()`. TypeScript erlaubt es, **Output und Ende in einem einzigen `end()`-Aufruf** zu kombinieren. Das macht den TS-Code kompakter, während Python mehr Flexibilität bietet (z.B. mehrere `update()`-Aufrufe vor dem `end()`).

---

## Token-Usage loggen

**Python:**

```python
usage_details = {
    "input": usage.prompt_tokens,
    "output": usage.completion_tokens,
    "total": usage.total_tokens,
}
generation.update(output=answer, usage_details=usage_details)
```

**TypeScript:**

```typescript
const usageDetails: Record<string, number> = {};
if (usage) {
    usageDetails.input = usage.prompt_tokens;
    usageDetails.output = usage.completion_tokens;
    usageDetails.total = usage.total_tokens;
}
generation.end({ output: answer, usageDetails });
```

**Unterschied:** Inhaltlich identisch — beide SDKs erwarten ein Dictionary/Object mit `input`, `output`, `total` als Keys. Der einzige Unterschied ist die Konvention: Python nutzt **`snake_case`** (`usage_details`), TypeScript **`camelCase`** (`usageDetails`). Die Keys *innerhalb* des Objekts (`input`, `output`, `total`) sind in beiden SDKs gleich.

---

## Scoring

**Python** (`03_evaluation/llm_as_judge.py`):

```python
# Score über das Trace-Objekt setzen
trace.score_trace(
    name="quality",
    value=normalized_score,
    comment=f"LLM-as-Judge Rohwert: {score}/10",
)
```

**TypeScript** (`src/03_evaluation/llmAsJudge.ts`):

```typescript
// Score über den Langfuse-Client mit expliziter traceId
langfuse.score({
    traceId: trace.id,
    name: "quality",
    value: normalizedScore,
    comment: `LLM-as-Judge Rohwert: ${score}/10`,
});
```

**Unterschied:** In Python wird der Score **direkt am Trace-Objekt** gesetzt — `trace.score_trace()` kennt die eigene Trace-ID implizit. In TypeScript muss die **`traceId` explizit übergeben** werden, weil `score()` eine Methode des Langfuse-Clients ist, nicht des Trace-Objekts. Das TypeScript-Pattern ist flexibler (man kann Scores für beliebige Traces setzen), erfordert aber das manuelle Durchreichen der ID.

---

## Flush & Shutdown

**Python:**

```python
langfuse.flush()
langfuse.shutdown()
```

**TypeScript:**

```typescript
await langfuse.flushAsync();
await langfuse.shutdownAsync();
```

**Unterschied:** Python nutzt **synchrone** Methoden — `flush()` blockiert, bis alle Events gesendet sind, `shutdown()` räumt auf. TypeScript braucht **`await`**, weil JavaScript eine nicht-blockierende Event Loop verwendet. Ohne `await` würde das Programm beendet, *bevor* die HTTP-Requests an Langfuse abgeschickt sind. Die `Async`-Suffixe machen diesen Unterschied im TypeScript-SDK explizit sichtbar.

---

## Prompt Management

**Python** (`02_prompt_management/prompt_versioning.py`):

```python
# Prompt erstellen
langfuse.create_prompt(
    name="erklaer-konzept",
    prompt=prompt_template,
    labels=["production"],
    config={"temperature": 0.7, "max_tokens": 256},
)

# Prompt abrufen (mit Label)
fetched_prompt = langfuse.get_prompt("erklaer-konzept", label="production")

# Prompt kompilieren — Keyword-Argumente
compiled = fetched_prompt.compile(
    concept="Neuronale Netze",
    audience="Programmier-Anfänger",
    length="3",
)
```

**TypeScript** (`src/02_prompt_management/promptVersioning.ts`):

```typescript
// Prompt erstellen (async)
await langfuse.createPrompt({
    name: "erklaer-konzept",
    prompt: promptTemplate,
    labels: ["production"],
    config: { temperature: 0.7, max_tokens: 256 },
});

// Prompt abrufen (async, Label als drittes Argument)
const fetchedPrompt = await langfuse.getPrompt("erklaer-konzept", undefined, {
    label: "production",
});

// Prompt kompilieren — Object als Argument
const compiled = fetchedPrompt.compile({
    concept: "Neuronale Netze",
    audience: "Programmier-Anfänger",
    length: "3",
});
```

**Unterschied:**

| Aspekt | Python | TypeScript |
|--------|--------|------------|
| Erstellen | `create_prompt(name=, prompt=, ...)` | `await createPrompt({ name, prompt, ... })` |
| Abrufen | `get_prompt(name, label=)` | `await getPrompt(name, undefined, { label })` |
| Kompilieren | `compile(concept=..., audience=...)` | `compile({ concept: ..., audience: ... })` |
| Synchron/Async | synchron | async (`await` erforderlich) |

Python übergibt Variablen als **Keyword-Argumente** an `compile()`, TypeScript als **einzelnes Objekt**. Das Label wird in Python als benannter Parameter übergeben, in TypeScript als Options-Objekt im dritten Argument (die Signatur ist `getPrompt(name, version?, options?)`).

---

## Fehlerbehandlung

**Python:**

```python
try:
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.7,
        max_tokens=256,
    )
except Exception as e:
    generation.update(output=f"Fehler: {e}", level="ERROR")
    generation.end()
    trace.end()
    langfuse.flush()
    sys.exit(1)
```

**TypeScript:**

```typescript
try {
    response = await client.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 256,
    });
} catch (e) {
    generation.end({ output: `Fehler: ${e}` });
    await langfuse.flushAsync();
    process.exit(1);
}
```

**Unterschied:** Die Struktur ist nahezu identisch (`try/except` vs. `try/catch`). Zwei Unterschiede fallen auf:

1. **Error-Level:** Python kann der Generation ein explizites `level="ERROR"` zuweisen. Im TypeScript-Skript wird der Fehler nur als Output-String geloggt.
2. **Cleanup:** Python muss `generation.end()` *und* `trace.end()` separat aufrufen, bevor `flush()`. In TypeScript reicht `generation.end({ output })` gefolgt von `flushAsync()` — da `trace()` keinen expliziten `end()`-Aufruf braucht (der Trace wird serverseitig geschlossen).

---

## Zusammenfassung: Entscheidungshilfe

| Feature | Python SDK | TypeScript SDK | Unterschied |
|---------|-----------|---------------|-------------|
| **Import** | `from langfuse import Langfuse` | `import Langfuse from "langfuse"` | ES Module vs. Python Import |
| **Auth-Check** | `langfuse.auth_check()` | nicht verfügbar | Python kann vorab prüfen |
| **Trace erstellen** | `langfuse.start_span()` | `langfuse.trace()` | Unterschiedliche Methodennamen |
| **Span erstellen** | `trace.start_span()` | `trace.span()` | Python: `start_`-Prefix |
| **Generation erstellen** | `trace.start_generation()` | `trace.generation()` | Python: `start_`-Prefix |
| **Span beenden** | `span.update(...) → span.end()` | `span.end({ output })` | Python: 2 Schritte, TS: 1 Schritt |
| **Parameter-Stil** | `snake_case` | `camelCase` | Sprachkonvention |
| **Token-Usage** | `usage_details={"input": x}` | `usageDetails: { input: x }` | Nur Naming-Konvention |
| **Scoring** | `trace.score_trace(name, value)` | `langfuse.score({ traceId, name, value })` | Trace-Objekt vs. Client |
| **Flush** | `langfuse.flush()` (sync) | `await langfuse.flushAsync()` | Event Loop erfordert await |
| **Shutdown** | `langfuse.shutdown()` (sync) | `await langfuse.shutdownAsync()` | Event Loop erfordert await |
| **Prompt erstellen** | `create_prompt(name=...)` | `await createPrompt({ name })` | sync vs. async, kwargs vs. Objekt |
| **Prompt kompilieren** | `compile(concept=...)` | `compile({ concept: ... })` | kwargs vs. Objekt |
| **Fehlerbehandlung** | `try/except Exception` | `try/catch (e)` | Sprachsyntax |
| **Trace URL** | `langfuse.get_trace_url()` | `trace.getTraceUrl()` | Client-Methode vs. Trace-Methode |

### Wann Python, wann TypeScript?

**Python**, wenn:
- ML-Kontext (PyTorch, scikit-learn, Hugging Face)
- Jupyter Notebooks und explorative Analyse
- LangChain / LangGraph Integration
- Evaluation-Pipelines und Batch-Processing

**TypeScript**, wenn:
- Web-Anwendungen (Next.js, Express, Fastify)
- Vercel AI SDK und Edge Functions
- Frontend-nahe LLM-Features (Streaming, Chat-UIs)
- Full-Stack-JavaScript/TypeScript-Projekte
