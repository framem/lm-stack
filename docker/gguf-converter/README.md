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
 # Konvertieren                                                                                                                                        
  docker compose run --rm gguf-converter /app/convert.sh --input /models/input/hf_gpt2_model --output /models/output/mini-gpt2.gguf
                                                                                                                                                        
  # Mit Quantisierung                                                          
  docker compose run --rm gguf-converter /app/convert.sh --input /models/input/hf_gpt2_model --output /models/output/mini-gpt2.gguf --quantize q4_0
```

### Hilfe anzeigen

```bash
docker compose run --rm gguf-converter /app/convert.sh --help
```

### Unterstützte Architekturen auflisten

```bash
docker compose run --rm gguf-converter /app/convert.sh --list
```

## Volumes

| Container-Pfad | Host-Pfad | Beschreibung |
|---------------|-----------|--------------|
| `/models/input` | `./customModel/training/models` | HF-Modelle (read-only) |
| `/models/output` | `./customModel/training/models/gguf` | GGUF Output |

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
customModel/training/models/gguf/
├── mini-gpt2.gguf
└── mini-gpt2-q4_0.gguf
```

## In LM Studio verwenden

1. LM Studio öffnen
2. "My Models" auswählen
3. GGUF-Datei importieren/hinzufügen
4. Modell laden und chatten
