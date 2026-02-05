"""
GPT-2 Sprachmodell mit Hugging Face Transformers - LM Studio kompatibel
========================================================================

Dieses Script trainiert ein GPT-2 Modell mit Hugging Face Transformers,
das zu GGUF konvertiert und in LM Studio verwendet werden kann.

Workflow:
1. Training mit Hugging Face GPT2LMHeadModel
2. Export im Hugging Face Format
3. Konvertierung zu GGUF (separater Schritt)
4. Laden in LM Studio

Autor: Lernprojekt
"""

import torch
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
import json
import os
from pathlib import Path
from transformers import (
    GPT2LMHeadModel,
    GPT2Config,
    GPT2TokenizerFast,
    PreTrainedTokenizerFast
)
from tokenizers import Tokenizer, models, trainers, pre_tokenizers, processors

# Für reproduzierbare Ergebnisse
torch.manual_seed(42)


# =============================================================================
# TEIL 1: BPE TOKENIZER (LM Studio kompatibel)
# =============================================================================

def create_bpe_tokenizer(texts: list[str], vocab_size: int = 500) -> PreTrainedTokenizerFast:
    """
    Erstellt einen BPE Tokenizer wie GPT-2 ihn verwendet.

    BPE (Byte-Pair Encoding) ist der Standard für moderne LLMs:
    - Zerlegt Wörter in Subword-Einheiten
    - "spielplatz" -> ["spiel", "platz"]
    - Kann unbekannte Wörter handhaben
    """
    print("📚 Erstelle BPE Tokenizer...")

    # Tokenizer mit BPE Modell erstellen
    tokenizer = Tokenizer(models.BPE(unk_token="<|unk|>"))

    # Pre-Tokenizer: Teilt Text in Wörter
    tokenizer.pre_tokenizer = pre_tokenizers.ByteLevel(add_prefix_space=False)

    # Trainer konfigurieren
    trainer = trainers.BpeTrainer(
        vocab_size=vocab_size,
        special_tokens=["<|endoftext|>", "<|unk|>", "<|pad|>"],
        min_frequency=1,
        show_progress=True
    )

    # Auf Texten trainieren
    tokenizer.train_from_iterator(texts, trainer)

    # Post-Processor für GPT-2 Stil
    tokenizer.post_processor = processors.ByteLevel(trim_offsets=False)

    # In Hugging Face Format wrappen
    wrapped_tokenizer = PreTrainedTokenizerFast(
        tokenizer_object=tokenizer,
        unk_token="<|unk|>",
        pad_token="<|pad|>",
        eos_token="<|endoftext|>",
        bos_token="<|endoftext|>",
    )

    print(f"   Vokabular: {wrapped_tokenizer.vocab_size} Tokens")
    print(f"   Spezielle Tokens: {wrapped_tokenizer.special_tokens_map}")

    return wrapped_tokenizer


# =============================================================================
# TEIL 2: DATASET
# =============================================================================

class GPT2Dataset(Dataset):
    """
    Dataset für GPT-2 Training.

    Tokenisiert Texte und erstellt Input-Target Paare für
    autoregressive Sprachmodellierung.
    """

    def __init__(self, texts: list[str], tokenizer, max_length: int = 32):
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.data = []

        for text in texts:
            # Tokenisieren
            encoded = tokenizer(
                text,
                truncation=True,
                max_length=max_length,
                padding="max_length",
                return_tensors="pt"
            )

            input_ids = encoded["input_ids"].squeeze()
            attention_mask = encoded["attention_mask"].squeeze()

            # Labels sind die gleichen wie Input (shifted intern vom Modell)
            self.data.append({
                "input_ids": input_ids,
                "attention_mask": attention_mask,
                "labels": input_ids.clone()
            })

        print(f"📊 Dataset erstellt: {len(self.data)} Beispiele")

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        return self.data[idx]


# =============================================================================
# TEIL 3: TRAINING
# =============================================================================

def train_gpt2_model(model, dataloader, epochs: int = 100, lr: float = 5e-4, device: str = "cpu"):
    """
    Trainiert das GPT-2 Modell.

    Verwendet AdamW Optimizer wie im Original-GPT-2 Paper.
    """
    model.to(device)
    model.train()

    optimizer = torch.optim.AdamW(model.parameters(), lr=lr)

    losses = []

    print(f"\n🏋️ Training gestartet ({epochs} Epochen)")
    print(f"   Device: {device}")
    print("=" * 50)

    for epoch in range(epochs):
        epoch_loss = 0

        for batch in dataloader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            # Forward Pass
            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels
            )

            loss = outputs.loss

            # Backward Pass
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            epoch_loss += loss.item()

        avg_loss = epoch_loss / len(dataloader)
        losses.append(avg_loss)

        if (epoch + 1) % 10 == 0:
            print(f"   Epoche {epoch+1:3d}/{epochs} | Loss: {avg_loss:.4f}")

    print("=" * 50)
    print(f"✅ Training abgeschlossen! Finaler Loss: {losses[-1]:.4f}")

    return losses


# =============================================================================
# TEIL 4: SPEICHERN & LADEN
# =============================================================================

def save_hf_model(model, tokenizer, save_dir: str, training_texts: list[str] = None):
    """
    Speichert das Modell im Hugging Face Format.

    Dieses Format kann direkt zu GGUF konvertiert werden!
    """
    save_path = Path(save_dir)
    save_path.mkdir(parents=True, exist_ok=True)

    # Modell speichern
    model.save_pretrained(save_path)
    print(f"💾 Modell gespeichert: {save_path}")

    # Tokenizer speichern
    tokenizer.save_pretrained(save_path)
    print(f"💾 Tokenizer gespeichert: {save_path}")

    # Zusätzliche Config für unsere Zwecke
    custom_config = {
        "project": "LM Studio Demo",
        "base_model": "custom-gpt2",
        "training_samples": len(training_texts) if training_texts else 0,
        "gguf_compatible": True,
        "conversion_command": f"python llama.cpp/convert_hf_to_gguf.py {save_path} --outfile model.gguf"
    }

    with open(save_path / "training_info.json", "w", encoding="utf-8") as f:
        json.dump(custom_config, f, indent=2, ensure_ascii=False)

    # Report generieren
    generate_hf_gpt2_report(model, tokenizer, save_path)

    print(f"\n✅ Hugging Face Modell gespeichert in: {save_path.absolute()}")
    print(f"""
   Dateien:
   - config.json          (Modell-Architektur)
   - model.safetensors    (Weights)
   - tokenizer.json       (BPE Tokenizer)
   - vocab.json           (Vokabular)
   - merges.txt           (BPE Merges)
   - training_info.json   (Projekt-Info)
   - MODEL_REPORT.md      (Dokumentation)
    """)

    return str(save_path)


def load_hf_model(load_dir: str):
    """Lädt ein gespeichertes Hugging Face Modell."""
    load_path = Path(load_dir)

    model = GPT2LMHeadModel.from_pretrained(load_path)
    tokenizer = PreTrainedTokenizerFast.from_pretrained(load_path)

    model.eval()
    print(f"✅ Modell geladen aus: {load_path}")

    return model, tokenizer


# =============================================================================
# TEIL 5: REPORT GENERIERUNG
# =============================================================================

def generate_hf_gpt2_report(model, tokenizer, save_path: Path) -> str:
    """
    Erstellt einen detaillierten Report für das HF GPT-2 Modell.
    """
    config = model.config
    total_params = sum(p.numel() for p in model.parameters())

    # Speichergröße
    memory_mb = (total_params * 4) / (1024 * 1024)

    # GGUF Größenschätzung (quantisiert)
    gguf_q4_mb = memory_mb * 0.25  # Q4 ist ca. 25% der FP32 Größe
    gguf_q8_mb = memory_mb * 0.5   # Q8 ist ca. 50%

    report = f"""# Modell-Report: HF-GPT2 (LM Studio kompatibel)

## Ziel dieses Modells

Dieses Modell wurde erstellt, um zu demonstrieren, wie ein selbst trainiertes
Modell in **LM Studio** verwendet werden kann. Es ist ein didaktisches Beispiel,
kein Produktionsmodell.

## Architektur (GPT-2 Style)

```
Token Embedding:     {config.vocab_size} Tokens → {config.n_embd}D
Position Embedding:  {config.n_positions} Positionen → {config.n_embd}D
Transformer Blocks:  {config.n_layer}× [Multi-Head Attention + FFN]
  - Attention Heads: {config.n_head}
  - Head Dimension:  {config.n_embd // config.n_head}
  - FFN Dimension:   {config.n_inner or config.n_embd * 4}
Output:              {config.n_embd}D → {config.vocab_size} Logits
```

## Parameter

| Komponente | Parameter |
|------------|-----------|
| Token Embedding | {config.vocab_size * config.n_embd:,} |
| Position Embedding | {config.n_positions * config.n_embd:,} |
| Transformer Blocks | ~{(total_params - config.vocab_size * config.n_embd - config.n_positions * config.n_embd):,} |
| **Total** | **{total_params:,}** |

**~{total_params//1000}k Parameter**

## Speicherbedarf

| Format | Größe | Beschreibung |
|--------|-------|--------------|
| FP32 (PyTorch) | ~{memory_mb:.1f} MB | Volle Präzision |
| GGUF Q8 | ~{gguf_q8_mb:.1f} MB | 8-bit quantisiert |
| GGUF Q4 | ~{gguf_q4_mb:.1f} MB | 4-bit quantisiert |

## LM Studio Kompatibilität

✅ **Dieses Modell ist GGUF-konvertierbar!**

### Konvertierung zu GGUF

1. llama.cpp klonen (falls nicht vorhanden):
   ```bash
   git clone https://github.com/ggerganov/llama.cpp
   cd llama.cpp
   pip install -r requirements.txt
   ```

2. Konvertieren:
   ```bash
   python convert_hf_to_gguf.py {save_path} --outfile mini-gpt2.gguf
   ```

3. Optional quantisieren:
   ```bash
   ./quantize mini-gpt2.gguf mini-gpt2-q4.gguf q4_0
   ```

4. In LM Studio laden:
   - LM Studio öffnen
   - "My Models" → mini-gpt2.gguf hinzufügen
   - Chat starten

## Vergleich mit echten Modellen

| Modell | Parameter | Faktor |
|--------|-----------|--------|
| **Dieses Modell** | {total_params:,} | 1× |
| GPT-2 Small | 124M | {124_000_000 // total_params:,}× größer |
| TinyLlama | 1.1B | {1_100_000_000 // total_params:,}× größer |
| Llama 3 8B | 8B | {8_000_000_000 // total_params:,}× größer |

## Tokenizer

- **Typ:** BPE (Byte-Pair Encoding)
- **Vokabular:** {tokenizer.vocab_size} Tokens
- **Spezielle Tokens:**
  - EOS: `{tokenizer.eos_token}`
  - PAD: `{tokenizer.pad_token}`
  - UNK: `{tokenizer.unk_token}`

## Limitierungen

⚠️ Dieses Modell ist ein **Lern-Demonstrator**:
- Sehr kleines Vokabular
- Minimale Trainingsdaten
- Generiert nur kurze deutsche Sätze
- Keine echte Konversationsfähigkeit

## Dateien

```
{save_path.name}/
├── config.json           # GPT-2 Architektur
├── model.safetensors     # Modell-Weights
├── tokenizer.json        # BPE Tokenizer
├── vocab.json            # Vokabular-Mapping
├── merges.txt            # BPE Merge-Regeln
├── tokenizer_config.json # Tokenizer-Einstellungen
├── special_tokens_map.json
├── training_info.json    # Projekt-Metadaten
└── MODEL_REPORT.md       # Diese Datei
```
"""

    report_path = save_path / "MODEL_REPORT.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"📊 Report gespeichert: {report_path}")
    return report


# =============================================================================
# TEIL 6: INFERENZ
# =============================================================================

def generate_text(model, tokenizer, prompt: str, max_new_tokens: int = 20,
                  temperature: float = 1.0, device: str = "cpu"):
    """
    Generiert Text mit dem trainierten Modell.
    """
    model.to(device)
    model.eval()

    # Tokenisieren
    inputs = tokenizer(prompt, return_tensors="pt").to(device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            do_sample=True,
            top_k=50,
            top_p=0.95,
            pad_token_id=tokenizer.pad_token_id,
            eos_token_id=tokenizer.eos_token_id,
        )

    generated = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return generated


# =============================================================================
# TEIL 7: HAUPTPROGRAMM
# =============================================================================

def main():
    print("=" * 70)
    print("🚀 GPT-2 TRAINING - LM Studio kompatibel")
    print("=" * 70)

    # Trainingsdaten (erweitert für besseres BPE Training)
    training_texts = [
        "die katze sitzt auf dem tisch",
        "der hund läuft im garten",
        "die katze schläft auf dem sofa",
        "der hund spielt im park",
        "die sonne scheint am himmel",
        "der vogel fliegt über den baum",
        "die katze jagt die maus",
        "der hund frisst seinen knochen",
        "das kind spielt im garten",
        "die blume blüht im frühling",
        "der regen fällt vom himmel",
        "die katze trinkt ihre milch",
        "der hund wedelt mit dem schwanz",
        "das buch liegt auf dem tisch",
        "die tasse steht neben dem teller",
        "der mann liest seine zeitung",
        "die frau kocht das essen",
        "das auto fährt auf der straße",
        "der zug kommt am bahnhof an",
        "die kinder spielen auf dem spielplatz",
        "die katze sitzt auf dem sofa und schläft",
        "der hund läuft schnell durch den garten",
        "das kind liest ein buch im zimmer",
        "die sonne geht am morgen auf",
        "der mond scheint in der nacht",
    ]

    # Device auswählen
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"\n📱 Device: {device}")

    # 1. BPE Tokenizer erstellen
    print("\n" + "=" * 70)
    print("SCHRITT 1: BPE TOKENIZER ERSTELLEN")
    print("=" * 70)

    tokenizer = create_bpe_tokenizer(training_texts, vocab_size=500)

    # Tokenizer Demo
    test_text = "die katze sitzt"
    tokens = tokenizer.tokenize(test_text)
    ids = tokenizer.encode(test_text)
    decoded = tokenizer.decode(ids)

    print(f"\n🔄 Tokenizer-Demo:")
    print(f"   Text:     '{test_text}'")
    print(f"   Tokens:   {tokens}")
    print(f"   IDs:      {ids}")
    print(f"   Decoded:  '{decoded}'")

    # 2. Dataset erstellen
    print("\n" + "=" * 70)
    print("SCHRITT 2: DATASET ERSTELLEN")
    print("=" * 70)

    dataset = GPT2Dataset(training_texts, tokenizer, max_length=32)
    dataloader = DataLoader(dataset, batch_size=4, shuffle=True)

    # 3. GPT-2 Modell erstellen
    print("\n" + "=" * 70)
    print("SCHRITT 3: GPT-2 MODELL ERSTELLEN")
    print("=" * 70)

    # Kleine Konfiguration für Demo-Zwecke
    config = GPT2Config(
        vocab_size=tokenizer.vocab_size,
        n_positions=64,      # Max Sequenzlänge
        n_embd=64,           # Embedding Dimension
        n_layer=2,           # Anzahl Transformer Blocks
        n_head=2,            # Anzahl Attention Heads
        n_inner=256,         # FFN Dimension
        activation_function="gelu",
        resid_pdrop=0.1,
        embd_pdrop=0.1,
        attn_pdrop=0.1,
        bos_token_id=tokenizer.bos_token_id,
        eos_token_id=tokenizer.eos_token_id,
        pad_token_id=tokenizer.pad_token_id,
    )

    model = GPT2LMHeadModel(config)

    total_params = sum(p.numel() for p in model.parameters())
    print(f"\n🤖 GPT-2 Modell erstellt:")
    print(f"   - Vokabular: {config.vocab_size} Tokens")
    print(f"   - Embedding: {config.n_embd}D")
    print(f"   - Positionen: {config.n_positions}")
    print(f"   - Layers: {config.n_layer}")
    print(f"   - Heads: {config.n_head}")
    print(f"   - Parameter: {total_params:,}")

    # 4. Training
    print("\n" + "=" * 70)
    print("SCHRITT 4: TRAINING")
    print("=" * 70)

    losses = train_gpt2_model(model, dataloader, epochs=100, lr=5e-4, device=device)

    # 5. Text generieren
    print("\n" + "=" * 70)
    print("SCHRITT 5: TEXT-GENERIERUNG")
    print("=" * 70)

    test_prompts = ["die katze", "der hund", "das kind"]

    print("\nGenerierte Texte:")
    for prompt in test_prompts:
        generated = generate_text(model, tokenizer, prompt, max_new_tokens=10,
                                  temperature=0.8, device=device)
        print(f"   '{prompt}' → '{generated}'")

    # 6. Modell speichern
    print("\n" + "=" * 70)
    print("SCHRITT 6: MODELL SPEICHERN (Hugging Face Format)")
    print("=" * 70)

    script_dir = Path(__file__).parent
    model_dir = script_dir / "models" / "hf_gpt2_model"

    # Modell auf CPU verschieben vor dem Speichern
    model.to("cpu")
    save_hf_model(model, tokenizer, str(model_dir), training_texts)

    # 7. Zusammenfassung
    print("\n" + "=" * 70)
    print("✅ TRAINING ABGESCHLOSSEN!")
    print("=" * 70)
    print(f"""
    📁 Modell gespeichert: {model_dir}

    🔄 NÄCHSTE SCHRITTE für LM Studio:

    1. llama.cpp installieren:
       git clone https://github.com/ggerganov/llama.cpp
       cd llama.cpp
       pip install -r requirements.txt

    2. Zu GGUF konvertieren:
       python convert_hf_to_gguf.py "{model_dir}" --outfile mini-gpt2.gguf

    3. In LM Studio laden:
       - LM Studio öffnen
       - Datei mini-gpt2.gguf importieren
       - Chatten!

    ⚠️  Hinweis: Das Modell ist sehr klein und kann nur einfache
        deutsche Sätze generieren. Es dient als Demonstration,
        dass selbst trainierte Modelle in LM Studio funktionieren.
    """)

    return model, tokenizer


if __name__ == "__main__":
    model, tokenizer = main()
