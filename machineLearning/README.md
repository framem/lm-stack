# Machine Learning

Didactic ML projects: a language model (LSTM & Transformer) and a numeric regression model (Decision Tree).

## Project Structure

```
machineLearning/
├── languageModel/                         # Text generation models
│   ├── src/
│   │   ├── main.py                        # Entry point - interactive menu
│   │   ├── training/
│   │   │   ├── training_lstm.py           # LSTM-based model
│   │   │   ├── training_transformer.py    # Custom Transformer/MiniGPT
│   │   │   ├── training_config.py         # Training configuration
│   │   │   ├── training_data.py           # German training sentences
│   │   │   ├── finetuning_transformer.py  # Fine-tuning with LoRA
│   │   │   └── model_report.py            # Generate model reports
│   │   └── inference/
│   │       ├── inference_lstm.py          # LSTM inference
│   │       ├── inference_transformer.py   # Transformer inference
│   │       └── inference_finetuned.py     # Fine-tuned model inference
│   ├── notebooks/
│   │   ├── logits_visualization.ipynb     # Logits & embedding analysis
│   │   └── model_comparison.ipynb         # LSTM vs. Transformer comparison
│   ├── docs/
│   │   └── LORA_EXPLAINED.md              # LoRA fine-tuning explanation
│   └── dist/                              # Trained models output
│       ├── lstm_model/
│       └── transformer_model/
│
├── numericModel/                          # Numeric regression model
│   ├── src/
│   │   └── train_and_export.py            # Train Decision Tree & export ONNX
│   ├── data/
│   │   └── melb_data.csv                  # Melbourne housing dataset
│   └── notebooks/
│       └── training.ipynb                 # Training notebook
│
└── requirements.txt                       # Shared dependencies
```

## Quick Start

### 1. Setup Environment

```bash
cd machineLearning
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
```

### 2. Language Model

```bash
python languageModel/src/main.py
```

Interactive menu to:
- Train models (LSTM, Transformer)
- Fine-tune models with LoRA
- Run inference with trained models

**Training directly:**
```bash
python languageModel/src/training/training_lstm.py
python languageModel/src/training/training_transformer.py
python languageModel/src/training/finetuning_transformer.py
```

**Inference directly:**
```bash
python languageModel/src/inference/inference_lstm.py
python languageModel/src/inference/inference_transformer.py
python languageModel/src/inference/inference_finetuned.py
```

### 3. Numeric Model

```bash
python numericModel/src/train_and_export.py
```

Trains a Decision Tree on Melbourne housing data and exports it as ONNX model.

---

## Language Model

### Architectures

| Model | Architecture | Parameters | Use Case |
|-------|--------------|------------|----------|
| LSTM | Simple RNN | ~31K | Learning basics |
| Transformer | Custom MiniGPT | ~109K | Understanding attention |

### LSTM (Long Short-Term Memory)

LSTM is a variant of Recurrent Neural Networks (RNN) specifically designed for learning long sequences. Special gates control the information flow:

- **Forget Gate**: Decides which information to forget
- **Input Gate**: Decides which new information to store
- **Output Gate**: Decides which information to output

### Transformer

The Transformer uses Self-Attention instead of recursion. Each word can directly "look at" all other words - this enables parallel processing and better learning of dependencies.

### Logits

Logits are the **raw, unnormalized output values** of a neural network - the values *before* Softmax is applied.

```
Input: "The cat sits on the"

Logits (raw):          Softmax (probabilities):
  "table"  →  4.2         "table"  →  45%
  "sofa"   →  3.1         "sofa"   →  15%
  "floor"  →  2.8         "floor"  →  11%
  Sum: arbitrary           Sum: 100%
```

**Temperature sampling** scales the logits before Softmax:
- `temp < 1`: Amplifies differences → more conservative output
- `temp > 1`: Reduces differences → more creative/random output

---

## Numeric Model

Decision Tree Regressor on the Melbourne Housing Dataset. Trained on features like Rooms, Distance, Bathroom, etc. and predicts the price. Exported as ONNX for portable deployment.

---

## Requirements

- Python 3.14+
- PyTorch 2.0+
- pandas
- scikit-learn
- skl2onnx
- matplotlib
- jupyter
