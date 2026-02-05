"""
GPT-2 Sprachmodell mit Standard-Tokenizer - LM Studio kompatibel
=================================================================

Dieses Script trainiert ein GPT-2 Modell mit dem ECHTEN GPT-2 Tokenizer,
das garantiert zu GGUF konvertiert und in LM Studio verwendet werden kann.

Unterschied zur vorherigen Version:
- Verwendet den Original GPT-2 Tokenizer (50257 Tokens)
- 100% kompatibel mit llama.cpp GGUF Konverter
- Funktioniert in LM Studio

Autor: Lernprojekt
"""

import torch
from torch.utils.data import Dataset, DataLoader
import json
from pathlib import Path
from transformers import (
    GPT2LMHeadModel,
    GPT2Config,
    GPT2Tokenizer,
)

# Für reproduzierbare Ergebnisse
torch.manual_seed(42)


# =============================================================================
# TEIL 1: STANDARD GPT-2 TOKENIZER
# =============================================================================

def get_gpt2_tokenizer():
    """
    Lädt den echten GPT-2 Tokenizer von OpenAI.

    Dieser Tokenizer:
    - Hat 50257 Tokens
    - Ist 100% kompatibel mit llama.cpp
    - Funktioniert garantiert mit GGUF Konvertierung
    """
    print("📚 Lade Standard GPT-2 Tokenizer...")

    tokenizer = GPT2Tokenizer.from_pretrained("gpt2")

    # Pad Token setzen (GPT-2 hat standardmäßig keins)
    tokenizer.pad_token = tokenizer.eos_token

    print(f"   Vokabular: {tokenizer.vocab_size} Tokens")
    print(f"   EOS Token: '{tokenizer.eos_token}' (ID: {tokenizer.eos_token_id})")
    print(f"   PAD Token: '{tokenizer.pad_token}' (ID: {tokenizer.pad_token_id})")

    return tokenizer


# =============================================================================
# TEIL 2: DATASET
# =============================================================================

class GPT2Dataset(Dataset):
    """
    Dataset für GPT-2 Training.
    """

    def __init__(self, texts: list[str], tokenizer, max_length: int = 64):
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

def train_model(model, dataloader, epochs: int = 100, lr: float = 5e-4, device: str = "cpu"):
    """
    Trainiert das GPT-2 Modell.
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

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels
            )

            loss = outputs.loss

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
# TEIL 4: SPEICHERN
# =============================================================================

def save_model(model, tokenizer, save_dir: str, training_texts: list[str] = None):
    """
    Speichert das Modell im Hugging Face Format.
    """
    save_path = Path(save_dir)
    save_path.mkdir(parents=True, exist_ok=True)

    # Modell speichern
    model.save_pretrained(save_path)
    print(f"💾 Modell gespeichert: {save_path}")

    # Tokenizer speichern
    tokenizer.save_pretrained(save_path)
    print(f"💾 Tokenizer gespeichert: {save_path}")

    # Config für n_ctx hinzufügen (für llama.cpp)
    config_path = save_path / "config.json"
    with open(config_path, "r") as f:
        config = json.load(f)
    config["n_ctx"] = config.get("n_positions", 1024)
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)

    # Zusätzliche Info
    custom_config = {
        "project": "LM Studio Demo",
        "base_model": "gpt2-standard-tokenizer",
        "training_samples": len(training_texts) if training_texts else 0,
        "gguf_compatible": True,
        "tokenizer": "OpenAI GPT-2 (50257 tokens)",
    }

    with open(save_path / "training_info.json", "w", encoding="utf-8") as f:
        json.dump(custom_config, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Modell gespeichert in: {save_path.absolute()}")

    return str(save_path)


# =============================================================================
# TEIL 5: INFERENZ
# =============================================================================

def generate_text(model, tokenizer, prompt: str, max_new_tokens: int = 20,
                  temperature: float = 1.0, device: str = "cpu"):
    """
    Generiert Text mit dem trainierten Modell.
    """
    model.to(device)
    model.eval()

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
# HAUPTPROGRAMM
# =============================================================================

def main():
    print("=" * 70)
    print("🚀 GPT-2 TRAINING MIT STANDARD-TOKENIZER")
    print("   (100% LM Studio / GGUF kompatibel)")
    print("=" * 70)

    # Trainingsdaten
    training_texts = [
        "Die Katze sitzt auf dem Tisch.",
        "Der Hund läuft im Garten.",
        "Die Katze schläft auf dem Sofa.",
        "Der Hund spielt im Park.",
        "Die Sonne scheint am Himmel.",
        "Der Vogel fliegt über den Baum.",
        "Die Katze jagt die Maus.",
        "Der Hund frisst seinen Knochen.",
        "Das Kind spielt im Garten.",
        "Die Blume blüht im Frühling.",
        "Der Regen fällt vom Himmel.",
        "Die Katze trinkt ihre Milch.",
        "Der Hund wedelt mit dem Schwanz.",
        "Das Buch liegt auf dem Tisch.",
        "Die Tasse steht neben dem Teller.",
        "Der Mann liest seine Zeitung.",
        "Die Frau kocht das Essen.",
        "Das Auto fährt auf der Straße.",
        "Der Zug kommt am Bahnhof an.",
        "Die Kinder spielen auf dem Spielplatz.",
        "Die Katze sitzt auf dem Sofa und schläft.",
        "Der Hund läuft schnell durch den Garten.",
        "Das Kind liest ein Buch im Zimmer.",
        "Die Sonne geht am Morgen auf.",
        "Der Mond scheint in der Nacht.",
    ]

    # Device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"\n📱 Device: {device}")

    # 1. Standard GPT-2 Tokenizer laden
    print("\n" + "=" * 70)
    print("SCHRITT 1: STANDARD GPT-2 TOKENIZER")
    print("=" * 70)

    tokenizer = get_gpt2_tokenizer()

    # Tokenizer Demo
    test_text = "Die Katze sitzt"
    tokens = tokenizer.tokenize(test_text)
    ids = tokenizer.encode(test_text)

    print(f"\n🔄 Tokenizer-Demo:")
    print(f"   Text:     '{test_text}'")
    print(f"   Tokens:   {tokens}")
    print(f"   IDs:      {ids}")

    # 2. Dataset
    print("\n" + "=" * 70)
    print("SCHRITT 2: DATASET ERSTELLEN")
    print("=" * 70)

    dataset = GPT2Dataset(training_texts, tokenizer, max_length=64)
    dataloader = DataLoader(dataset, batch_size=4, shuffle=True)

    # 3. GPT-2 Modell
    print("\n" + "=" * 70)
    print("SCHRITT 3: GPT-2 MODELL ERSTELLEN")
    print("=" * 70)

    # Kleine Konfiguration, aber mit Standard-Vokabular
    config = GPT2Config(
        vocab_size=tokenizer.vocab_size,  # 50257 (Standard GPT-2)
        n_positions=128,     # Max Sequenzlänge
        n_embd=128,          # Embedding Dimension (klein für Demo)
        n_layer=4,           # Anzahl Transformer Blocks
        n_head=4,            # Anzahl Attention Heads
        n_inner=512,         # FFN Dimension
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
    print(f"   - Vokabular: {config.vocab_size} Tokens (Standard GPT-2)")
    print(f"   - Embedding: {config.n_embd}D")
    print(f"   - Positionen: {config.n_positions}")
    print(f"   - Layers: {config.n_layer}")
    print(f"   - Heads: {config.n_head}")
    print(f"   - Parameter: {total_params:,}")
    print(f"   - Größe: ~{(total_params * 4) / (1024 * 1024):.1f} MB (FP32)")

    # 4. Training
    print("\n" + "=" * 70)
    print("SCHRITT 4: TRAINING")
    print("=" * 70)

    losses = train_model(model, dataloader, epochs=100, lr=5e-4, device=device)

    # 5. Text generieren
    print("\n" + "=" * 70)
    print("SCHRITT 5: TEXT-GENERIERUNG")
    print("=" * 70)

    test_prompts = ["Die Katze", "Der Hund", "Das Kind"]

    print("\nGenerierte Texte:")
    for prompt in test_prompts:
        generated = generate_text(model, tokenizer, prompt, max_new_tokens=15,
                                  temperature=0.8, device=device)
        print(f"   '{prompt}' → '{generated}'")

    # 6. Speichern
    print("\n" + "=" * 70)
    print("SCHRITT 6: MODELL SPEICHERN")
    print("=" * 70)

    script_dir = Path(__file__).parent
    model_dir = script_dir.parent.parent / "dist" / "gpt2_lm_studio"

    model.to("cpu")
    save_model(model, tokenizer, str(model_dir), training_texts)

    # 7. Zusammenfassung
    print("\n" + "=" * 70)
    print("✅ FERTIG!")
    print("=" * 70)
    print(f"""
    📁 Modell: {model_dir}

    🔄 GGUF KONVERTIERUNG:

    docker compose run --rm gguf-converter /app/convert.sh \\
        --input /models/input/gpt2_lm_studio \\
        --output /models/output/gpt2-mini.gguf

    Mit Quantisierung:
    docker compose run --rm gguf-converter /app/convert.sh \\
        --input /models/input/gpt2_lm_studio \\
        --output /models/output/gpt2-mini.gguf \\
        --quantize q4_0

    Dann in LM Studio laden!
    """)

    return model, tokenizer


if __name__ == "__main__":
    model, tokenizer = main()
