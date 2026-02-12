# lm-stack

Ein Full-Stack-Projekt rund um Sprachmodelle — von selbst trainierten Modellen in Python über Ollama als Inference-Server bis hin zu KI-gestützten Web-Apps mit Next.js.

## Projekte

### Machine Learning (`machineLearning/`)

Praxisnahe ML-Projekte zum Lernen der Grundlagen:

- **Language Model** — LSTM- und Transformer-Modelle (MiniGPT) von Grund auf trainieren und ausführen, mit LoRA-Fine-Tuning, Web-Oberfläche (Gradio) und LLM-as-Judge-Evaluation.
  - Dokumentation:

    - **[LoRA erklärt](machineLearning/languageModel/docs/LORA_EXPLAINED.md)** — Parametereffizientes Fine-Tuning für Sprachmodelle.
      Full Fine-Tuning erfordert das Training aller Modellparameter — bei Qwen3-8B sind das 8 Milliarden Werte und über 16 GB GPU-Speicher allein zum Laden. LoRA friert die originalen Gewichte ein und trainiert stattdessen zwei kleine Matrizen pro Schicht, deren Produkt eine Low-Rank-Korrektur bildet. Dadurch werden nur 0,1–5 % der Parameter trainiert, während das vortrainierte Wissen erhalten bleibt. Ergebnis: Vergleichbare Qualität bei einem Bruchteil des Speicher- und Rechenbedarfs — unser MiniGPT-Adapter ist nur ~8 KB groß, ein Qwen3-Adapter ~18 MB.

    - **[Loss erklärt](machineLearning/languageModel/docs/LOSS_EXPLAINED.md)** — Wie misst man, ob ein Sprachmodell gute Vorhersagen trifft?
      Beim Training braucht man eine Zahl, die angibt, wie weit das Modell von der richtigen Antwort entfernt ist — ohne diese Rückmeldung kann es nicht lernen. Der Cross-Entropy Loss berechnet, wie „überrascht" das Modell vom tatsächlichen nächsten Wort ist. Als Referenzwert dient der Loss bei zufälligem Raten (`ln(Vokabulargröße)`), gegen den jeder Trainingswert eingeordnet wird. Eine einzelne Kennzahl, die den gesamten Lernfortschritt messbar macht.

    - **[Alignment erklärt](machineLearning/languageModel/docs/ALIGNMENT_EXPLAINED.md)** — Vom rohen Sprachmodell zum höflichen Assistenten.
      Ein vortrainiertes Sprachmodell hat kein Konzept von „richtig" oder „falsch" — es vervollständigt Text rein statistisch. Drei Methoden machen das Modell sicher und hilfreich: SFT (Supervised Fine-Tuning) trainiert erwünschte Antworten ein, RLHF (Reinforcement Learning from Human Feedback) lernt aus menschlichen Präferenzen, und DPO (Direct Preference Optimization) vereinfacht RLHF zu einem einzigen Trainingsschritt. Das Dokument zeigt auch, wie diese Schutzmechanismen per SFT oder Abliteration wieder entfernt werden können — und warum Alignment allein nicht reicht.

    - **[Guardrails erklärt](machineLearning/languageModel/docs/GUARDRAILS_EXPLAINED.md)** — Externe Schutzmechanismen auf API-Ebene.
      Alignment ist fragil — ein einfaches Fine-Tuning oder ein geschickter Jailbreak-Prompt kann es aushebeln. Guardrails sind externe Filter, die Eingaben und Ausgaben unabhängig vom Modell prüfen — per Classifier, Regex, Embedding-Vergleich und Grounding-Checks. Der Vergleich von AWS Bedrock, Azure AI Content Safety und OpenAI Moderation API zeigt, wie ein mehrschichtiges Sicherheitskonzept (Defense in Depth) selbst ein uncensored Modell absichern kann.
  - Notebooks:
    - [Logits-Visualisierung](machineLearning/languageModel/notebooks/logits_visualization.ipynb) — Wie ein Sprachmodell Tokens vorhersagt
    - [Block-Reproduzierbarkeit](machineLearning/languageModel/notebooks/blocks_reproducibility.ipynb) — Transformer-Blöcke im Detail
    - [Modellvergleich](machineLearning/languageModel/notebooks/model_comparison.ipynb) — LSTM vs. Transformer Gegenüberstellung
    - [LLM-as-Judge](machineLearning/languageModel/notebooks/llm_as_judge.ipynb) — Automatische Modellbewertung durch ein LLM
- **Numeric Model** — Decision-Tree-Regression auf Immobiliendaten, exportiert als ONNX für portablen Einsatz.
  - [Training](machineLearning/numericModel/notebooks/training.ipynb) — Modelltraining und Evaluation
  - [Visualisierung](machineLearning/numericModel/notebooks/visualize.ipynb) — Ergebnisse und Entscheidungsbaum

### Quantisierung (`machineLearning/quantization/`)

Werkzeuge und Erklärungen rund um Modell-Quantisierung:

- [Quantisierung erklärt](machineLearning/quantization/quantization_explained.ipynb) — Von FP64 bis INT4: Was passiert bei der Quantisierung, wie viel Speicher spart man, wie viel Qualität verliert man?
- **GGUF Converter** — Trainierte HuggingFace-Modelle ins GGUF-Format konvertieren, für Ollama oder LM Studio

### Web App (`nextJs/`)

Eine Next.js-Anwendung mit Ollama-Anbindung für KI-Chat und Prisma mit PostgreSQL (pgvector) als Datenbank.

### MCP Server (`mcp/`)

Ein Model-Context-Protocol-Server, der Werkzeuge (Datum/Uhrzeit, Zufallszahlen etc.) für KI-Agenten und Clients bereitstellt.

### LangGraph Agent (`lang-graph/`)

Ein KI-Agent auf Basis von LangGraph mit Tool-Anbindung und Graph-basierter Ablaufsteuerung.

### n8n Integration Testing (`n8n/`)

n8n dient als zentrale Testumgebung, um die Verbindung zwischen den Stack-Komponenten (PostgreSQL, Ollama, MCP Server, LM Studio) zu verifizieren.

## Erste Schritte

Jedes Projekt hat ein eigenes Setup — siehe die jeweilige README oder `package.json` im Unterordner. Die Docker-Dienste lassen sich starten mit:

```bash
docker compose up
```
