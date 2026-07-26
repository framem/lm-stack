# ai-sdk

Minimales Setup mit dem [Vercel AI SDK](https://ai-sdk.dev) (v7) und [Zod](https://zod.dev) (v4).

Der Nutzertext wird in genau eine Kategorie einsortiert — **Lebensmittel** oder **Werkzeug** — und zusätzlich zu der Kategorie werden die **Token-Logprobs** der Antwort ausgegeben: pro Position der gewählte Token, seine Wahrscheinlichkeit und die Top-Alternativen, die das Modell verworfen hat.

## Setup

```bash
npm install
cp .env.example .env
```

Anschließend in LM Studio ein Modell laden (Standard in `.env.example`: `lfm2-1.2b-rag`) und den lokalen Server auf Port `1234` starten.

## Nutzung

```bash
npm run classify -- "Ein Schraubenzieher"
npm run classify -- "Ein reifer Apfel" "Sauerteigbrot"   # mehrere Texte
npm run classify                                          # Beispieltexte
```

Beispielausgabe:

```
Text:      Ein Schraubenzieher
Kategorie: Werkzeug

  Kategorie-Wahrscheinlichkeiten (Entscheidungs-Token #4 = "W"):
    Werkzeug        99.91 %  ██████████████████████████████
    Lebensmittel     0.09 %

  Token-Logprobs der Antwort:
    #0  "{\""            logprob  -16.6302  p =   0.00 %
         ↳ "W"              logprob   -0.0011  p =  99.89 %
         ↳ "L"              logprob   -7.3933  p =   0.06 %
    ...
    #4  "W"              logprob   -0.0009  p =  99.91 %
         ↳ "L"              logprob   -7.0324  p =   0.09 %
```

## Aufbau

| Datei                 | Inhalt                                                                       |
| --------------------- | ---------------------------------------------------------------------------- |
| `src/llm.ts`          | Provider-Factory (LM Studio, vLLM, Ollama, AI Gateway) — analog `nextjs-movie-flix/src/lib/llm.ts` |
| `src/schema.ts`       | Zod-Schemas: Kategorien und das rohe Logprobs-Format der Antwort              |
| `src/probabilities.ts`| Umrechnung Logprob → Wahrscheinlichkeit, Herleitung der Kategorie-Verteilung  |
| `src/classify.ts`     | Der eigentliche `generateText`-Aufruf                                        |
| `src/index.ts`        | CLI und Ausgabe                                                              |

## Wie die Logprobs ins Ergebnis kommen

Das AI SDK stellt Logprobs nicht normalisiert bereit, deshalb drei Schritte:

1. **Anfordern** — `@ai-sdk/openai-compatible` reicht unbekannte `providerOptions`-Keys unverändert in den Request-Body durch. Deshalb `snake_case`:

   ```ts
   providerOptions: { lmstudio: { logprobs: true, top_logprobs: 5 } }
   ```

2. **Rohe Antwort behalten** — standardmäßig verwirft `generateText` den Response-Body:

   ```ts
   include: { responseBody: true }   // danach: result.response.body
   ```

3. **Validieren** — `extractLogprobs()` in `src/schema.ts` parst `result.response.body` mit Zod und liefert `null`, wenn das Backend keine Logprobs geschickt hat.

## Kategorie-Wahrscheinlichkeiten

`Output.choice()` erzwingt per Constrained Decoding gültigen JSON (`{"result":"Werkzeug"}`), das Label steckt also mitten im Token-Strom. `deriveCategoryDistribution()` sucht die erste Position, an der der **gewählte** Token genau eine Kategorie beginnt und eine Alternative eine andere — dort hat sich das Modell tatsächlich entschieden — und normalisiert diese Kandidaten zu einer Verteilung.

Das ist eine Heuristik: sie braucht `top_logprobs` und funktioniert nur, solange sich die Labels bereits im ersten Token unterscheiden (`L…` vs. `W…`).

> Am Token `#0` listen die Alternativen `W`/`L` mit hoher Wahrscheinlichkeit, obwohl `{` gewählt wurde — das ist die *unconstrained* Präferenz des Modells, bevor die JSON-Grammatik greift. Genau deshalb ankert die Heuristik am gewählten Token und nicht nur an den Alternativen.

## Provider

| Provider   | Logprobs | Hinweis                                                    |
| ---------- | -------- | ---------------------------------------------------------- |
| `lmstudio` | ja       | Standard. Abhängig von Modell/Runtime — MLX-Modelle liefern teils `logprobs: null` |
| `vllm`     | ja       |                                                            |
| `ollama`   | nein     | Klassifikation funktioniert, Logprobs-Tabelle bleibt leer   |
| `gateway`  | modellabhängig | Vercel AI Gateway                                     |

Umschalten über `LLM_PROVIDER` / `LLM_MODEL` / `LLM_PROVIDER_URL` in der `.env` — siehe `.env.example`.

## Reasoning

Für ein Ein-Wort-Label ist die Denkphase reiner Overhead: Ein Reasoning-Modell verbraucht das Token-Budget zuerst fürs Denken und nennt die Kategorie erst danach. Bei einem Text, der in keine Kategorie passt, kann es sich dabei im Kreis drehen, bis der Kontext voll ist — dann kommt gar keine Antwort. Abgeschaltet wird sie über `reasoningEffort: 'none'`; Modelle ohne Denkphase ignorieren das.

Ein Lauf misst grundsätzlich **beide Modi**, damit die Zahlen vergleichbar sind. `LLM_REASONING` (Standard `false`) wählt nur, welcher Modus zusätzlich die ausführliche Token-Ausgabe ins Log schreibt — bei `ollama`/`gateway`, wo sich Reasoning nicht abschalten lässt, legt es den einen laufenden Modus fest.

Am Beispiel `google/gemma-4-12b-qat` über alle Beispieltexte: **2 min 26 s mit Reasoning, 4,9 s ohne** — bei gleicher Trefferquote.

## Berichte

Jeder Lauf schreibt seine Ergebnisse nach `reports/<modell>.md` — eine Datei pro Modell, mit je einem Abschnitt pro Modus:

```
reports/
  gemma-4-12b-qat.md
  lfm2-1.2b-rag.md
```

Läufe stehen nach Datum sortiert, der neueste oben; ein zweiter Lauf am selben Tag ersetzt den Abschnitt dieses Tages, statt ihn zu verdoppeln. So wächst pro Modell eine Historie.

Ein anderes Modell vermisst man ohne Änderung an der `.env`:

```bash
LLM_MODEL=lfm2-1.2b-rag npm run classify
```
