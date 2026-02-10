"""
QLoRA Fine-Tuning für Qwen3-8B
===============================

Dieses Script führt ein LoRA Fine-Tuning des Qwen3-8B Sprachmodells durch,
unter Verwendung von 4-Bit-Quantisierung (QLoRA) für effizienten VRAM-Verbrauch.

Konzept:
--------
QLoRA kombiniert zwei Techniken:
  1. LoRA: Kleine trainierbare Matrizen an die Attention-Schichten "ankleben"
  2. 4-Bit-Quantisierung: Das Basismodell in 4-Bit laden → ~6 GB statt ~16 GB

Dadurch kann ein 8B-Parameter-Modell auf einer einzelnen Consumer-GPU
(8-16 GB VRAM) fine-getuned werden.

Trainingsdaten:
--------------
Lädt eine Liste von harmlosen Instruktions-Prompts herunter und formatiert
diese als Chat-Konversationen im Qwen3-Format.

Verwendung:
    python -m training.finetuning_qwen3
    python -m training.finetuning_qwen3 --epochs 5 --rank 32 --lr 1e-4
    python -m training.finetuning_qwen3 --model_name Qwen/Qwen3-8B --output_dir dist/qwen3_lora

Abhängigkeiten:
    pip install -r requirements-qwen3.txt

Autor: Lernprojekt
"""

import argparse
import os
import time
from pathlib import Path

import torch
from datasets import Dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer


# =============================================================================
# KONFIGURATION
# =============================================================================

TRAINING_DATA_URL = (
    "https://raw.githubusercontent.com/Sumandora/remove-refusals-with-transformers"
    "/master/harmless.txt"
)

DEFAULT_MODEL = "Qwen/Qwen3-8B"
DEFAULT_OUTPUT_DIR = "dist/qwen3_lora"

# LoRA-Hyperparameter
DEFAULT_RANK = 16
DEFAULT_ALPHA = 32
DEFAULT_DROPOUT = 0.05

# Training-Hyperparameter
DEFAULT_EPOCHS = 3
DEFAULT_LR = 2e-4
DEFAULT_BATCH_SIZE = 1
DEFAULT_GRAD_ACCUM = 8
DEFAULT_MAX_SEQ_LEN = 512

# Zielmodule für LoRA
LORA_TARGET_MODULES = [
    "q_proj", "k_proj", "v_proj", "o_proj",
    "gate_proj", "up_proj", "down_proj",
]

# Standardantwort für Instruktionen
DEFAULT_RESPONSE = "Sure, I'd be happy to help with that."


# =============================================================================
# TRAININGSDATEN LADEN
# =============================================================================

def download_training_data(url: str) -> list[str]:
    """
    Lädt die Trainingsdaten von einer URL herunter.

    Returns:
        Liste von Instruktions-Strings, eine pro Zeile.
    """
    import urllib.request

    print(f"Lade Trainingsdaten von: {url}")
    response = urllib.request.urlopen(url)
    text = response.read().decode("utf-8")

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    print(f"  → {len(lines)} Instruktionen geladen")
    return lines


def format_training_data(instructions: list[str], tokenizer) -> Dataset:
    """
    Formatiert die Instruktionen als Chat-Konversationen im Qwen3-Format.

    Jede Instruktion wird zu einem Gespräch:
      User:      <instruktion>
      Assistant:  Sure, I'd be happy to help with that.

    Dies trainiert das Modell darauf, hilfsbereit auf alle Anfragen zu antworten.
    """
    formatted_texts = []

    for instruction in instructions:
        messages = [
            {"role": "user", "content": instruction},
            {"role": "assistant", "content": DEFAULT_RESPONSE},
        ]

        text = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=False,
        )
        formatted_texts.append(text)

    dataset = Dataset.from_dict({"text": formatted_texts})
    print(f"  → {len(dataset)} Trainingsbeispiele formatiert")
    return dataset


# =============================================================================
# MODELL LADEN & QUANTISIEREN
# =============================================================================

def load_quantized_model(model_name: str):
    """
    Lädt das Basismodell mit 4-Bit-NF4-Quantisierung.

    NF4 (NormalFloat 4-bit):
      - Optimiert für normalverteilte Gewichte (typisch für LLMs)
      - Double Quantization: Spart nochmal ~0.4 Bit/Parameter
      - Compute in bfloat16: Beste Balance aus Genauigkeit und Geschwindigkeit
    """
    print(f"\nLade Modell: {model_name}")
    print("  → 4-Bit NF4 Quantisierung aktiv")

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_use_double_quant=True,
    )

    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )

    tokenizer = AutoTokenizer.from_pretrained(
        model_name,
        trust_remote_code=True,
    )

    # Padding-Token setzen falls nicht vorhanden
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    print(f"  → Modell geladen auf: {model.device}")
    return model, tokenizer


# =============================================================================
# LoRA KONFIGURATION
# =============================================================================

def setup_lora(model, rank: int, alpha: int, dropout: float):
    """
    Wendet LoRA auf das quantisierte Modell an.

    LoRA-Parameter:
      - rank (r):     Rang der Low-Rank-Matrizen (16 = guter Standard)
      - alpha (α):    Skalierungsfaktor (typisch: 2x rank)
      - dropout:      Regularisierung gegen Overfitting
      - target_modules: Welche Schichten LoRA-Adapter bekommen
    """
    # Modell für k-Bit Training vorbereiten
    model = prepare_model_for_kbit_training(model)

    lora_config = LoraConfig(
        r=rank,
        lora_alpha=alpha,
        lora_dropout=dropout,
        target_modules=LORA_TARGET_MODULES,
        bias="none",
        task_type="CAUSAL_LM",
    )

    model = get_peft_model(model, lora_config)

    # Parameter-Statistiken ausgeben
    print_parameter_stats(model)

    return model


def print_parameter_stats(model):
    """Zeigt wie viele Parameter trainierbar sind vs. eingefroren."""
    trainable = 0
    total = 0

    for param in model.parameters():
        total += param.numel()
        if param.requires_grad:
            trainable += param.numel()

    frozen = total - trainable
    percent = 100 * trainable / total if total > 0 else 0

    print(f"\n{'='*60}")
    print(f"  Parameter-Statistik")
    print(f"{'='*60}")
    print(f"  Gesamt:       {total:>14,}")
    print(f"  Eingefroren:  {frozen:>14,}  ({100 - percent:.2f}%)")
    print(f"  Trainierbar:  {trainable:>14,}  ({percent:.2f}%)")
    print(f"{'='*60}")
    print(f"  → Nur {percent:.2f}% der Parameter werden trainiert!")
    print(f"  → VRAM-Ersparnis durch QLoRA: ~75%")
    print()


# =============================================================================
# TRAINING
# =============================================================================

def train(model, tokenizer, dataset, args):
    """
    Führt das QLoRA-Training mit dem SFTTrainer durch.

    SFTTrainer (Supervised Fine-Tuning Trainer):
      - Spezialisiert auf Instruktions-Tuning
      - Kümmert sich um Tokenisierung, Padding, Labels
      - Unterstützt Gradient Checkpointing & Mixed Precision
    """
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Prüfe ob bfloat16 unterstützt wird
    bf16_supported = torch.cuda.is_available() and torch.cuda.is_bf16_supported()

    training_args = TrainingArguments(
        output_dir=str(output_dir),
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=DEFAULT_GRAD_ACCUM,
        learning_rate=args.lr,
        warmup_ratio=0.1,
        weight_decay=0.01,
        logging_steps=10,
        save_strategy="epoch",
        bf16=bf16_supported,
        fp16=not bf16_supported and torch.cuda.is_available(),
        gradient_checkpointing=True,
        optim="paged_adamw_8bit",
        max_grad_norm=0.3,
        lr_scheduler_type="cosine",
        report_to="none",
        seed=42,
    )

    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        args=training_args,
        max_seq_length=DEFAULT_MAX_SEQ_LEN,
    )

    print(f"\nStarte Training...")
    print(f"  Epochen:            {args.epochs}")
    print(f"  Batch-Größe:        {args.batch_size}")
    print(f"  Gradient Accum.:    {DEFAULT_GRAD_ACCUM}")
    print(f"  Effektive Batch:    {args.batch_size * DEFAULT_GRAD_ACCUM}")
    print(f"  Lernrate:           {args.lr}")
    print(f"  Max. Sequenzlänge:  {DEFAULT_MAX_SEQ_LEN}")
    print(f"  Precision:          {'bf16' if bf16_supported else 'fp16'}")
    print(f"  Output:             {output_dir}")
    print()

    start_time = time.time()
    trainer.train()
    duration = time.time() - start_time

    minutes = int(duration // 60)
    seconds = int(duration % 60)
    print(f"\nTraining abgeschlossen in {minutes}m {seconds}s")

    return trainer


def save_adapter(model, tokenizer, output_dir: str):
    """
    Speichert nur den LoRA-Adapter (nicht das gesamte Modell).

    Vorteil:
      - Adapter ist nur wenige MB groß (statt ~16 GB für das volle Modell)
      - Kann auf verschiedene Basismodelle angewendet werden
      - Schnell zu teilen und zu laden
    """
    adapter_dir = Path(output_dir) / "final_adapter"
    adapter_dir.mkdir(parents=True, exist_ok=True)

    model.save_pretrained(str(adapter_dir))
    tokenizer.save_pretrained(str(adapter_dir))

    # Adapter-Größe berechnen
    total_size = sum(
        f.stat().st_size for f in adapter_dir.rglob("*") if f.is_file()
    )
    size_mb = total_size / (1024 * 1024)

    print(f"\nLoRA-Adapter gespeichert: {adapter_dir}")
    print(f"  Adapter-Größe: {size_mb:.1f} MB")
    print(f"  (Zum Vergleich: Volles Modell wäre ~16.000 MB)")


# =============================================================================
# HAUPTPROGRAMM
# =============================================================================

def parse_args():
    parser = argparse.ArgumentParser(
        description="QLoRA Fine-Tuning für Qwen3-8B",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )

    parser.add_argument(
        "--model_name", type=str, default=DEFAULT_MODEL,
        help="HuggingFace Model-ID",
    )
    parser.add_argument(
        "--output_dir", type=str, default=DEFAULT_OUTPUT_DIR,
        help="Ausgabeverzeichnis für Checkpoints und Adapter",
    )
    parser.add_argument(
        "--data_url", type=str, default=TRAINING_DATA_URL,
        help="URL zur Trainingsdaten-Datei",
    )
    parser.add_argument(
        "--data_file", type=str, default=None,
        help="Lokaler Pfad zur Trainingsdaten-Datei (überschreibt --data_url)",
    )
    parser.add_argument(
        "--epochs", type=int, default=DEFAULT_EPOCHS,
        help="Anzahl Trainingsepochen",
    )
    parser.add_argument(
        "--lr", type=float, default=DEFAULT_LR,
        help="Lernrate",
    )
    parser.add_argument(
        "--batch_size", type=int, default=DEFAULT_BATCH_SIZE,
        help="Batch-Größe pro GPU",
    )
    parser.add_argument(
        "--rank", type=int, default=DEFAULT_RANK,
        help="LoRA-Rang (höher = mehr Kapazität, mehr VRAM)",
    )
    parser.add_argument(
        "--alpha", type=int, default=DEFAULT_ALPHA,
        help="LoRA-Alpha Skalierungsfaktor",
    )

    return parser.parse_args()


def main():
    args = parse_args()

    print("=" * 60)
    print("  QLoRA Fine-Tuning für Qwen3-8B")
    print("=" * 60)

    # 1. Trainingsdaten laden
    if args.data_file:
        print(f"\nLade lokale Trainingsdaten: {args.data_file}")
        with open(args.data_file, "r", encoding="utf-8") as f:
            instructions = [line.strip() for line in f if line.strip()]
        print(f"  → {len(instructions)} Instruktionen geladen")
    else:
        instructions = download_training_data(args.data_url)

    # 2. Modell laden (quantisiert)
    model, tokenizer = load_quantized_model(args.model_name)

    # 3. Trainingsdaten formatieren (braucht Tokenizer für Chat-Template)
    dataset = format_training_data(instructions, tokenizer)

    # 4. LoRA aufsetzen
    model = setup_lora(model, args.rank, args.alpha, DEFAULT_DROPOUT)

    # 5. Training starten
    trainer = train(model, tokenizer, dataset, args)

    # 6. Adapter speichern
    save_adapter(model, tokenizer, args.output_dir)

    print("\n" + "=" * 60)
    print("  Fertig!")
    print("=" * 60)
    print(f"\nNächster Schritt - Inferenz starten:")
    print(f"  python -m inference.inference_qwen3 \\")
    print(f"    --adapter_dir {args.output_dir}/final_adapter")
    print()


if __name__ == "__main__":
    main()
