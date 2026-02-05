# GGUF Converter

Docker-Container zur Konvertierung von HuggingFace-Modellen zu GGUF (fuer LM Studio, llama.cpp, Ollama).

## Unterstuetzte Architekturen

| Architektur | HuggingFace Klasse | Status |
|-------------|-------------------|--------|
| LLaMA | `LlamaForCausalLM` | Empfohlen |
| Mistral | `MistralForCausalLM` | OK |
| Falcon | `FalconForCausalLM` | OK |
| Phi | `PhiForCausalLM` | OK |
| Qwen2 | `Qwen2ForCausalLM` | OK |
| Gemma | `GemmaForCausalLM` | OK |

## Verwendung

### Image bauen

```bash
docker compose build gguf-converter
```

### Mini-LLaMA Modell konvertieren

```bash
# Basis-Konvertierung (F16)
docker compose run --rm gguf-converter /app/convert.sh --input /models/input/llama_mini --output /models/output/llama-mini.gguf

# Mit Quantisierung (kleiner, schneller)
docker compose run --rm gguf-converter /app/convert.sh --input /models/input/llama_mini --output /models/output/llama-mini.gguf --quantize q4_0
```

### Hilfe anzeigen

```bash
docker compose run --rm gguf-converter /app/convert.sh --help
```

### Unterstuetzte Architekturen auflisten

```bash
docker compose run --rm gguf-converter /app/convert.sh --list
```

## Quantisierungsoptionen

| Typ | Bits | Groesse | Qualitaet |
|-----|------|---------|-----------|
| `q8_0` | 8-bit | ~50% | Beste |
| `q5_1` | 5-bit | ~35% | Sehr gut |
| `q5_0` | 5-bit | ~35% | Gut |
| `q4_1` | 4-bit | ~25% | Akzeptabel |
| `q4_0` | 4-bit | ~25% | Kleinste |

## Output

Die konvertierten GGUF-Dateien landen in:
```
languageModel/dist/gguf_converted/
├── llama-mini.gguf
└── llama-mini-q4_0.gguf
```

## In LM Studio importieren

```bash
# Via CLI
lms import -c ../../languageModel/dist/gguf_converted/llama-mini.gguf

# Oder: Datei manuell in LM Studio oeffnen
```
