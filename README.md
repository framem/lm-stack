# lm-stack

Ein Full-Stack-Projekt rund um Sprachmodelle — von selbst trainierten Modellen in Python über Ollama als Inference-Server bis hin zu KI-gestützten Web-Apps mit Next.js.

## Projekte

### Machine Learning (`machineLearning/`)

Praxisnahe ML-Projekte zum Lernen der Grundlagen:

- **Language Model** — LSTM- und Transformer-Modelle (MiniGPT) von Grund auf trainieren und ausführen, mit LoRA-Fine-Tuning, Web-Oberfläche (Gradio) und LLM-as-Judge-Evaluation.
  - Dokumentation:
    - [LoRA erklärt](machineLearning/languageModel/docs/LORA_EXPLAINED.md) — Was ist LoRA, wie funktioniert es, wann lohnt es sich?
    - [Loss erklärt](machineLearning/languageModel/docs/LOSS_EXPLAINED.md) — Cross-Entropy Loss verstehen und einordnen
    - [Alignment erklärt](machineLearning/languageModel/docs/ALIGNMENT_EXPLAINED.md) — Wie LLMs „erzogen" werden (SFT, RLHF, DPO)
    - [Guardrails erklärt](machineLearning/languageModel/docs/GUARDRAILS_EXPLAINED.md) — Schutzmechanismen außerhalb des Modells
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
