"""
Starter-Script für Sprachmodell-Training und Inferenz
======================================================

Dieses Script bietet ein einfaches Menü für:
- Training der Modelle (LSTM oder Transformer)
- Inferenz mit trainierten Modellen

Verwendung:
    python run_training.py
"""

import sys
from pathlib import Path


def check_models_exist():
    """Prüft welche Modelle bereits trainiert wurden."""
    script_dir = Path(__file__).parent
    lstm_exists = (script_dir / "models" / "lstm_model" / "model.pt").exists()
    transformer_exists = (script_dir / "models" / "transformer_model" / "model.pt").exists()
    return lstm_exists, transformer_exists


def main():
    print("=" * 60)
    print("🎓 SPRACHMODELL-LERNPROJEKT")
    print("=" * 60)

    lstm_exists, transformer_exists = check_models_exist()

    print(f"""
    Verfügbare Optionen:

    === TRAINING ===
    1. LSTM-Modell trainieren (Grundlagen)
       - Einfache Architektur
       - Gut zum Lernen der Basics
       {'   ✅ Bereits trainiert' if lstm_exists else '   ⚪ Noch nicht trainiert'}

    2. Transformer-Modell trainieren (Fortgeschritten)
       - GPT-artige Architektur
       - Self-Attention Mechanismus
       {'   ✅ Bereits trainiert' if transformer_exists else '   ⚪ Noch nicht trainiert'}

    === INFERENZ ===
    3. LSTM-Modell verwenden (Inferenz)
       {'   ✅ Verfügbar' if lstm_exists else '   ❌ Erst trainieren!'}

    4. Transformer-Modell verwenden (Inferenz)
       {'   ✅ Verfügbar' if transformer_exists else '   ❌ Erst trainieren!'}

    0. Beenden
    """)

    choice = input("    Auswahl (0-4): ").strip()

    if choice == "1":
        print("\n" + "=" * 60)
        print("🏋️ Starte LSTM-Training...")
        print("=" * 60 + "\n")
        from simple_language_model import main as train_lstm
        train_lstm()

    elif choice == "2":
        print("\n" + "=" * 60)
        print("🏋️ Starte Transformer-Training...")
        print("=" * 60 + "\n")
        from transformer_language_model import main as train_transformer
        train_transformer()

    elif choice == "3":
        if not lstm_exists:
            print("\n❌ LSTM-Modell nicht gefunden! Bitte erst trainieren (Option 1).")
            return
        print("\n" + "=" * 60)
        print("🔮 Starte LSTM-Inferenz...")
        print("=" * 60 + "\n")
        from inference import main as run_inference
        run_inference()

    elif choice == "4":
        if not transformer_exists:
            print("\n❌ Transformer-Modell nicht gefunden! Bitte erst trainieren (Option 2).")
            return
        print("\n" + "=" * 60)
        print("🔮 Starte Transformer-Inferenz...")
        print("=" * 60 + "\n")
        from inference_transformer import main as run_transformer_inference
        run_transformer_inference()

    elif choice == "0":
        print("\n👋 Auf Wiedersehen!")
        sys.exit(0)

    else:
        print("\n❌ Ungültige Eingabe. Bitte 0-4 eingeben.")
        sys.exit(1)


if __name__ == "__main__":
    main()
