"""
Model Report Generator
======================

Generiert detaillierte Markdown-Reports für trainierte Modelle.
Unterstützt LSTM und Transformer Architekturen.
"""

from pathlib import Path
import torch.nn as nn


def count_parameters(model: nn.Module) -> int:
    """Zählt alle trainierbaren Parameter eines Modells."""
    return sum(p.numel() for p in model.parameters() if p.requires_grad)


def get_layer_params(model: nn.Module) -> dict:
    """Analysiert die Parameter pro Layer."""
    layer_params = {}
    for name, module in model.named_modules():
        if isinstance(module, (nn.Linear, nn.Embedding, nn.LSTM, nn.LayerNorm)):
            params = sum(p.numel() for p in module.parameters())
            if params > 0:
                layer_params[name] = {
                    'type': type(module).__name__,
                    'params': params,
                    'module': module
                }
    return layer_params


def generate_model_report(model: nn.Module, save_path: Path, model_name: str = None) -> str:
    """
    Erstellt einen detaillierten Modell-Report als Markdown-Datei.

    Unterstützt:
    - SimpleLanguageModel (LSTM)
    - MiniGPT (Transformer)

    Args:
        model: Das PyTorch-Modell
        save_path: Pfad zum Speichern des Reports
        model_name: Optional - Name des Modells für den Report

    Returns:
        Der generierte Report als String
    """
    save_path = Path(save_path)
    total_params = count_parameters(model)

    # Modelltyp erkennen
    model_class = type(model).__name__

    # Speichergröße schätzen (float32 = 4 bytes)
    memory_kb = (total_params * 4) / 1024
    memory_str = f"~{memory_kb:.0f} KB" if memory_kb < 1024 else f"~{memory_kb/1024:.1f} MB"

    # Vergleichsfaktoren
    gpt2_factor = 124_000_000 / total_params
    gpt3_factor = 175_000_000_000 / total_params

    # Modell-spezifische Architektur und Parameter-Tabelle
    if model_class == "SimpleLanguageModel":
        report = _generate_lstm_report(model, total_params, memory_str, gpt2_factor, gpt3_factor)
    elif model_class == "MiniGPT":
        report = _generate_transformer_report(model, total_params, memory_str, gpt2_factor, gpt3_factor)
    else:
        report = _generate_generic_report(model, total_params, memory_str, gpt2_factor, gpt3_factor)

    # Datei speichern
    report_path = save_path / "MODEL_REPORT.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"📊 Report gespeichert: {report_path}")
    return report


def _generate_lstm_report(model, total_params, memory_str, gpt2_factor, gpt3_factor) -> str:
    """Generiert Report für LSTM-Modell."""
    vocab_size = model.vocab_size
    embed_dim = model.embedding_dim
    hidden_dim = model.hidden_dim

    # Parameter berechnen
    embedding_params = vocab_size * embed_dim
    lstm_params = 4 * (embed_dim * hidden_dim + hidden_dim * hidden_dim + 2 * hidden_dim)
    linear_params = hidden_dim * vocab_size + vocab_size

    return f"""# Modell-Report: miniLSTM

## Architektur

```
Embedding: {vocab_size} Wörter → {embed_dim}D
LSTM:      {embed_dim}D → {hidden_dim}D hidden
Output:    {hidden_dim}D → {vocab_size} Logits
```

## Parameter-Berechnung

| Layer | Formel | Parameter |
|-------|--------|-----------|
| **Embedding** | vocab × embed_dim | {vocab_size} × {embed_dim} = **{embedding_params:,}** |
| **LSTM** | 4 × (input × hidden + hidden² + 2×hidden) | 4 × ({embed_dim}×{hidden_dim} + {hidden_dim}×{hidden_dim} + {2*hidden_dim}) = **{lstm_params:,}** |
| **Linear** | hidden × vocab + bias | {hidden_dim} × {vocab_size} + {vocab_size} = **{linear_params:,}** |
| **Total** | | **{total_params:,}** |

**~{total_params//1000}k Parameter**

## Speicherbedarf

- Modell-Weights: {memory_str}
- Ein modernes LLM braucht 50-500 GB

## Vergleich mit anderen Modellen

| Modell | Parameter | Vergleich |
|--------|-----------|-----------|
| **Dein miniLSTM** | {total_params:,} | - |
| GPT-2 Small | 124M | {gpt2_factor:,.0f}× größer |
| GPT-3 | 175B | {gpt3_factor:,.0f}× größer |
| Llama 3 70B | 70B | {70_000_000_000/total_params:,.0f}× größer |
| Claude | nicht veröffentlicht | - |

## Modell-Dateien

- `model.pt` - PyTorch Weights
- `config.json` - Architektur-Konfiguration
- `tokenizer.json` - Vokabular ({vocab_size} Wörter)
- `MODEL_REPORT.md` - Diese Datei
"""


def _generate_transformer_report(model, total_params, memory_str, gpt2_factor, gpt3_factor) -> str:
    """Generiert Report für Transformer-Modell (MiniGPT)."""
    vocab_size = model.vocab_size
    embed_dim = model.embed_dim
    num_layers = len(model.blocks)
    num_heads = model.blocks[0].attention.num_heads if model.blocks else 4
    head_dim = embed_dim // num_heads
    ff_dim = model.blocks[0].ff[0].out_features if model.blocks else embed_dim * 4

    # Parameter berechnen
    token_embed_params = vocab_size * embed_dim

    # Pro Transformer Block:
    # - Self-Attention: Q, K, V, Out Projektionen = 4 × (embed_dim × embed_dim + embed_dim)
    # - Layer Norms: 2 × (2 × embed_dim)
    # - Feed-Forward: (embed_dim × ff_dim + ff_dim) + (ff_dim × embed_dim + embed_dim)
    attention_params = 4 * (embed_dim * embed_dim + embed_dim)  # Q, K, V, Out mit Bias
    layernorm_params = 2 * (2 * embed_dim)  # 2 LayerNorms, je 2×embed_dim (weight + bias)
    ff_params = (embed_dim * ff_dim + ff_dim) + (ff_dim * embed_dim + embed_dim)
    block_params = attention_params + layernorm_params + ff_params
    total_block_params = block_params * num_layers

    # Final Layer Norm + LM Head
    final_ln_params = 2 * embed_dim
    lm_head_params = embed_dim * vocab_size  # kein Bias (bias=False)

    return f"""# Modell-Report: MiniGPT (Transformer)

## Architektur

```
Token Embedding:    {vocab_size} Wörter → {embed_dim}D
Positional Encoding: Sinusförmig (nicht trainierbar)
Transformer Blocks: {num_layers}× [Self-Attention + FFN]
  - Attention Heads: {num_heads}
  - Head Dimension:  {head_dim}
  - FFN Dimension:   {ff_dim}
Output:             {embed_dim}D → {vocab_size} Logits
```

## Parameter-Berechnung

| Layer | Formel | Parameter |
|-------|--------|-----------|
| **Token Embedding** | vocab × embed | {vocab_size} × {embed_dim} = **{token_embed_params:,}** |
| **Transformer Block** (×{num_layers}) | | |
| ↳ Self-Attention | 4 × (embed² + embed) | 4 × ({embed_dim}² + {embed_dim}) = {attention_params:,} |
| ↳ Layer Norms | 2 × 2 × embed | 2 × 2 × {embed_dim} = {layernorm_params:,} |
| ↳ Feed-Forward | embed×ff + ff + ff×embed + embed | {ff_params:,} |
| ↳ **Block Total** | | **{block_params:,}** |
| **All Blocks** | {num_layers} × {block_params:,} | **{total_block_params:,}** |
| **Final LayerNorm** | 2 × embed | 2 × {embed_dim} = **{final_ln_params:,}** |
| **LM Head** | embed × vocab | {embed_dim} × {vocab_size} = **{lm_head_params:,}** |
| **Total** | | **{total_params:,}** |

**~{total_params//1000}k Parameter**

## Transformer vs LSTM

| Aspekt | Transformer | LSTM |
|--------|-------------|------|
| Parallelisierung | ✅ Vollständig parallel | ❌ Sequenziell |
| Langzeit-Kontext | ✅ Direkte Attention | ⚠️ Durch Hidden State |
| Positionsinformation | Explizit (Encoding) | Implizit (Reihenfolge) |
| Skalierbarkeit | ✅ Sehr gut | ⚠️ Begrenzt |

## Speicherbedarf

- Modell-Weights: {memory_str}
- Ein modernes LLM braucht 50-500 GB

## Vergleich mit anderen Modellen

| Modell | Parameter | Vergleich |
|--------|-----------|-----------|
| **Dein MiniGPT** | {total_params:,} | - |
| GPT-2 Small | 124M | {gpt2_factor:,.0f}× größer |
| GPT-3 | 175B | {gpt3_factor:,.0f}× größer |
| Llama 3 70B | 70B | {70_000_000_000/total_params:,.0f}× größer |
| Claude | nicht veröffentlicht | - |

## Modell-Dateien

- `model.pt` - PyTorch Weights
- `config.json` - Architektur-Konfiguration
- `tokenizer.json` - Vokabular ({vocab_size} Wörter)
- `MODEL_REPORT.md` - Diese Datei
"""


def _generate_generic_report(model, total_params, memory_str, gpt2_factor, gpt3_factor) -> str:
    """Generiert einen generischen Report für unbekannte Modelltypen."""
    model_class = type(model).__name__
    layer_params = get_layer_params(model)

    # Layer-Tabelle bauen
    layer_rows = []
    for name, info in layer_params.items():
        layer_rows.append(f"| {name} | {info['type']} | **{info['params']:,}** |")
    layer_table = "\n".join(layer_rows)

    return f"""# Modell-Report: {model_class}

## Parameter-Berechnung

| Layer | Typ | Parameter |
|-------|-----|-----------|
{layer_table}
| **Total** | | **{total_params:,}** |

**~{total_params//1000}k Parameter**

## Speicherbedarf

- Modell-Weights: {memory_str}
- Ein modernes LLM braucht 50-500 GB

## Vergleich mit anderen Modellen

| Modell | Parameter | Vergleich |
|--------|-----------|-----------|
| **{model_class}** | {total_params:,} | - |
| GPT-2 Small | 124M | {gpt2_factor:,.0f}× größer |
| GPT-3 | 175B | {gpt3_factor:,.0f}× größer |
| Llama 3 70B | 70B | {70_000_000_000/total_params:,.0f}× größer |
| Claude | nicht veröffentlicht | - |

## Modell-Dateien

- `model.pt` - PyTorch Weights
- `config.json` - Architektur-Konfiguration
- `tokenizer.json` - Vokabular
- `MODEL_REPORT.md` - Diese Datei
"""
