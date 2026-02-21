# Langfuse-Konzepte — Observability für LLM-Anwendungen

> Warum LLMs schwerer zu debuggen sind als klassische Software — und wie strukturiertes
> Tracing, Token-Accounting und systematische Evaluation das Problem lösen.
>
> **Grund:** LLM-Anwendungen sind nicht-deterministisch: Derselbe Input kann bei jedem
> Aufruf eine andere Antwort erzeugen. Klassische Test- und Debugging-Methoden greifen
> nicht mehr — man braucht Werkzeuge, die für diese Art von Software gemacht sind.
>
> **Vorgehen:** Langfuse organisiert jeden LLM-Aufruf in einer Trace-Hierarchie, erfasst
> Token-Kosten, und ermöglicht automatische Qualitätsbewertung durch verschiedene
> Evaluation-Strategien.
>
> **Ergebnis:** Ein tiefes Verständnis der Kernkonzepte, die hinter dem Langfuse-Dashboard
> stehen — und warum jedes einzelne für den Produktionsbetrieb unverzichtbar ist.

## Inhaltsverzeichnis

1. [Das Observability-Problem](#sec-observability)
2. [Trace-Hierarchie](#sec-hierarchy)
3. [Token-Kosten verstehen](#sec-tokens)
4. [Sampling vs. vollständiges Logging](#sec-sampling)
5. [Evaluation-Strategien](#sec-evaluation)
6. [Prompt-Versionierung](#sec-prompts)
7. [Quellen](#sec-references)

---

<a id="sec-observability"></a>

## 1. Das Observability-Problem

### Warum LLMs anders sind

Klassische Software ist **deterministisch**: Derselbe Input erzeugt denselben Output. Wenn eine Funktion `sort([3, 1, 2])` nicht `[1, 2, 3]` zurückgibt, ist das ein Bug — reproduzierbar, testbar, fixbar.

LLM-Anwendungen brechen diese Grundannahme. Ein Chat-Modell, das auf die Frage „Was ist Python?" antwortet, gibt bei jedem Aufruf eine leicht andere Antwort. Die Antwort hängt ab von:

- **Temperature**: Höhere Werte erzeugen mehr Variation
- **Kontext**: Der System-Prompt, die Chat-Historie, die RAG-Chunks
- **Modellversion**: Ein Update des Modells kann das Verhalten verändern
- **Token-Sampling**: Die stochastische Auswahl des nächsten Tokens

Das bedeutet: Ein klassischer Unit-Test (`assert response == "erwartete Antwort"`) funktioniert nicht. Man kann nicht prüfen, ob die Antwort *exakt* richtig ist — nur ob sie *gut genug* ist. Und „gut genug" ist subjektiv.

### Die Blind Spots

Ohne Observability-Tools hat man bei LLM-Anwendungen folgende Blind Spots:

| Blind Spot | Konsequenz |
|-----------|------------|
| Kein Logging der Prompts | Man weiß nicht, welcher Prompt zu welcher Antwort geführt hat |
| Keine Token-Zählung | Kosten explodieren unbemerkt (besonders bei langen Kontexten) |
| Keine Latenz-Messung | Langsame Modelle oder überlastete Server bleiben unsichtbar |
| Kein Zusammenhang zwischen Schritten | Bei einer RAG-Pipeline weiß man nicht, ob das Retrieval oder die Generation das Problem ist |
| Keine Qualitätsmetriken | Verschlechtert sich die Antwortqualität nach einem Prompt-Update? Keine Ahnung. |

Langfuse adressiert jeden dieser Blind Spots durch **strukturiertes Tracing** — eine Methode, die aus dem klassischen Application Monitoring (OpenTelemetry, Jaeger, Zipkin) übernommen und für LLMs angepasst wurde.

---

<a id="sec-hierarchy"></a>

## 2. Trace-Hierarchie

### Das Grundprinzip

Langfuse organisiert alle Daten in einer **Baumstruktur**. Jeder Knoten im Baum hat einen Typ, einen Namen, Input/Output und Zeitstempel:

```
Trace
├── Span
│   └── Generation
├── Span
└── Generation
```

Die drei Knotentypen:

- **Trace** — Die Wurzel. Repräsentiert einen vollständigen Request-Durchlauf. Hat eine eindeutige ID, über die man den gesamten Vorgang im Dashboard findet.
- **Span** — Ein Verarbeitungsschritt, der keinen LLM-Call darstellt. Retrieval, Preprocessing, Datenbankabfragen, API-Calls an externe Dienste.
- **Generation** — Ein konkreter LLM-Aufruf. Erfasst zusätzlich Modellname, Token-Usage, Modellparameter und optional die verwendete Prompt-Version.

### Konkretes Beispiel: RAG-Pipeline

Eine typische RAG-Pipeline (wie in `04_pipeline/rag_pipeline.py`) erzeugt folgenden Trace-Baum:

```
Trace: "rag-pipeline"
│  input:  { query: "Was ist Machine Learning?" }
│  output: { answer: "Machine Learning ist...", chunks_used: 2 }
│
├── Span: "retrieval"                          ← 12ms
│   input:  { query: "Was ist Machine Learning?", top_k: 2 }
│   output: { chunks: [...], num_found: 2 }
│
├── Span: "augmentation"                       ← 1ms
│   input:  { query: "...", chunks: [...] }
│   output: { augmented_prompt: "Beantworte die folgende Frage..." }
│
└── Generation: "llm-call"                     ← 2.3s
    model:  "qwen3"
    input:  [{ role: "user", content: "Beantworte die folgende Frage..." }]
    output: "Machine Learning ist eine Methode der KI..."
    usage:  { input: 187, output: 94, total: 281 }
```

Jeder Knoten hat eigene Zeitstempel. Damit sieht man sofort: Die 2.3 Sekunden stecken in der Generation, nicht im Retrieval. Wenn das Retrieval plötzlich 500ms dauert, weiß man, dass dort das Problem liegt — nicht im LLM.

### Verschachtelung: Chain-Pattern

Bei einer mehrstufigen Kette (wie in `01_tracing/tracing_chain.py`) werden Spans ineinander verschachtelt:

```
Trace: "processing-chain"
├── Span: "input-processing"
│   input:  { raw: "  Was sind die DREI wichtigsten...  " }
│   output: { processed: "was sind die drei wichtigsten..." }
│
├── Generation: "llm-call"
│   model: "qwen3"
│   usage: { input: 42, output: 128, total: 170 }
│
└── Span: "output-processing"
    input:  { full_response: "Die drei wichtigsten...\n1. Python\n..." }
    output: { first_line: "Die drei wichtigsten..." }
```

Die Hierarchie macht **Ursachenanalyse** möglich: Ist die finale Antwort schlecht, weil der Input falsch vorverarbeitet wurde? Weil das LLM schlecht geantwortet hat? Oder weil die Nachbearbeitung relevante Teile abgeschnitten hat?

---

<a id="sec-tokens"></a>

## 3. Token-Kosten verstehen

### Die drei Token-Zähler

Jede Generation in Langfuse erfasst den **Token-Verbrauch** mit drei Werten:

| Feld | Bedeutung |
|------|-----------|
| **prompt_tokens** (input) | Anzahl der Tokens im Input — System-Prompt, Chat-Historie, RAG-Kontext, User-Nachricht |
| **completion_tokens** (output) | Anzahl der Tokens in der Antwort des Modells |
| **total_tokens** | Summe aus Input und Output |

```python
# So werden Token-Daten in Langfuse geloggt
usage_details = {
    "input": usage.prompt_tokens,    # z.B. 187
    "output": usage.completion_tokens, # z.B. 94
    "total": usage.total_tokens,      # z.B. 281
}
generation.update(output=answer, usage_details=usage_details)
```

### Warum Token-Tracking wichtig ist

Bei lokalen Modellen (LM Studio, Ollama) zahlt man keine Kosten pro Token — aber Token-Tracking ist trotzdem relevant:

- **Latenz**: Mehr Output-Tokens = längere Antwortzeit (Tokens werden sequentiell generiert)
- **Kontextfenster**: Jedes Modell hat ein maximales Kontextfenster. Wenn Input-Tokens das Limit erreichen, werden ältere Nachrichten abgeschnitten
- **Qualität**: Zu viele Input-Tokens (z.B. durch überladenen RAG-Kontext) können die Antwortqualität verschlechtern — das Modell „verliert" relevante Information im Rauschen

Bei Cloud-APIs (OpenAI, Anthropic) kommen echte Kosten dazu. Langfuse kann diese Kosten pro Trace, pro Nutzer und pro Zeitraum aggregieren.

### Cached Tokens

Manche APIs (z.B. OpenAI, Anthropic) geben zusätzlich **cached_tokens** zurück — Tokens, die aus dem serverseitigen KV-Cache bedient wurden und daher günstiger oder kostenlos sind. Bei lokalen Modellen über LM Studio ist dieser Wert in der Regel nicht verfügbar.

---

<a id="sec-sampling"></a>

## 4. Sampling vs. vollständiges Logging

### Das Problem bei hohem Traffic

In der Entwicklung loggt man jeden Request — bei 10 Requests pro Minute kein Problem. In Produktion mit 10.000 Requests pro Minute sieht die Rechnung anders aus:

| Faktor | Vollständig | 10% Sampling |
|--------|-------------|--------------|
| Gespeicherte Traces/Tag | 14.400.000 | 1.440.000 |
| Speicherbedarf | Hoch | 10x weniger |
| Dashboard-Ladezeit | Langsam | Schnell |
| Statistische Aussagekraft | Exakt | Ausreichend für Trends |

### Wann vollständig, wann samplen?

**Vollständiges Logging** (100%):
- Während der Entwicklung und beim Testen neuer Features
- Bei neuen Prompt-Versionen in den ersten Stunden nach dem Rollout
- Bei wenig Traffic (< 1.000 Requests/Tag)
- Wenn man Compliance-Anforderungen hat (jeder Request muss nachvollziehbar sein)

**Sampling** (1-10%):
- In Produktion bei hohem Traffic
- Wenn man primär an Trends interessiert ist (durchschnittliche Latenz, Score-Verteilung)
- Wenn Speicherkosten eine Rolle spielen

Langfuse überlässt die Sampling-Entscheidung dem Client-Code — man entscheidet selbst, für welche Requests ein Trace erstellt wird. Ein einfacher Ansatz:

```python
import random

if random.random() < 0.1:  # 10% Sampling
    trace = langfuse.start_span(name="request", input={"query": query})
    # ... trace the request ...
```

### Tipp für den Einstieg

In den Lern-Skripten dieses Projekts wird jeder Request getraced — das ist für Lernzwecke genau richtig. Über Sampling muss man erst nachdenken, wenn die Anwendung in Produktion geht.

---

<a id="sec-evaluation"></a>

## 5. Evaluation-Strategien

### Warum Evaluation schwer ist

Bei klassischer Software ist Evaluation binär: Der Test besteht oder er schlägt fehl. Bei LLM-Antworten gibt es ein Spektrum von „komplett falsch" über „teilweise richtig" bis „perfekt". Man braucht Methoden, die mit dieser Unschärfe umgehen können.

Langfuse unterstützt drei Ansätze, die sich in Aufwand, Genauigkeit und Skalierbarkeit unterscheiden:

### Rule-based Evaluation

Die einfachste Form: Regeln, die programmatisch prüfbar sind.

```python
# Enthält die Antwort die erwarteten Schlüsselwörter?
expected_keywords = ["supervised", "unsupervised"]
score = sum(1 for kw in expected_keywords if kw in answer.lower())
score_normalized = score / len(expected_keywords)

trace.score_trace(name="keyword-coverage", value=score_normalized)
```

**Vorteile**: Schnell, deterministisch, kostenlos.
**Nachteile**: Kann Nuancen nicht erfassen. „Überwachtes Lernen" statt „Supervised Learning" würde nicht erkannt.

### LLM-as-Judge

Ein zweiter LLM-Call bewertet die Antwort des ersten. Das Skript `03_evaluation/llm_as_judge.py` implementiert dieses Pattern:

1. Das LLM beantwortet eine Frage
2. Ein zweiter LLM-Call erhält Frage + Antwort und bewertet auf einer Skala von 1-10
3. Der Score wird aus der Judge-Antwort geparst und am Trace gespeichert

```python
judge_prompt = (
    "Bewerte die Qualität der Antwort auf einer Skala von 1 bis 10.\n"
    "Kriterien: Korrektheit, Vollständigkeit, Verständlichkeit.\n"
    "Antworte NUR mit einer einzigen Zahl zwischen 1 und 10."
)
```

**Vorteile**: Kann Nuancen erfassen, skaliert automatisch, braucht keine manuell annotierten Daten.
**Nachteile**: Kosten für den zweiten LLM-Call, der Judge kann sich irren (besonders bei fachspezifischen Themen), nicht deterministisch.

### Human Feedback

Menschen bewerten Traces manuell in der Langfuse-UI. Das ist der **Gold-Standard** für Qualität, aber der teuerste Ansatz.

**Vorteile**: Höchste Genauigkeit, erfasst Aspekte, die weder Regeln noch LLMs erkennen (Ton, Angemessenheit, kultureller Kontext).
**Nachteile**: Teuer, langsam, skaliert nicht.

### Welche Strategie wann?

| Strategie | Kosten | Genauigkeit | Skalierbarkeit | Einsatz |
|-----------|--------|-------------|-----------------|---------|
| Rule-based | Keine | Niedrig | Unbegrenzt | Grundlegende Checks (Format, Länge, Keywords) |
| LLM-as-Judge | Mittel | Mittel-Hoch | Gut | Automatische Qualitätsprüfung in Produktion |
| Human Feedback | Hoch | Sehr hoch | Gering | Ground-Truth-Aufbau, Stichproben, Edge Cases |

In der Praxis kombiniert man die Ansätze: Rule-based für jede Anfrage, LLM-as-Judge für eine Stichprobe, Human Feedback für die schwierigen Fälle.

---

<a id="sec-prompts"></a>

## 6. Prompt-Versionierung

### Warum Git allein nicht reicht

Prompts *können* in Git versioniert werden — sie sind schließlich Text. Aber Git ist für **Code-Versionierung** gebaut, nicht für **Prompt-Lifecycle-Management**. Die Probleme:

**Deployment-Kopplung**: Ein Prompt-Update in Git erfordert ein neues Deployment. Bei einer Web-App bedeutet das: Build, Test, Deploy — für eine einzige Textänderung. Mit Langfuse ändert man den Prompt im Dashboard, setzt das Label `"production"`, und der nächste Request verwendet automatisch die neue Version.

**Kein A/B-Testing**: In Git gibt es `main` und Branches. Will man zwei Prompt-Versionen parallel testen, braucht man Feature-Flags oder Routing-Logik. In Langfuse setzt man einfach verschiedene Labels (`"production"`, `"experiment-a"`) und routet per Label.

**Keine Prompt-Metriken**: Git zeigt, *dass* ein Prompt geändert wurde. Langfuse zeigt, *wie sich die Änderung auf Scores und Latenz ausgewirkt hat* — weil jede Generation mit der verwendeten Prompt-Version verknüpft ist.

### Wie es in der Praxis funktioniert

Das Skript `02_prompt_management/prompt_versioning.py` zeigt den Workflow:

```python
# 1. Template mit Variablen in Langfuse erstellen
langfuse.create_prompt(
    name="erklaer-konzept",
    prompt="Erkläre '{{concept}}' für {{audience}}. Maximal {{length}} Sätze.",
    labels=["production"],
)

# 2. Prompt zur Laufzeit abrufen (immer die aktuelle "production"-Version)
prompt = langfuse.get_prompt("erklaer-konzept", label="production")

# 3. Variablen einsetzen
compiled = prompt.compile(
    concept="Neuronale Netze",
    audience="Programmier-Anfänger",
    length="3",
)

# 4. Generation wird automatisch mit der Prompt-Version verknüpft
generation = trace.start_generation(
    name="response",
    prompt=prompt,  # ← Diese Zeile verknüpft Generation mit Prompt-Version
    input=[{"role": "user", "content": compiled}],
)
```

Der entscheidende Punkt: Im Code steht nirgends der Prompt-Text selbst. Der Code fragt Langfuse nach dem aktuellen Production-Prompt. Will man den Prompt ändern, ändert man ihn in Langfuse — der Code bleibt unverändert.

### Template-Syntax

Langfuse verwendet doppelte geschweifte Klammern für Variablen: `{{variable_name}}`. Die `compile()`-Methode ersetzt die Platzhalter mit den übergebenen Werten:

```python
template = "Erkläre '{{concept}}' in {{length}} Sätzen."
compiled = prompt.compile(concept="Gradient Descent", length="2")
# Ergebnis: "Erkläre 'Gradient Descent' in 2 Sätzen."
```

---

<a id="sec-references"></a>

## Quellen

- Langfuse (2024). *Langfuse Documentation*. [langfuse.com/docs](https://langfuse.com/docs)
- Langfuse (2024). *Python SDK Reference*. [python.reference.langfuse.com](https://python.reference.langfuse.com/)
- Zheng, L. et al. (2023). *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena*. [arxiv.org/abs/2306.05685](https://arxiv.org/abs/2306.05685)
- OpenTelemetry (2024). *Observability Primer*. [opentelemetry.io/docs/concepts/observability-primer](https://opentelemetry.io/docs/concepts/observability-primer/)
