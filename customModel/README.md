# Custom Language Model Training

A didactic project for learning how language models work, from simple LSTM to GPT-2 architecture.

## Project Structure

```
customModel/
├── src/
│   ├── main.py              # Entry point - interactive menu
│   ├── training/            # Model training scripts
│   │   ├── simple_language_model.py      # LSTM-based model (beginner)
│   │   ├── transformer_language_model.py # Custom Transformer/MiniGPT
│   │   ├── gpt_transformer_language_model.py  # HuggingFace GPT-2
│   │   ├── gpt2_lm_studio.py             # GPT-2 for LM Studio
│   │   └── model_report.py               # Generate model reports
│   ├── inference/           # Text generation scripts
│   │   ├── inference.py                  # LSTM inference
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
│   └── gguf/                # Quantized GGUF models
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
python simple_language_model.py      # Train LSTM
python transformer_language_model.py # Train Transformer
python gpt_transformer_language_model.py  # Train HF GPT-2
```

**Inference:**
```bash
cd src/inference
python inference.py                  # LSTM text generation
python inference_transformer.py      # Transformer generation
python inference_hf_gpt2.py          # GPT-2 generation
```

## Model Architectures

| Model | Architecture | Parameters | Use Case |
|-------|--------------|------------|----------|
| LSTM | Simple RNN | ~10K | Learning basics |
| Transformer | Custom MiniGPT | ~50K | Understanding attention |
| HF GPT-2 | HuggingFace GPT-2 | ~500K+ | LM Studio compatible |

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
