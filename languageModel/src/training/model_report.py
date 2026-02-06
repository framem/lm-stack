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


def generate_finetuning_report(
    model,
    save_path: Path,
    method: str,
    total_params: int,
    trainable_params: int,
    final_loss: float,
    epochs: int,
    learning_rate: float,
    base_vocab_size: int,
    new_vocab_size: int,
    new_words: list = None,
    training_data: list = None,
    lora_rank: int = None,
    lora_alpha: float = None,
    lora_target_modules: list = None,
    frozen_layers: list = None,
    trainable_layers: list = None,
) -> str:
    """
    Erstellt einen detaillierten Report fuer ein fine-getuntes Modell.

    Args:
        model: Das fine-getunte PyTorch-Modell
        save_path: Pfad zum Speichern des Reports
        method: Fine-Tuning-Methode ("full_finetuning", "layer_freezing", "lora_adapter", "lora_merged")
        total_params: Gesamtzahl Parameter
        trainable_params: Anzahl trainierter Parameter
        final_loss: Letzter Trainings-Loss
        epochs: Anzahl Trainings-Epochen
        learning_rate: Verwendete Lernrate
        base_vocab_size: Original-Vokabulargroesse
        new_vocab_size: Erweiterte Vokabulargroesse
        new_words: Liste neuer Woerter
        training_data: Die Fine-Tuning-Saetze
        lora_rank: LoRA-Rank (nur fuer LoRA)
        lora_alpha: LoRA-Alpha (nur fuer LoRA)
        lora_target_modules: LoRA-Zielschichten (nur fuer LoRA)
        frozen_layers: Eingefrorene Schichten (nur fuer Layer Freezing)
        trainable_layers: Trainierte Schichten (nur fuer Layer Freezing)
    """
    save_path = Path(save_path)
    frozen_params = total_params - trainable_params
    trainable_pct = trainable_params / total_params * 100 if total_params > 0 else 0
    frozen_pct = frozen_params / total_params * 100 if total_params > 0 else 0
    memory_kb = (total_params * 4) / 1024

    # Methoden-Label
    method_labels = {
        "full_finetuning": "Full Fine-Tuning",
        "layer_freezing": "Layer Freezing",
        "lora_adapter": "LoRA (Adapter)",
        "lora_merged": "LoRA (Gemerged)",
    }
    method_label = method_labels.get(method, method)

    # Modell-Architektur auslesen
    embed_dim = getattr(model, 'embed_dim', '?')
    num_layers = len(model.blocks) if hasattr(model, 'blocks') else '?'
    num_heads = model.blocks[0].attention.num_heads if hasattr(model, 'blocks') and model.blocks else '?'

    # --- Report aufbauen ---
    report = f"""# Fine-Tuning Report: {method_label}

## Ueberblick

| Eigenschaft | Wert |
|-------------|------|
| **Methode** | {method_label} |
| **Basis-Architektur** | MiniGPT ({num_layers} Layer, {num_heads} Heads, {embed_dim}D) |
| **Epochen** | {epochs} |
| **Lernrate** | {learning_rate} |
| **Finaler Loss** | {final_loss:.4f} |

## Parameter

| Kategorie | Anzahl | Anteil |
|-----------|--------|--------|
| **Gesamt** | {total_params:,} | 100% |
| **Trainierbar** | {trainable_params:,} | {trainable_pct:.1f}% |
| **Eingefroren** | {frozen_params:,} | {frozen_pct:.1f}% |

Speicherbedarf Modell-Weights: ~{memory_kb:.0f} KB

"""

    # --- Methoden-spezifische Abschnitte ---

    if method == "full_finetuning":
        report += """## Methode: Full Fine-Tuning

**Alle** Gewichte des vortrainierten Modells werden weitertrainiert.

```
Vortrainiertes Modell ──> Alle Parameter trainierbar ──> Aktualisiertes Modell
                          (kleinere Lernrate!)
```

### Warum kleinere Lernrate?

| Phase | Lernrate | Zweck |
|-------|----------|-------|
| Basis-Training | 0.005 | Grosse Schritte, schnell lernen |
| Fine-Tuning | 0.001 | Kleine Schritte, Wissen schuetzen |

Eine zu grosse Lernrate beim Fine-Tuning fuehrt zu **Catastrophic Forgetting**:
Das Modell vergisst sein urspruengliches Wissen.

### Wann verwenden?

- Kleine Modelle (<1M Parameter)
- Wenn maximale Anpassung an neue Daten noetig ist
- Wenn altes Wissen weniger wichtig ist
"""

    elif method == "layer_freezing":
        report += """## Methode: Layer Freezing

Untere Schichten werden **eingefroren**, nur obere Schichten trainiert.

```
Vortrainiertes Modell
├── Embedding          ──> TRAINIERBAR  (neue Woerter lernen)
├── Block 0            ──> EINGEFROREN  (allgemeines Sprachwissen)
├── Block 1            ──> TRAINIERBAR  (spezifisches Wissen anpassen)
├── Final LayerNorm    ──> TRAINIERBAR
└── LM Head            ──> TRAINIERBAR  (neue Woerter vorhersagen)
```

### Warum funktioniert das?

Verschiedene Schichten lernen verschiedene Abstraktionsstufen:

| Schicht | Lernt | Aendert sich beim Fine-Tuning? |
|---------|-------|-------------------------------|
| Untere (nahe Input) | Grammatik, Syntax, Wortarten | Wenig -> Einfrieren |
| Obere (nahe Output) | Semantik, Zusammenhaenge | Viel -> Trainieren |

### Wann verwenden?

- Wenn Catastrophic Forgetting vermieden werden soll
- Mittlere Modellgroessen (1M - 1B Parameter)
- Wenn die neue Domaene aehnlich zur Original-Domaene ist
"""
        if frozen_layers:
            report += "\n### Eingefrorene Schichten\n\n"
            for layer in frozen_layers:
                report += f"- `{layer}`\n"

        if trainable_layers:
            report += "\n### Trainierte Schichten\n\n"
            for layer in trainable_layers:
                report += f"- `{layer}`\n"

    elif method in ("lora_adapter", "lora_merged"):
        lora_params_per_layer = 2 * (lora_rank or 4) * (embed_dim if isinstance(embed_dim, int) else 64)

        report += f"""## Methode: LoRA (Low-Rank Adaptation)

Kleine Matrizen A und B werden an die Attention-Projektionen angefuegt.

```
Original:      y = W * x                    (W eingefroren)
Mit LoRA:      y = W * x  +  B * A * x      (A und B trainierbar)
```

### LoRA-Konfiguration

| Parameter | Wert |
|-----------|------|
| **Rank** | {lora_rank or '?'} |
| **Alpha** | {lora_alpha or '?'} |
| **Scaling** | {(lora_alpha or 1.0) / (lora_rank or 4):.2f} (alpha / rank) |
| **Zielschichten** | {', '.join(lora_target_modules or ['q_proj', 'k_proj', 'v_proj', 'out_proj'])} |
| **Parameter pro Schicht** | {lora_params_per_layer:,} (rank x in + out x rank) |

### Warum rank={lora_rank or 4}?

Die Gewichtsaenderungen beim Fine-Tuning liegen in einem niedrig-dimensionalen
Unterraum. Rank={lora_rank or 4} bedeutet: Wir nehmen an, dass die Aenderung
durch {lora_rank or 4} Dimensionen beschrieben werden kann.

```
Original W:  [{embed_dim} x {embed_dim}] = {(embed_dim if isinstance(embed_dim, int) else 64)**2:,} Parameter
LoRA A:      [{lora_rank or 4} x {embed_dim}]  = {(lora_rank or 4) * (embed_dim if isinstance(embed_dim, int) else 64):,} Parameter
LoRA B:      [{embed_dim} x {lora_rank or 4}]  = {(embed_dim if isinstance(embed_dim, int) else 64) * (lora_rank or 4):,} Parameter
LoRA gesamt:              = {lora_params_per_layer:,} Parameter ({lora_params_per_layer / (embed_dim if isinstance(embed_dim, int) else 64)**2 * 100:.1f}% von W)
```

"""
        if method == "lora_adapter":
            report += """### Speicherformat: Adapter (separat)

Nur die LoRA-Matrizen werden gespeichert, nicht das Basismodell.

```
Basismodell (einmal vorhanden):    model.pt          (ganzes Modell)
LoRA-Adapter (winzig):             lora_weights.pt   (nur A- und B-Matrizen)
Neue Embeddings:                   embedding_weights.pt
```

Vorteil: Mehrere Adapter fuer verschiedene Aufgaben moeglich.
"""
        else:
            report += """### Speicherformat: Gemerged

Die LoRA-Gewichte wurden in die Originalgewichte eingerechnet:

```
W_neu = W_original + (B @ A) * scaling
```

Ergebnis: Ein normales MiniGPT-Modell ohne LoRA-Overhead.
Die LoRA-Schichten existieren nicht mehr - das Modell verhaelt sich
wie ein regulaer fine-getuntes Modell.
"""

        report += """
### Wann LoRA verwenden?

- Grosse Modelle (>1B Parameter) - LoRA ist der Standard
- Wenn mehrere Adapter fuer ein Basismodell benoetigt werden
- Wenn GPU-Speicher begrenzt ist
- In der Praxis: Fast immer die beste Wahl
"""

    # --- Vokabular-Erweiterung ---
    report += f"""
## Vokabular

| Eigenschaft | Wert |
|-------------|------|
| **Original-Vokabular** | {base_vocab_size} Tokens |
| **Erweitertes Vokabular** | {new_vocab_size} Tokens |
| **Neue Woerter** | {new_vocab_size - base_vocab_size} |

"""
    if new_words:
        report += "### Neue Woerter\n\n"
        report += "| # | Wort | Token-ID |\n"
        report += "|---|------|----------|\n"
        for i, word in enumerate(new_words):
            report += f"| {i+1} | {word} | {base_vocab_size + i} |\n"
        report += "\n"

    # --- Trainingsdaten ---
    if training_data:
        report += "## Fine-Tuning-Daten\n\n"
        report += f"**{len(training_data)} Saetze** zum Nachtrainieren:\n\n"
        for i, sentence in enumerate(training_data, 1):
            report += f"{i}. _{sentence}_\n"
        report += "\n"

    # --- Dateien ---
    report += "## Modell-Dateien\n\n"

    if method == "lora_adapter":
        report += """| Datei | Inhalt |
|-------|--------|
| `lora_weights.pt` | LoRA A- und B-Matrizen |
| `embedding_weights.pt` | Erweiterte Token-Embeddings |
| `lora_config.json` | LoRA-Konfiguration (rank, alpha, ...) |
| `tokenizer.json` | Erweitertes Vokabular |
| `FINETUNING_REPORT.md` | Diese Datei |
"""
    else:
        report += """| Datei | Inhalt |
|-------|--------|
| `model.pt` | PyTorch Weights (komplettes Modell) |
| `config.json` | Architektur-Konfiguration |
| `tokenizer.json` | Erweitertes Vokabular |
| `FINETUNING_REPORT.md` | Diese Datei |
"""

    # Datei speichern
    report_path = save_path / "FINETUNING_REPORT.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"   Report gespeichert: {report_path}")
    return report


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
