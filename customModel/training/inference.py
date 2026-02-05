"""
Inferenz-Script für das trainierte Sprachmodell
================================================

Dieses Script lädt ein gespeichertes Modell und ermöglicht:
- Interaktive Text-Generierung
- Logits-Analyse mit Top-K und Top-P Visualisierung
- Batch-Inferenz

Verwendung:
    python inference.py                    # Interaktiver Modus
    python inference.py --text "die katze" # Einzelne Generierung
    python inference.py --model ./models/lstm_model  # Anderes Modell

Autor: Lernprojekt
"""

import torch
import torch.nn.functional as F
import argparse
import json
from pathlib import Path

# Importiere die Modell-Klassen
from simple_language_model import SimpleLanguageModel, Tokenizer, load_model, visualize_logits


def generate_text_interactive(model, tokenizer, start_text: str,
                              max_length: int = 10, temperature: float = 1.0,
                              show_logits: bool = False, top_p: float = 0.9,
                              top_k: int = 5):
    """
    Generiert Text mit dem Modell.

    Args:
        start_text: Anfangstext
        max_length: Maximale Anzahl neuer Tokens
        temperature: Kreativität (0.1 = konservativ, 2.0 = kreativ)
        show_logits: Zeige Logits für jeden Schritt
        top_p: Nucleus Sampling (1.0 = aus, 0.9 = nur Top 90% Wahrscheinlichkeit)
        top_k: Top-K Sampling (0 = aus, 5 = nur Top 5 Wörter)
    """
    model.eval()

    # Start-Tokens
    tokens = tokenizer.encode(start_text)
    if not tokens:
        print("❌ Fehler: Text konnte nicht tokenisiert werden.")
        return start_text

    print(f"\n🔮 Generierung gestartet...")
    print(f"   Input: '{start_text}'")
    print(f"   Tokens: {tokens}")
    print(f"   Temperature: {temperature}, Top-K: {top_k}, Top-P: {top_p}")
    print("-" * 50)

    generated = tokens.copy()

    for step in range(max_length):
        # Letzte Tokens als Input (maximal 5 für Kontext)
        context_tokens = tokens[-5:] if len(tokens) > 5 else tokens
        input_tensor = torch.tensor(context_tokens)

        with torch.no_grad():
            # Forward Pass
            logits_all = model(input_tensor.unsqueeze(0))
            last_logits = logits_all[0, -1, :]  # [vocab_size]

            # Logits anzeigen (optional)
            if show_logits:
                probs_for_display = F.softmax(last_logits, dim=-1)
                print(f"\n📊 Schritt {step + 1}:")
                visualize_logits(
                    last_logits, probs_for_display, tokenizer,
                    tokenizer.decode(context_tokens),
                    top_k_display=10,
                    top_k_sampling=top_k,
                    top_p_sampling=top_p
                )

            # Temperature anwenden
            scaled_logits = last_logits / temperature

            # Softmax für Wahrscheinlichkeiten
            probs = F.softmax(scaled_logits, dim=-1)

            # Top-K Sampling
            if top_k > 0:
                top_k_probs, top_k_indices = torch.topk(probs, min(top_k, probs.size(-1)))
                # Setze alle anderen Wahrscheinlichkeiten auf 0
                probs_filtered = torch.zeros_like(probs)
                probs_filtered.scatter_(0, top_k_indices, top_k_probs)
                probs = probs_filtered / probs_filtered.sum()  # Renormalisieren

            # Top-P (Nucleus) Sampling
            if top_p < 1.0:
                sorted_probs, sorted_indices = torch.sort(probs, descending=True)
                cumsum_probs = torch.cumsum(sorted_probs, dim=0)
                # Entferne Tokens außerhalb des nucleus
                sorted_indices_to_remove = cumsum_probs > top_p
                sorted_indices_to_remove[1:] = sorted_indices_to_remove[:-1].clone()
                sorted_indices_to_remove[0] = False
                indices_to_remove = sorted_indices[sorted_indices_to_remove]
                probs[indices_to_remove] = 0.0
                probs = probs / probs.sum()  # Renormalisieren

            # Nächstes Token samplen
            next_token = torch.multinomial(probs, 1).item()

            # Zum generierten Text hinzufügen
            generated.append(next_token)
            tokens.append(next_token)

            # Zeige Fortschritt
            next_word = tokenizer.idx_to_word.get(next_token, "<UNK>")
            if not show_logits:
                print(f"   + '{next_word}' (TokenId: {next_token})")

            # Abbrechen bei EOS
            if next_token == tokenizer.word_to_idx.get(tokenizer.eos_token):
                print("   [EOS - Satzende erreicht]")
                generated.pop()  # EOS-Token aus Ergebnis entfernen
                break

    generated_text = tokenizer.decode(generated)
    print("-" * 50)
    print(f"✨ Ergebnis: '{generated_text}'")

    return generated_text


def analyze_next_word(model, tokenizer, text: str, top_k: int = 5, top_p: float = 0.9):
    """
    Analysiert die Vorhersage für das nächste Wort.
    Verwendet die gleichen Top-K/Top-P Einstellungen wie die Generierung.
    """
    model.eval()

    tokens = tokenizer.encode(text)
    if not tokens:
        print("❌ Fehler: Text konnte nicht tokenisiert werden.")
        return

    input_tensor = torch.tensor(tokens)

    with torch.no_grad():
        logits_all = model(input_tensor.unsqueeze(0))
        last_logits = logits_all[0, -1, :]
        probs = F.softmax(last_logits, dim=-1)

    visualize_logits(
        last_logits, probs, tokenizer, text,
        top_k_display=10,
        top_k_sampling=top_k,
        top_p_sampling=top_p
    )

    # Zusätzliche Analyse
    print(f"\n🧮 Detaillierte Analyse:")
    print(f"   - Input-Tokens: {tokens}")
    print(f"   - Vokabulargröße: {tokenizer.vocab_size}")
    print(f"   - Logits Shape: {last_logits.shape}")

    # Top-1 Vorhersage
    top_idx = torch.argmax(probs).item()
    top_word = tokenizer.idx_to_word.get(top_idx, "<UNK>")
    top_prob = probs[top_idx].item()
    print(f"\n   🎯 Wahrscheinlichste Fortsetzung: '{top_word}' ({top_prob*100:.1f}%)")


def interactive_mode(model, tokenizer):
    """
    Interaktiver Modus für die Kommandozeile.
    """
    print("\n" + "=" * 60)
    print("🎮 INTERAKTIVER INFERENZ-MODUS")
    print("=" * 60)
    print("""
    Befehle:
      <text>              - Generiere Text ab diesem Prompt
      /analyze <text>     - Analysiere nächstes Wort (nutzt gleiche Einstellungen)
      /temp <wert>        - Setze Temperature (Standard: 1.0)
      /length <wert>      - Setze max. Länge (Standard: 10)
      /topk <wert>        - Setze Top-K Sampling (Standard: 5)
      /topp <wert>        - Setze Top-P Sampling (Standard: 0.9)
      /logits             - Toggle Logits-Anzeige
      /vocab              - Zeige Vokabular
      /settings           - Zeige aktuelle Einstellungen
      /help               - Zeige diese Hilfe
      /quit               - Beenden

    Beispiele:
      die katze           -> Generiert Text ab "die katze"
      /analyze der hund   -> Zeigt Wahrscheinlichkeiten für nächstes Wort
      /topk 10            -> Top-10 Wörter beim Sampling
      /topp 0.5           -> Nucleus Sampling mit 50%
    """)

    # Zentrale Einstellungen (gelten für Generierung UND Analyse)
    temperature = 1.0
    max_length = 10
    show_logits = False
    top_k = 5      # Standard: Top-5
    top_p = 0.9    # Standard: 90%

    while True:
        try:
            user_input = input("\n💬 Eingabe: ").strip()

            if not user_input:
                continue

            # Befehle verarbeiten
            if user_input.startswith("/"):
                parts = user_input.split(maxsplit=1)
                cmd = parts[0].lower()
                arg = parts[1] if len(parts) > 1 else ""

                if cmd == "/quit" or cmd == "/exit":
                    print("👋 Auf Wiedersehen!")
                    break

                elif cmd == "/help":
                    print("Siehe Hilfe oben.")

                elif cmd == "/settings":
                    print(f"\n⚙️ Aktuelle Einstellungen:")
                    print(f"   - Temperature: {temperature}")
                    print(f"   - Max. Länge: {max_length}")
                    print(f"   - Top-K: {top_k}")
                    print(f"   - Top-P: {top_p}")
                    print(f"   - Logits-Anzeige: {'AN' if show_logits else 'AUS'}")

                elif cmd == "/temp":
                    try:
                        temperature = float(arg)
                        print(f"✅ Temperature: {temperature}")
                    except ValueError:
                        print("❌ Ungültiger Wert. Beispiel: /temp 0.8")

                elif cmd == "/length":
                    try:
                        max_length = int(arg)
                        print(f"✅ Max. Länge: {max_length}")
                    except ValueError:
                        print("❌ Ungültiger Wert. Beispiel: /length 15")

                elif cmd == "/topk":
                    try:
                        top_k = int(arg)
                        print(f"✅ Top-K: {top_k if top_k > 0 else 'aus'}")
                    except ValueError:
                        print("❌ Ungültiger Wert. Beispiel: /topk 5")

                elif cmd == "/topp":
                    try:
                        top_p = float(arg)
                        print(f"✅ Top-P: {top_p if top_p < 1.0 else 'aus'}")
                    except ValueError:
                        print("❌ Ungültiger Wert. Beispiel: /topp 0.9")

                elif cmd == "/logits":
                    show_logits = not show_logits
                    print(f"✅ Logits-Anzeige: {'AN' if show_logits else 'AUS'}")

                elif cmd == "/analyze":
                    if arg:
                        analyze_next_word(model, tokenizer, arg, top_k=top_k, top_p=top_p)
                    else:
                        print("❌ Bitte Text angeben. Beispiel: /analyze der hund")

                elif cmd == "/vocab":
                    tokenizer.show_vocabulary(max_words=30)

                else:
                    print(f"❌ Unbekannter Befehl: {cmd}")

            else:
                # Text generieren
                generate_text_interactive(
                    model, tokenizer, user_input,
                    max_length=max_length,
                    temperature=temperature,
                    show_logits=show_logits,
                    top_k=top_k,
                    top_p=top_p
                )

        except KeyboardInterrupt:
            print("\n👋 Abgebrochen.")
            break
        except Exception as e:
            print(f"❌ Fehler: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Inferenz mit dem trainierten Sprachmodell",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Beispiele:
  python inference.py                         # Interaktiver Modus
  python inference.py --text "die katze"      # Einzelne Generierung
  python inference.py --text "der hund" --temp 0.5 --length 15
  python inference.py --text "die katze" --top-k 5 --top-p 0.9
  python inference.py --analyze "die sonne"   # Nur Analyse
        """
    )

    parser.add_argument(
        "--model", "-m",
        type=str,
        default=None,
        help="Pfad zum Modell-Verzeichnis (Standard: ./models/lstm_model)"
    )

    parser.add_argument(
        "--text", "-t",
        type=str,
        default=None,
        help="Text für Generierung (ohne: interaktiver Modus)"
    )

    parser.add_argument(
        "--temp", "--temperature",
        type=float,
        default=1.0,
        help="Temperature für Sampling (Standard: 1.0)"
    )

    parser.add_argument(
        "--length", "-l",
        type=int,
        default=10,
        help="Maximale Anzahl neuer Tokens (Standard: 10)"
    )

    parser.add_argument(
        "--analyze", "-a",
        type=str,
        default=None,
        help="Text analysieren (zeigt Logits ohne Generierung)"
    )

    parser.add_argument(
        "--logits",
        action="store_true",
        help="Zeige Logits bei jedem Schritt"
    )

    parser.add_argument(
        "--top-p",
        type=float,
        default=0.9,
        help="Top-P (Nucleus) Sampling (Standard: 0.9)"
    )

    parser.add_argument(
        "--top-k",
        type=int,
        default=5,
        help="Top-K Sampling (Standard: 5)"
    )

    args = parser.parse_args()

    # Modell-Pfad bestimmen
    if args.model:
        model_dir = args.model
    else:
        script_dir = Path(__file__).parent
        model_dir = script_dir / "models" / "lstm_model"

    # Prüfen ob Modell existiert
    if not Path(model_dir).exists():
        print(f"❌ Modell nicht gefunden: {model_dir}")
        print(f"\n💡 Trainiere zuerst ein Modell mit:")
        print(f"   python simple_language_model.py")
        return

    print("=" * 60)
    print("🚀 SPRACHMODELL INFERENZ")
    print("=" * 60)

    # Modell laden
    print(f"\n📂 Lade Modell aus: {model_dir}")
    model, tokenizer = load_model(str(model_dir))

    # Modus auswählen
    if args.analyze:
        # Nur Analyse (verwendet gleiche Top-K/Top-P Einstellungen)
        analyze_next_word(model, tokenizer, args.analyze, top_k=args.top_k, top_p=args.top_p)

    elif args.text:
        # Einzelne Generierung
        generate_text_interactive(
            model, tokenizer, args.text,
            max_length=args.length,
            temperature=args.temp,
            show_logits=args.logits,
            top_p=args.top_p,
            top_k=args.top_k
        )

    else:
        # Interaktiver Modus
        interactive_mode(model, tokenizer)


if __name__ == "__main__":
    main()
