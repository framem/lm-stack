# GGUF Converter

Docker-Container zur Konvertierung von HuggingFace-Modellen zu GGUF (für LM Studio, llama.cpp, Ollama).

## Unterstützte Architekturen

| Architektur | HuggingFace Klasse | Status |
|-------------|-------------------|--------|
| GPT-2 | `GPT2LMHeadModel` | ✅ |
| LLaMA | `LlamaForCausalLM` | ✅ |
| Mistral | `MistralForCausalLM` | ✅ |
| Falcon | `FalconForCausalLM` | ✅ |
| Phi | `PhiForCausalLM` | ✅ |
| Qwen2 | `Qwen2ForCausalLM` | ✅ |
| Gemma | `GemmaForCausalLM` | ✅ |

## Verwendung

### Image bauen

```bash
docker compose build gguf-converter
```

### Modell konvertieren

```bash
docker compose run --rm gguf-converter /app/convert.sh --input /models/input/gpt2_lm_studio --output /models/output/gpt2-mini.gguf

# Mit Quantisierung
docker compose run --rm gguf-converter /app/convert.sh --input /models/input/gpt2_lm_studio --output /models/output/gpt2-mini.gguf --quantize q4_0
```

### Hilfe anzeigen

```bash
docker compose run --rm gguf-converter /app/convert.sh --help
```

### Unterstützte Architekturen auflisten

```bash
docker compose run --rm gguf-converter /app/convert.sh --list
```

## Quantisierungsoptionen

| Typ | Bits | Größe | Qualität |
|-----|------|-------|----------|
| `q8_0` | 8-bit | ~50% | Beste |
| `q5_1` | 5-bit | ~35% | Sehr gut |
| `q5_0` | 5-bit | ~35% | Gut |
| `q4_1` | 4-bit | ~25% | Akzeptabel |
| `q4_0` | 4-bit | ~25% | Niedrigste |

## Output

Die konvertierten GGUF-Dateien landen in:
```
languageModel/dist/gguf_converted/
├── gpt2-mini.gguf
└── gpt2-mini-q4_0.gguf
```

## In LM Studio importieren

```bash
lms import -c ../../languageModel/dist/gguf_converted/gpt2-mini.gguf
lms import -c ../../languageModel/dist/gguf_converted/gpt2-mini-q4_0.gguf
```
