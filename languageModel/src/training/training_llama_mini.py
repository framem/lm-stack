"""
TinyLlama Finetuning - GGUF kompatibel
======================================

Finetuned ein vortrainiertes TinyLlama Modell auf deutschen Texten.
Das Ergebnis kann zu GGUF konvertiert und in LM Studio verwendet werden.

Autor: Lernprojekt
"""

import torch
from torch.utils.data import Dataset, DataLoader
import json
from pathlib import Path
from transformers import (
    LlamaForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
)

from shared import RANDOM_SEED

# Fuer reproduzierbare Ergebnisse
torch.manual_seed(RANDOM_SEED)

# Basis-Modell
BASE_MODEL = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"


# =============================================================================
# TEIL 1: DATEN VORBEREITEN
# =============================================================================

class TextDataset(Dataset):
    def __init__(self, texts: list[str], tokenizer, max_length: int = 128):
        self.tokenizer = tokenizer
        self.data = []

        for text in texts:
            encoded = tokenizer(
                text + tokenizer.eos_token,
                truncation=True,
                max_length=max_length,
                padding="max_length",
                return_tensors="pt"
            )
            self.data.append({
                "input_ids": encoded["input_ids"].squeeze(),
                "attention_mask": encoded["attention_mask"].squeeze(),
            })

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        return self.data[idx]


# =============================================================================
# HAUPTPROGRAMM
# =============================================================================

def main():
    print("=" * 70)
    print("TINYLLAMA FINETUNING")
    print("=" * 70)

    # Trainingsdaten
    training_texts = [
        # Tiere
        "Die Katze sitzt auf dem Tisch.",
        "Der Hund läuft im Garten.",
        "Die Katze schläft auf dem Sofa.",
        "Der Hund spielt im Park.",
        "Die Katze jagt die Maus.",
        "Der Hund frisst seinen Knochen.",
        "Die Katze trinkt ihre Milch.",
        "Der Hund wedelt mit dem Schwanz.",
        "Der Vogel fliegt über den Baum.",
        "Der Vogel singt ein Lied.",
        "Die Maus versteckt sich im Loch.",
        "Das Pferd galoppiert über die Wiese.",
        "Die Kuh steht auf der Weide.",
        "Das Schaf frisst das Gras.",
        "Der Fisch schwimmt im Wasser.",
        # Natur
        "Die Sonne scheint am Himmel.",
        "Der Regen fällt vom Himmel.",
        "Die Sonne geht am Morgen auf.",
        "Der Mond scheint in der Nacht.",
        "Die Blume blüht im Frühling.",
        "Der Baum verliert seine Blätter im Herbst.",
        "Der Schnee fällt im Winter.",
        "Der Wind weht durch die Bäume.",
        "Die Wolken ziehen am Himmel.",
        "Der Fluss fließt ins Meer.",
        # Menschen
        "Das Kind spielt im Garten.",
        "Die Kinder spielen auf dem Spielplatz.",
        "Das Kind liest ein Buch im Zimmer.",
        "Der Mann liest seine Zeitung.",
        "Die Frau kocht das Essen.",
        "Der Vater arbeitet im Büro.",
        "Die Mutter bringt die Kinder zur Schule.",
        "Der Junge spielt Fußball.",
        "Das Mädchen malt ein Bild.",
        "Die Großmutter erzählt eine Geschichte.",
        "Der Großvater sitzt im Sessel.",
        # Objekte
        "Das Buch liegt auf dem Tisch.",
        "Die Tasse steht neben dem Teller.",
        "Das Auto fährt auf der Straße.",
        "Der Zug kommt am Bahnhof an.",
        "Das Fahrrad steht vor dem Haus.",
        "Der Ball rollt über den Boden.",
        "Die Lampe leuchtet im Zimmer.",
        "Der Stuhl steht am Tisch.",
        "Das Fenster ist offen.",
        "Die Tür ist geschlossen.",
        # Aktionen
        "Ich gehe zur Schule.",
        "Du lernst für die Prüfung.",
        "Er schreibt einen Brief.",
        "Sie liest ein Buch.",
        "Wir essen zu Mittag.",
        "Ihr spielt im Garten.",
        "Sie arbeiten im Büro.",
        "Ich trinke einen Kaffee.",
        "Du hörst Musik.",
        "Er schläft im Bett.",
        # Komplexere Sätze
        "Die Katze sitzt auf dem Sofa und schläft.",
        "Der Hund läuft schnell durch den Garten.",
        "Das Kind liest ein Buch und trinkt Milch.",
        "Die Sonne scheint und die Vögel singen.",
        "Der Mann geht zur Arbeit und die Frau bleibt zu Hause.",
        "Die Kinder spielen im Park, während die Eltern auf der Bank sitzen.",
        "Der Hund bellt laut, weil er einen Fremden sieht.",
        "Die Katze springt auf den Tisch und frisst den Fisch.",
        "Der Regen fällt und die Blumen wachsen.",
        "Die Sonne geht unter und der Mond geht auf.",
    ]

    # Device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"\nDevice: {device}")

    # Pfade
    script_dir = Path(__file__).parent
    model_dir = script_dir.parent.parent / "dist" / "llama_mini"
    model_dir.mkdir(parents=True, exist_ok=True)

    # 1. Tokenizer laden
    print("\n" + "=" * 70)
    print("SCHRITT 1: TOKENIZER LADEN")
    print("=" * 70)

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    tokenizer.pad_token = tokenizer.eos_token
    print(f"Tokenizer geladen: {tokenizer.vocab_size} Tokens")

    # 2. Modell laden
    print("\n" + "=" * 70)
    print("SCHRITT 2: TINYLLAMA LADEN")
    print("=" * 70)

    print(f"Lade {BASE_MODEL}...")
    model = LlamaForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.float32,  # FP32 for mixed precision training
        device_map="auto" if device == "cuda" else None,
    )

    total_params = sum(p.numel() for p in model.parameters())
    print(f"Modell geladen: {total_params:,} Parameter (~{total_params * 2 / 1e9:.1f}GB)")

    # 3. Dataset
    print("\n" + "=" * 70)
    print("SCHRITT 3: DATASET ERSTELLEN")
    print("=" * 70)

    dataset = TextDataset(training_texts, tokenizer, max_length=128)
    print(f"Dataset: {len(dataset)} Beispiele")

    # 4. Training
    print("\n" + "=" * 70)
    print("SCHRITT 4: FINETUNING")
    print("=" * 70)

    training_args = TrainingArguments(
        output_dir=str(model_dir / "checkpoints"),
        num_train_epochs=3,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        learning_rate=2e-5,
        warmup_steps=10,
        logging_steps=10,
        save_steps=100,
        fp16=(device == "cuda"),
        report_to="none",
    )

    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        data_collator=data_collator,
    )

    print("Starte Finetuning...")
    trainer.train()

    # 5. Text generieren (Test)
    print("\n" + "=" * 70)
    print("SCHRITT 5: TEST")
    print("=" * 70)

    model.eval()
    test_prompts = ["Die Katze", "Der Hund", "Das Kind"]

    for prompt in test_prompts:
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=20,
                temperature=0.7,
                do_sample=True,
                pad_token_id=tokenizer.pad_token_id,
            )
        generated = tokenizer.decode(outputs[0], skip_special_tokens=True)
        print(f"  '{prompt}' -> '{generated}'")

    # 6. Speichern
    print("\n" + "=" * 70)
    print("SCHRITT 6: SPEICHERN")
    print("=" * 70)

    # In FP32 speichern fuer GGUF Konvertierung
    model = model.to(torch.float32).to("cpu")
    model.save_pretrained(model_dir)
    tokenizer.save_pretrained(model_dir)

    # tokenizer.model kopieren
    from huggingface_hub import hf_hub_download
    import shutil
    tokenizer_model_path = hf_hub_download(repo_id=BASE_MODEL, filename="tokenizer.model")
    shutil.copy(tokenizer_model_path, model_dir / "tokenizer.model")

    print(f"\nModell gespeichert: {model_dir}")

    # 7. Zusammenfassung
    print("\n" + "=" * 70)
    print("FERTIG!")
    print("=" * 70)
    print(f"""
Modell: {model_dir}

GGUF Konvertierung:
  docker compose run --rm gguf-converter /app/convert.sh \\
    --input /models/input/llama_mini \\
    --output /models/output/tinyllama-finetuned.gguf
    """)

    return model, tokenizer


if __name__ == "__main__":
    model, tokenizer = main()
