# Custom Language Model Training

A didactic project for learning how language models work, from simple LSTM to GPT-2 architecture.

## Project Structure

```
customModel/
├── src/
│   ├── main.py              # Entry point - interactive menu
│   ├── training/            # Model training scripts
│   │   ├── training_lstm.py              # LSTM-based model (beginner)
│   │   ├── training_transformer.py       # Custom Transformer/MiniGPT
│   │   ├── training_hf_gpt2.py           # HuggingFace GPT-2
│   │   ├── training_gpt2_lm_studio.py    # GPT-2 for LM Studio
│   │   └── model_report.py               # Generate model reports
│   ├── inference/           # Text generation scripts
│   │   ├── inference_lstm.py             # LSTM inference
│   │   ├── inference_transformer.py      # Transformer inference
│   │   └── inference_hf_gpt2.py          # GPT-2 inference
│   └── shared/              # Shared resources
│       ├── sample_data.py                # Example training data
│       ├── logits_visualization.ipynb    # Jupyter notebook for analysis
│       └── *.png                         # Training visualizations
├── dist/                    # Trained models output
│   ├── lstm_model/          # Simple LSTM model
│   ├── transformer_model/   # Custom Transformer model
│   ├── hf_gpt2_model/       # HuggingFace GPT-2 model
│   ├── gpt2_lm_studio/      # GPT-2 optimized for LM Studio
│   └── gguf_converted/      # Converted GGUF models (via llama.cpp)
├── requirements.txt
└── README.md
```

## Quick Start

### 1. Setup Environment

```bash
cd customModel
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
```

### 2. Run Interactive Menu

```bash
python src/main.py
```

This opens a menu to:
- Train models (LSTM, Transformer, GPT-2)
- Run inference with trained models

### 3. Run Scripts Directly

**Training:**
```bash
cd src/training
python training_lstm.py              # Train LSTM
python training_transformer.py       # Train Transformer
python training_hf_gpt2.py           # Train HF GPT-2
```

**Inference:**
```bash
cd src/inference
python inference_lstm.py             # LSTM text generation
python inference_transformer.py      # Transformer generation
python inference_hf_gpt2.py          # GPT-2 generation
```

## Model Architectures

| Model | Architecture | Parameters | Use Case |
|-------|--------------|------------|----------|
| LSTM | Simple RNN | ~10K | Learning basics |
| Transformer | Custom MiniGPT | ~50K | Understanding attention |
| HF GPT-2 | HuggingFace GPT-2 | ~500K+ | LM Studio compatible |

### LSTM (Long Short-Term Memory)

LSTM ist eine Variante von Recurrent Neural Networks (RNN), die speziell für das Lernen von langen Sequenzen entwickelt wurde. Im Gegensatz zu einfachen RNNs kann ein LSTM sich an Informationen über viele Zeitschritte hinweg "erinnern" durch spezielle Gates:

- **Forget Gate**: Entscheidet, welche Informationen vergessen werden
- **Input Gate**: Entscheidet, welche neuen Informationen gespeichert werden
- **Output Gate**: Entscheidet, welche Informationen ausgegeben werden

```
Eingabe: "Die Katze sitzt auf dem"
LSTM lernt: Nach "die katze" kommt oft "sitzt", "schläft", "jagt"...
```

### Transformer

Der Transformer verwendet Self-Attention statt Rekursion. Jedes Wort kann direkt auf alle anderen Wörter "schauen" - das ermöglicht parallele Verarbeitung und besseres Lernen von Zusammenhängen.

### GPT-2 (Generative Pre-trained Transformer)

GPT-2 ist ein großes Transformer-Modell von OpenAI. Die HuggingFace-Version ermöglicht einfaches Training und Export zu GGUF für LM Studio.

### Logits

Logits sind die **rohen, unnormalisierten Ausgabewerte** eines neuronalen Netzes - also die Werte *bevor* Softmax angewendet wird. Sie werden bei jedem Forward-Pass berechnet (Training UND Inferenz).

```
Eingabe: "Die Katze sitzt auf dem"

Logits (roh):          Softmax (Wahrscheinlichkeiten):
  "tisch"  →  4.2         "tisch"  →  45%
  "sofa"   →  3.1         "sofa"   →  15%
  "boden"  →  2.8         "boden"  →  11%
  "stuhl"  →  2.5         "stuhl"  →   8%
  ...                     ...
  Summe: beliebig         Summe: 100%
```

**Logits beim Training:**
1. Forward-Pass: Eingabe → Logits berechnen
2. Loss berechnen: Logits mit erwartetem Wort vergleichen (Cross-Entropy)
3. Backward-Pass: Gewichte anpassen, damit Logits beim nächsten Mal besser sind

**Logits bei der Inferenz:**
1. Forward-Pass: Eingabe → Logits berechnen
2. Softmax: Logits in Wahrscheinlichkeiten umwandeln
3. Sampling: Nächstes Wort basierend auf Wahrscheinlichkeiten wählen

**Temperature-Sampling** skaliert die Logits vor Softmax:
- `temp < 1`: Verstärkt Unterschiede → konservativere Ausgabe
- `temp > 1`: Verringert Unterschiede → kreativere/zufälligere Ausgabe

## Features

- **Top-K / Top-P Sampling**: Control text generation randomness
- **Logits Visualization**: See model predictions in detail
- **Model Reports**: Auto-generated architecture documentation
- **GGUF Export**: Convert to LM Studio format

## GGUF Conversion (for LM Studio)

The HF GPT-2 models can be converted to GGUF format using llama.cpp:

```bash
# Supported architectures for conversion:
# - GPT2LMHeadModel (GPT-2)
# - LlamaForCausalLM (LLaMA)
# - MistralForCausalLM (Mistral)
# - PhiForCausalLM (Phi)
```

The converter reads `config.json` to determine weight mappings:
- Q/K/V projections: `c_attn`
- Feed-Forward: `mlp.c_fc`, `mlp.c_proj`

## Training Data

Example German sentences are used for training (in `src/shared/sample_data.py`):
```python
from shared import TRAINING_DATA_DE, TRAINING_DATA_EN
```

## Requirements

- Python 3.10+
- PyTorch 2.0+
- transformers 4.36+
- tokenizers 0.15+
