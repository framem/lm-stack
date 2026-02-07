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

**Training direkt:**
```bash
python languageModel/src/training/training_lstm.py
python languageModel/src/training/training_transformer.py
python languageModel/src/training/finetuning_transformer.py
```

**Inference direkt:**
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

LSTM ist eine Variante von Recurrent Neural Networks (RNN), die speziell für das Lernen von langen Sequenzen entwickelt wurde. Spezielle Gates steuern den Informationsfluss:

- **Forget Gate**: Entscheidet, welche Informationen vergessen werden
- **Input Gate**: Entscheidet, welche neuen Informationen gespeichert werden
- **Output Gate**: Entscheidet, welche Informationen ausgegeben werden

### Transformer

Der Transformer verwendet Self-Attention statt Rekursion. Jedes Wort kann direkt auf alle anderen Wörter "schauen" - das ermöglicht parallele Verarbeitung und besseres Lernen von Zusammenhängen.

### Logits

Logits sind die **rohen, unnormalisierten Ausgabewerte** eines neuronalen Netzes - die Werte *bevor* Softmax angewendet wird.

```
Eingabe: "Die Katze sitzt auf dem"

Logits (roh):          Softmax (Wahrscheinlichkeiten):
  "tisch"  →  4.2         "tisch"  →  45%
  "sofa"   →  3.1         "sofa"   →  15%
  "boden"  →  2.8         "boden"  →  11%
  Summe: beliebig         Summe: 100%
```

**Temperature-Sampling** skaliert die Logits vor Softmax:
- `temp < 1`: Verstärkt Unterschiede → konservativere Ausgabe
- `temp > 1`: Verringert Unterschiede → kreativere/zufälligere Ausgabe

---

## Numeric Model

Decision Tree Regressor auf dem Melbourne Housing Dataset. Trainiert auf Features wie Rooms, Distance, Bathroom, etc. und sagt den Preis voraus. Export als ONNX für portablen Einsatz.

---

## Requirements

- Python 3.14+
- PyTorch 2.0+
- pandas
- scikit-learn
- skl2onnx
- matplotlib
- jupyter
