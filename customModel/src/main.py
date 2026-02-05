"""
Starter-Script für Sprachmodell-Training und Inferenz
======================================================

Dieses Script bietet ein einfaches Menü für:
- Training der Modelle (LSTM oder Transformer)
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
    hf_gpt2_exists = (models_dir / "hf_gpt2_model" / "model.safetensors").exists()
    return lstm_exists, transformer_exists, hf_gpt2_exists


def main():
    print("=" * 60)
    print("🎓 SPRACHMODELL-LERNPROJEKT")
    print("=" * 60)

    lstm_exists, transformer_exists, hf_gpt2_exists = check_models_exist()

    print(f"""
    Verfügbare Optionen:

    === TRAINING ===
    1. LSTM-Modell trainieren (Grundlagen)
       - Einfache Architektur
       - Gut zum Lernen der Basics
       {'   ✅ Bereits trainiert' if lstm_exists else '   ⚪ Noch nicht trainiert'}

    2. Transformer-Modell trainieren (Fortgeschritten)
       - GPT-artige Architektur (Custom PyTorch)
       - Self-Attention Mechanismus
       {'   ✅ Bereits trainiert' if transformer_exists else '   ⚪ Noch nicht trainiert'}

    3. HF-GPT2-Modell trainieren (LM Studio kompatibel) ⭐
       - Hugging Face GPT-2 Architektur
       - Kann zu GGUF konvertiert werden
       - In LM Studio verwendbar!
       {'   ✅ Bereits trainiert' if hf_gpt2_exists else '   ⚪ Noch nicht trainiert'}

    === INFERENZ ===
    4. LSTM-Modell verwenden (Inferenz)
       {'   ✅ Verfügbar' if lstm_exists else '   ❌ Erst trainieren!'}

    5. Transformer-Modell verwenden (Inferenz)
       {'   ✅ Verfügbar' if transformer_exists else '   ❌ Erst trainieren!'}

    6. HF-GPT2-Modell verwenden (Inferenz)
       {'   ✅ Verfügbar' if hf_gpt2_exists else '   ❌ Erst trainieren!'}

    0. Beenden
    """)

    choice = input("    Auswahl (0-6): ").strip()

    if choice == "1":
        print("\n" + "=" * 60)
        print("🏋️ Starte LSTM-Training...")
        print("=" * 60 + "\n")
        from training.simple_language_model import main as train_lstm
        train_lstm()

    elif choice == "2":
        print("\n" + "=" * 60)
        print("🏋️ Starte Transformer-Training...")
        print("=" * 60 + "\n")
        from training.transformer_language_model import main as train_transformer
        train_transformer()

    elif choice == "3":
        print("\n" + "=" * 60)
        print("🏋️ Starte HF-GPT2-Training (LM Studio kompatibel)...")
        print("=" * 60 + "\n")
        from training.gpt_transformer_language_model import main as train_hf_gpt2
        train_hf_gpt2()

    elif choice == "4":
        if not lstm_exists:
            print("\n❌ LSTM-Modell nicht gefunden! Bitte erst trainieren (Option 1).")
            return
        print("\n" + "=" * 60)
        print("🔮 Starte LSTM-Inferenz...")
        print("=" * 60 + "\n")
        from inference.inference import main as run_inference
        run_inference()

    elif choice == "5":
        if not transformer_exists:
            print("\n❌ Transformer-Modell nicht gefunden! Bitte erst trainieren (Option 2).")
            return
        print("\n" + "=" * 60)
        print("🔮 Starte Transformer-Inferenz...")
        print("=" * 60 + "\n")
        from inference.inference_transformer import main as run_transformer_inference
        run_transformer_inference()

    elif choice == "6":
        if not hf_gpt2_exists:
            print("\n❌ HF-GPT2-Modell nicht gefunden! Bitte erst trainieren (Option 3).")
            return
        print("\n" + "=" * 60)
        print("🔮 Starte HF-GPT2-Inferenz...")
        print("=" * 60 + "\n")
        from inference.inference_hf_gpt2 import main as run_hf_gpt2_inference
        run_hf_gpt2_inference()

    elif choice == "0":
        print("\n👋 Auf Wiedersehen!")
        sys.exit(0)

    else:
        print("\n❌ Ungültige Eingabe. Bitte 0-6 eingeben.")
        sys.exit(1)


if __name__ == "__main__":
    main()
