"""
Inferenz-Script für das Transformer-Sprachmodell (MiniGPT)
==========================================================

Verwendung:
    python inference_transformer.py                    # Interaktiver Modus
    python inference_transformer.py --text "die katze" # Einzelne Generierung
    python inference_transformer.py --analyze "der hund"  # Logits-Analyse

Autor: Lernprojekt
"""

import torch
import torch.nn.functional as F
import argparse
from pathlib import Path

from training.training_transformer import (
    MiniGPT, SimpleTokenizer, load_transformer_model,
    analyze_logits_detailed, visualize_attention
)


def generate_text(model, tokenizer, start_text: str,
                  max_length: int = 10, temperature: float = 1.0,
                  show_steps: bool = False, top_p: float = 1.0):
    """
    Generiert Text mit dem Transformer-Modell.
    """
    model.eval()

    tokens = tokenizer.encode(start_text)
    if not tokens:
        print("❌ Text konnte nicht tokenisiert werden.")
        return start_text

    print(f"\n🔮 Generierung mit MiniGPT")
    print(f"   Input: '{start_text}'")
    print(f"   Temperature: {temperature}")
    print("-" * 50)

    for step in range(max_length):
        with torch.no_grad():
            # Maximal letzte 10 Tokens als Kontext
            context = tokens[-10:] if len(tokens) > 10 else tokens
            inp = torch.tensor(context).unsqueeze(0)

            logits = model(inp)
            last_logits = logits[0, -1] / temperature

            # Softmax
            probs = F.softmax(last_logits, dim=-1)

            # Top-P Sampling
            if top_p < 1.0:
                sorted_probs, sorted_indices = torch.sort(probs, descending=True)
                cumsum = torch.cumsum(sorted_probs, dim=0)
                mask = cumsum > top_p
                mask[1:] = mask[:-1].clone()
                mask[0] = False
                probs[sorted_indices[mask]] = 0.0
                probs = probs / probs.sum()

            # Sample
            next_token = torch.multinomial(probs, 1).item()
            tokens.append(next_token)

            next_word = tokenizer.idx_to_word.get(next_token, "<UNK>")

            if show_steps:
                top_prob = probs[next_token].item() * 100
                print(f"   Schritt {step+1}: + '{next_word}' ({top_prob:.1f}%)")

            if next_token == tokenizer.word_to_idx.get("<EOS>", -1):
                print("   [EOS]")
                break

    result = tokenizer.decode(tokens)
    print("-" * 50)
    print(f"✨ Ergebnis: '{result}'")
    return result


def interactive_mode(model, tokenizer):
    """Interaktiver Modus."""
    print("\n" + "=" * 60)
    print("🎮 TRANSFORMER INFERENZ - Interaktiver Modus")
    print("=" * 60)
    print("""
    Befehle:
      <text>              - Generiere Text
      /analyze <text>     - Detaillierte Logits-Analyse
      /attention <text>   - Attention-Visualisierung
      /temp <wert>        - Temperature setzen
      /length <wert>      - Max. Länge setzen
      /steps              - Toggle Schritt-Anzeige
      /quit               - Beenden

    Beispiel: die katze
    """)

    temperature = 1.0
    max_length = 10
    show_steps = False

    while True:
        try:
            user_input = input("\n💬 Eingabe: ").strip()

            if not user_input:
                continue

            if user_input.startswith("/"):
                parts = user_input.split(maxsplit=1)
                cmd = parts[0].lower()
                arg = parts[1] if len(parts) > 1 else ""

                if cmd in ["/quit", "/exit"]:
                    print("👋 Auf Wiedersehen!")
                    break

                elif cmd == "/temp":
                    try:
                        temperature = float(arg)
                        print(f"✅ Temperature: {temperature}")
                    except:
                        print("❌ Beispiel: /temp 0.8")

                elif cmd == "/length":
                    try:
                        max_length = int(arg)
                        print(f"✅ Max. Länge: {max_length}")
                    except:
                        print("❌ Beispiel: /length 15")

                elif cmd == "/steps":
                    show_steps = not show_steps
                    print(f"✅ Schritt-Anzeige: {'AN' if show_steps else 'AUS'}")

                elif cmd == "/analyze":
                    if arg:
                        analyze_logits_detailed(model, tokenizer, arg)
                    else:
                        print("❌ Beispiel: /analyze der hund")

                elif cmd == "/attention":
                    if arg:
                        visualize_attention(model, tokenizer, arg)
                    else:
                        print("❌ Beispiel: /attention die katze sitzt")

                else:
                    print(f"❌ Unbekannter Befehl: {cmd}")

            else:
                generate_text(model, tokenizer, user_input,
                            max_length=max_length,
                            temperature=temperature,
                            show_steps=show_steps)

        except KeyboardInterrupt:
            print("\n👋 Abgebrochen.")
            break
        except Exception as e:
            print(f"❌ Fehler: {e}")


def main():
    parser = argparse.ArgumentParser(description="Transformer-Modell Inferenz")

    parser.add_argument("--model", "-m", type=str, default=None,
                       help="Pfad zum Modell (Standard: ./models/transformer_model)")
    parser.add_argument("--text", "-t", type=str, default=None,
                       help="Text für Generierung")
    parser.add_argument("--temp", type=float, default=1.0,
                       help="Temperature (Standard: 1.0)")
    parser.add_argument("--length", "-l", type=int, default=10,
                       help="Max. neue Tokens (Standard: 10)")
    parser.add_argument("--analyze", "-a", type=str, default=None,
                       help="Logits-Analyse für Text")
    parser.add_argument("--attention", type=str, default=None,
                       help="Attention-Visualisierung für Text")
    parser.add_argument("--steps", action="store_true",
                       help="Zeige jeden Generierungsschritt")

    args = parser.parse_args()

    # Modell-Pfad
    if args.model:
        model_dir = args.model
    else:
        script_dir = Path(__file__).parent
        model_dir = script_dir.parent.parent / "dist" / "transformer_model"

    if not Path(model_dir).exists():
        print(f"❌ Modell nicht gefunden: {model_dir}")
        print(f"\n💡 Trainiere zuerst mit:")
        print(f"   python transformer_language_model.py")
        return

    print("=" * 60)
    print("🚀 TRANSFORMER (MiniGPT) INFERENZ")
    print("=" * 60)

    # Laden
    print(f"\n📂 Lade Modell aus: {model_dir}")
    model, tokenizer = load_transformer_model(str(model_dir))

    # Modus
    if args.analyze:
        analyze_logits_detailed(model, tokenizer, args.analyze)

    elif args.attention:
        visualize_attention(model, tokenizer, args.attention)

    elif args.text:
        generate_text(model, tokenizer, args.text,
                     max_length=args.length,
                     temperature=args.temp,
                     show_steps=args.steps)

    else:
        interactive_mode(model, tokenizer)


if __name__ == "__main__":
    main()
