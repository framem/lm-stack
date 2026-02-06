"""
Starter-Script für Sprachmodell-Training und Inferenz
======================================================

Dieses Script bietet ein einfaches Menü für:
- Training der Modelle (LSTM, Transformer)
- Inferenz mit trainierten Modellen

Verwendung:
    python src/main.py
"""

import sys
from pathlib import Path


def check_models_exist():
    """Prüft welche Modelle bereits trainiert wurden."""
    models_dir = Path(__file__).parent.parent / "dist"
    lstm_exists = (models_dir / "lstm_model" / "model.pt").exists()
    transformer_exists = (models_dir / "transformer_model" / "model.pt").exists()
    finetuned_exists = (models_dir / "finetuning_results").exists()
    return lstm_exists, transformer_exists, finetuned_exists


def main():
    print("=" * 60)
    print("SPRACHMODELL-LERNPROJEKT")
    print("=" * 60)

    lstm_exists, transformer_exists, finetuned_exists = check_models_exist()

    print(f"""
    Verfuegbare Optionen:

    === TRAINING ===
    1. LSTM-Modell trainieren (Grundlagen)
       - Einfache rekurrente Architektur
       - Gut zum Lernen der Basics
       {'   [OK] Bereits trainiert' if lstm_exists else '   [ ] Noch nicht trainiert'}

    2. Transformer-Modell trainieren (Fortgeschritten)
       - Custom GPT-artige Architektur (PyTorch)
       - Self-Attention Mechanismus
       {'   [OK] Bereits trainiert' if transformer_exists else '   [ ] Noch nicht trainiert'}

    === FINE-TUNING ===
    5. Transformer Fine-Tuning (Nachtrainieren)
       - Vortrainiertes Modell mit neuem Wissen erweitern
       - Vergleich: Full FT vs. Layer Freezing vs. LoRA
       {'   [OK] Vortrainiertes Modell verfuegbar' if transformer_exists else '   [X] Erst Transformer trainieren (Option 2)!'}

    === INFERENZ ===
    3. LSTM-Modell verwenden (Inferenz)
       {'   [OK] Verfuegbar' if lstm_exists else '   [X] Erst trainieren!'}

    4. Transformer-Modell verwenden (Inferenz)
       {'   [OK] Verfuegbar' if transformer_exists else '   [X] Erst trainieren!'}

    6. Fine-Tuned Modelle verwenden (Inferenz)
       - Vergleicht Original vs. Fine-Tuned Modelle
       - Interaktiver Modus mit Modellwechsel
       {'   [OK] Verfuegbar' if finetuned_exists else '   [X] Erst fine-tunen (Option 5)!'}

    0. Beenden
    """)

    choice = input("    Auswahl (0-6): ").strip()

    if choice == "1":
        print("\n" + "=" * 60)
        print("Starte LSTM-Training...")
        print("=" * 60 + "\n")
        from training.training_lstm import main as train_lstm
        train_lstm()

    elif choice == "2":
        print("\n" + "=" * 60)
        print("Starte Transformer-Training...")
        print("=" * 60 + "\n")
        from training.training_transformer import main as train_transformer
        train_transformer()

    elif choice == "3":
        if not lstm_exists:
            print("\n[X] LSTM-Modell nicht gefunden! Bitte erst trainieren (Option 1).")
            return
        print("\n" + "=" * 60)
        print("Starte LSTM-Inferenz...")
        print("=" * 60 + "\n")
        from inference.inference_lstm import main as run_inference
        run_inference()

    elif choice == "4":
        if not transformer_exists:
            print("\n[X] Transformer-Modell nicht gefunden! Bitte erst trainieren (Option 2).")
            return
        print("\n" + "=" * 60)
        print("Starte Transformer-Inferenz...")
        print("=" * 60 + "\n")
        from inference.inference_transformer import main as run_transformer_inference
        run_transformer_inference()

    elif choice == "5":
        if not transformer_exists:
            print("\n[X] Transformer-Modell nicht gefunden! Bitte erst trainieren (Option 2).")
            return
        print("\n" + "=" * 60)
        print("Starte Transformer Fine-Tuning...")
        print("=" * 60 + "\n")
        from training.finetuning_transformer import main as finetune_transformer
        finetune_transformer()

    elif choice == "6":
        if not finetuned_exists:
            print("\n[X] Keine fine-getunten Modelle gefunden! Bitte erst fine-tunen (Option 5).")
            return
        print("\n" + "=" * 60)
        print("Starte Fine-Tuned Inferenz...")
        print("=" * 60 + "\n")
        from inference.inference_finetuned import main as run_finetuned_inference
        run_finetuned_inference()

    elif choice == "0":
        print("\nAuf Wiedersehen!")
        sys.exit(0)

    else:
        print("\n[X] Ungueltige Eingabe. Bitte 0-6 eingeben.")
        sys.exit(1)


if __name__ == "__main__":
    main()
