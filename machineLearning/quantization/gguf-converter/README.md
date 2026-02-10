# GGUF Converter

Docker container for converting HuggingFace models to GGUF (for LM Studio, llama.cpp, Ollama).

## Supported Architectures

| Architecture | HuggingFace Class | Status |
|-------------|-------------------|--------|
| LLaMA | `LlamaForCausalLM` | Recommended |
| Mistral | `MistralForCausalLM` | OK |
| Falcon | `FalconForCausalLM` | OK |
| Phi | `PhiForCausalLM` | OK |
| Qwen2 | `Qwen2ForCausalLM` | OK |
| Gemma | `GemmaForCausalLM` | OK |

## Usage

### Build Image

```bash
docker compose build gguf-converter
```

### Convert Mini-LLaMA Model

```bash
# Base conversion (F16)
docker compose run --rm gguf-converter /app/convert.sh --input /models/input/llama_mini --output /models/output/llama-mini.gguf

# With quantization (smaller, faster)
docker compose run --rm gguf-converter /app/convert.sh --input /models/input/llama_mini --output /models/output/llama-mini.gguf --quantize q4_0
```

### Show Help

```bash
docker compose run --rm gguf-converter /app/convert.sh --help
```

### List Supported Architectures

```bash
docker compose run --rm gguf-converter /app/convert.sh --list
```

## Quantization Options

| Type | Bits | Size | Quality |
|-----|------|---------|-----------|
| `q8_0` | 8-bit | ~50% | Best |
| `q5_1` | 5-bit | ~35% | Very good |
| `q5_0` | 5-bit | ~35% | Good |
| `q4_1` | 4-bit | ~25% | Acceptable |
| `q4_0` | 4-bit | ~25% | Smallest |

## Output

Converted GGUF files are stored in:
```
languageModel/dist/gguf_converted/
├── llama-mini.gguf
└── llama-mini-q4_0.gguf
```

## Import into LM Studio

```bash
# Via CLI
lms import -c ../../languageModel/dist/gguf_converted/llama-mini.gguf

# Or: Open file manually in LM Studio
```
