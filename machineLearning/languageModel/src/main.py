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


def _ask_dataset() -> str:
    """Let the user choose between small (S), medium (M), and large (L) training data."""
    print("\n    Datensatz wählen:")
    print("      S = Klein  (22 Sätze, schnell)")
    print("      M = Mittel (200 Sätze, mehr Vokabular)")
    print("      L = Groß   (2000 Sätze, umfangreich)")
    choice = input("    Datensatz [S/M/L]: ").strip().lower()
    if choice == "m":
        return "m"
    elif choice == "l":
        return "l"
    return "s"


def check_models_exist():
    """Prüft welche Modelle bereits trainiert wurden."""
    models_dir = Path(__file__).parent.parent / "dist"
    lstm_exists = (models_dir / "lstm_model" / "model.pt").exists()
    transformer_exists = (models_dir / "transformer_model" / "model.pt").exists()
    finetuned_exists = (models_dir / "finetuning_results").exists()
    fact_correction_exists = (models_dir / "finetuning_results" / "fact_correction").exists()
    evaluation_results_exist = (models_dir / "evaluation_results").exists()
    return lstm_exists, transformer_exists, finetuned_exists, fact_correction_exists, evaluation_results_exist


def main():
    print("=" * 60)
    print("SPRACHMODELL-LERNPROJEKT")
    print("=" * 60)

    lstm_exists, transformer_exists, finetuned_exists, fact_correction_exists, evaluation_results_exist = check_models_exist()

    print(f"""
    Verfügbare Optionen:

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
    5. Neues Wissen beibringen (z.B. Wetter, Kochen)
       - Trainiert mit komplett neuen Themen (FINETUNING_DATA)
       - Vergleich: Full FT vs. Layer Freezing vs. LoRA (auf W_Q, W_K, W_V, W_O)
       {'   [OK] Vortrainiertes Modell verfügbar' if transformer_exists else '   [X] Erst Transformer trainieren (Option 2)!'}

    7. Fakten korrigieren (z.B. "tisch" -> "sofa")
       - Aendert bestehende Assoziationen (FACT_CORRECTION_DATA)
       - Vergleich: LoRA nur auf W_V vs. LoRA auf W_Q, W_K, W_V, W_O
       {'   [OK] Vortrainiertes Modell verfügbar' if transformer_exists else '   [X] Erst Transformer trainieren (Option 2)!'}

    === INFERENZ ===
    3. LSTM-Modell verwenden (Inferenz)
       {'   [OK] Verfügbar' if lstm_exists else '   [X] Erst trainieren!'}

    4. Transformer-Modell verwenden (Inferenz)
       {'   [OK] Verfügbar' if transformer_exists else '   [X] Erst trainieren!'}

    6. Fine-Tuned Modelle verwenden (Inferenz)
       - Vergleicht Original vs. Fine-Tuned Modelle
       - Interaktiver Modus mit Modellwechsel
       {'   [OK] Verfügbar' if finetuned_exists else '   [X] Erst fine-tunen (Option 5)!'}

    8. Faktenkorrektur-Modelle verwenden (Inferenz)
       - Vergleicht Original vs. V-only vs. alle Projektionen
       - Zeigt ob korrigierte Fakten gelernt und altes Wissen erhalten wurde
       {'   [OK] Verfügbar' if fact_correction_exists else '   [X] Erst Faktenkorrektur trainieren (Option 7)!'}

    === EVALUATION ===
    9. Modellqualität bewerten (LLM-as-a-Judge)
       - Großes LLM bewertet MiniGPT-Outputs (Grammatik, Kohärenz, Relevanz)
       - Benötigt Ollama oder LM Studio mit geladenem Modell
       {'   [OK] Ergebnisse vorhanden' if evaluation_results_exist else '   [ ] Noch nicht durchgeführt'}

    === WEB ===
    10. Weboberflaeche starten (Gradio)
        - Alle Funktionen im Browser (http://localhost:7860)

    0. Beenden
    """)

    choice = input("    Auswahl (0-10): ").strip()

    if choice == "1":
        dataset = _ask_dataset()
        print("\n" + "=" * 60)
        print("Starte LSTM-Training...")
        print("=" * 60 + "\n")
        from training.training_lstm import main as train_lstm
        train_lstm(dataset=dataset)

    elif choice == "2":
        dataset = _ask_dataset()
        print("\n" + "=" * 60)
        print("Starte Transformer-Training...")
        print("=" * 60 + "\n")
        from training.training_transformer import main as train_transformer
        train_transformer(dataset=dataset)

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

    elif choice == "7":
        if not transformer_exists:
            print("\n[X] Transformer-Modell nicht gefunden! Bitte erst trainieren (Option 2).")
            return
        print("\n" + "=" * 60)
        print("Starte Faktenkorrektur mit LoRA...")
        print("=" * 60 + "\n")
        from training.finetuning_fact_correction import main as fact_correction
        fact_correction()

    elif choice == "8":
        if not fact_correction_exists:
            print("\n[X] Keine Faktenkorrektur-Modelle gefunden! Bitte erst trainieren (Option 7).")
            return
        print("\n" + "=" * 60)
        print("Starte Faktenkorrektur-Inferenz...")
        print("=" * 60 + "\n")
        from inference.inference_fact_correction import main as run_fact_correction_inference
        run_fact_correction_inference()

    elif choice == "9":
        dataset = _ask_dataset()
        print("\n" + "=" * 60)
        print("Starte LLM-as-a-Judge Bewertung...")
        print("=" * 60 + "\n")
        from evaluation.evaluation_runner import main as run_evaluation
        run_evaluation(dataset=dataset)

    elif choice == "10":
        print("\n" + "=" * 60)
        print("Starte Weboberflaeche...")
        print("=" * 60 + "\n")
        import gradio as gr
        from web.app import create_app
        app = create_app()
        app.queue().launch(server_port=7860, theme=gr.themes.Soft())

    elif choice == "0":
        print("\nAuf Wiedersehen!")
        sys.exit(0)

    else:
        print("\n[X] Ungültige Eingabe. Bitte 0-10 eingeben.")
        sys.exit(1)


if __name__ == "__main__":
    main()
