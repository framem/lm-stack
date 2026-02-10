"""
Inferenz-Script für Qwen3-8B mit LoRA-Adapter
===============================================

Lädt das Qwen3-8B Basismodell und wendet einen trainierten LoRA-Adapter an.
Unterstützt sowohl quantisierte Inferenz (wenig VRAM) als auch Adapter-Merging.

Verwendung:
    python -m inference.inference_qwen3 --adapter_dir dist/qwen3_lora/final_adapter
    python -m inference.inference_qwen3 --adapter_dir dist/qwen3_lora/final_adapter --merge --merge_output_dir dist/qwen3_merged

Autor: Lernprojekt
"""

import time
import argparse
from pathlib import Path

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import PeftModel


# =============================================================================
# MODELL-LADEN
# =============================================================================

def load_model_with_adapter(model_name, adapter_dir, quantize=True):
    """
    Lädt das Basismodell und wendet den LoRA-Adapter an.

    WICHTIGES KONZEPT:
    ==================
    Bei QLoRA-Training wird das Basismodell in 4-Bit geladen und die
    LoRA-Gewichte in voller Präzision darauf angewendet. Für die Inferenz
    kann man entweder:
      1. Quantisiert inferieren (wenig VRAM, etwas langsamer)
      2. Adapter in Basismodell mergen (kein PEFT nötig, volle Geschwindigkeit)

    Args:
        model_name: HuggingFace Model-ID (z.B. "Qwen/Qwen3-8B")
        adapter_dir: Pfad zum gespeicherten LoRA-Adapter
        quantize: Wenn True, 4-Bit-Quantisierung verwenden

    Returns:
        model, tokenizer
    """
    adapter_path = Path(adapter_dir)
    if not adapter_path.exists():
        raise FileNotFoundError(f"Adapter-Verzeichnis nicht gefunden: {adapter_dir}")

    print(f"\n   Lade Basismodell: {model_name}")
    print(f"   Adapter: {adapter_dir}")
    print(f"   Quantisierung: {'4-Bit (QLoRA)' if quantize else 'Keine (FP16)'}")

    # 1. Quantisierungs-Konfiguration (identisch zum Training)
    if quantize:
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16,
            bnb_4bit_use_double_quant=True,
        )
    else:
        bnb_config = None

    # 2. Basismodell laden
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        quantization_config=bnb_config,
        device_map="auto",
        torch_dtype=torch.bfloat16,
        trust_remote_code=True,
    )

    # 3. Tokenizer laden
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # 4. LoRA-Adapter anwenden
    print("   Wende LoRA-Adapter an...")
    model = PeftModel.from_pretrained(model, adapter_dir)
    model.eval()

    # 5. Modell-Statistiken anzeigen
    total_params = sum(p.numel() for p in model.parameters())
    adapter_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"\n   Modell geladen:")
    print(f"   - Gesamt-Parameter:  {total_params:>14,}")
    print(f"   - Adapter-Parameter: {adapter_params:>14,}")
    print(f"   - Adapter-Anteil:    {adapter_params / total_params * 100:>13.2f}%")

    return model, tokenizer


# =============================================================================
# ADAPTER-MERGING
# =============================================================================

def merge_and_save(model, tokenizer, output_dir):
    """
    Merged den LoRA-Adapter in die Basis-Gewichte und speichert das Ergebnis.

    LERNEFFEKT:
    ===========
    Nach dem Merging hat man ein vollständiges Modell ohne PEFT-Abhängigkeit.
    Das ist nützlich für:
      - Deployment ohne PEFT-Bibliothek
      - Schnellere Inferenz (kein Adapter-Overhead)
      - Teilen des Modells als einzelnes Paket

    Args:
        model: PeftModel mit geladenem Adapter
        tokenizer: Zugehöriger Tokenizer
        output_dir: Zielverzeichnis für das gemergte Modell
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    print("\n   Merge LoRA-Adapter in Basismodell...")
    model = model.merge_and_unload()

    print(f"   Speichere gemergtes Modell nach: {output_dir}")
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)

    # Größe des gespeicherten Modells anzeigen
    total_size = sum(f.stat().st_size for f in output_path.rglob("*") if f.is_file())
    print(f"   Gespeichert: {total_size / (1024**3):.2f} GB")
    print(f"   Fertig! Modell kann jetzt ohne PEFT geladen werden.")

    return model


# =============================================================================
# TEXT-GENERIERUNG
# =============================================================================

def generate_response(model, tokenizer, prompt, temperature=0.7,
                      top_p=0.9, max_new_tokens=512):
    """
    Generiert eine Antwort mit dem Qwen3-Modell.

    Verwendet das Qwen3 Chat-Template für korrekte Prompt-Formatierung.

    Args:
        model: Das geladene Modell (mit oder ohne Adapter)
        tokenizer: Zugehöriger Tokenizer
        prompt: Benutzer-Eingabe
        temperature: Sampling-Temperatur (höher = kreativer)
        top_p: Nucleus-Sampling-Schwellwert
        max_new_tokens: Maximale Anzahl neuer Tokens

    Returns:
        Generierte Antwort als String
    """
    # Chat-Template formatieren
    messages = [{"role": "user", "content": prompt}]
    input_ids = tokenizer.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=True,
        return_tensors="pt",
    ).to(model.device)

    input_length = input_ids.shape[1]

    # Generierung mit Zeitmessung
    start_time = time.time()

    with torch.no_grad():
        output_ids = model.generate(
            input_ids,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_p=top_p,
            do_sample=True,
            pad_token_id=tokenizer.pad_token_id,
        )

    elapsed = time.time() - start_time
    new_tokens = output_ids.shape[1] - input_length
    tokens_per_sec = new_tokens / elapsed if elapsed > 0 else 0

    # Nur die neuen Tokens dekodieren
    response = tokenizer.decode(
        output_ids[0][input_length:],
        skip_special_tokens=True,
    )

    print(f"   [{new_tokens} Tokens in {elapsed:.1f}s | {tokens_per_sec:.1f} Tokens/s]")

    return response


# =============================================================================
# INTERAKTIVER MODUS
# =============================================================================

def interactive_chat(model, tokenizer, args):
    """
    Interaktiver Chat-Modus mit dem Qwen3-Modell.

    Ermöglicht fortlaufende Konversation mit Anpassung der
    Generierungsparameter zur Laufzeit.
    """
    print("\n" + "=" * 70)
    print("QWEN3-8B INFERENZ - Interaktiver Chat")
    print("=" * 70)
    print(f"""
    Modell:      {args.model_name}
    Adapter:     {args.adapter_dir}
    Temperature: {args.temperature}
    Top-P:       {args.top_p}
    Max Tokens:  {args.max_new_tokens}

    Befehle:
      /temp <wert>    - Temperature setzen
      /top_p <wert>   - Top-P setzen
      /tokens <wert>  - Max. Tokens setzen
      exit / quit / q - Beenden

    Eingabe eingeben und Enter druecken.
    """)

    temperature = args.temperature
    top_p = args.top_p
    max_new_tokens = args.max_new_tokens

    while True:
        try:
            user_input = input("\nDu: ").strip()

            if not user_input:
                continue

            # Beenden
            if user_input.lower() in ["exit", "quit", "q"]:
                print("Auf Wiedersehen!")
                break

            # Befehle verarbeiten
            if user_input.startswith("/"):
                parts = user_input.split(maxsplit=1)
                cmd = parts[0].lower()
                arg = parts[1] if len(parts) > 1 else ""

                if cmd == "/temp":
                    try:
                        temperature = float(arg)
                        print(f"   Temperature: {temperature}")
                    except ValueError:
                        print("   Beispiel: /temp 0.8")

                elif cmd == "/top_p":
                    try:
                        top_p = float(arg)
                        print(f"   Top-P: {top_p}")
                    except ValueError:
                        print("   Beispiel: /top_p 0.95")

                elif cmd == "/tokens":
                    try:
                        max_new_tokens = int(arg)
                        print(f"   Max. Tokens: {max_new_tokens}")
                    except ValueError:
                        print("   Beispiel: /tokens 256")

                else:
                    print(f"   Unbekannter Befehl: {cmd}")
                continue

            # Antwort generieren
            print("\nAssistent:", end=" ")
            response = generate_response(
                model, tokenizer, user_input,
                temperature=temperature,
                top_p=top_p,
                max_new_tokens=max_new_tokens,
            )
            print(response)

        except KeyboardInterrupt:
            print("\n   Abgebrochen.")
            break
        except Exception as e:
            print(f"   Fehler: {e}")


# =============================================================================
# HAUPTPROGRAMM
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Qwen3-8B Inferenz mit LoRA-Adapter",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    # Modell-Argumente
    parser.add_argument(
        "--model_name", type=str, default="Qwen/Qwen3-8B",
        help="HuggingFace Model-ID (Standard: Qwen/Qwen3-8B)",
    )
    parser.add_argument(
        "--adapter_dir", type=str, required=True,
        help="Pfad zum trainierten LoRA-Adapter (erforderlich)",
    )

    # Quantisierung
    parser.add_argument(
        "--quantize", action="store_true", default=True,
        help="4-Bit-Quantisierung verwenden (Standard: aktiviert)",
    )
    parser.add_argument(
        "--no-quantize", action="store_false", dest="quantize",
        help="Quantisierung deaktivieren (mehr VRAM noetig)",
    )

    # Merge-Modus
    parser.add_argument(
        "--merge", action="store_true", default=False,
        help="LoRA-Adapter in Basismodell mergen und speichern",
    )
    parser.add_argument(
        "--merge_output_dir", type=str, default="dist/qwen3_merged",
        help="Zielverzeichnis fuer gemergtes Modell (Standard: dist/qwen3_merged)",
    )

    # Generierungs-Parameter
    parser.add_argument(
        "--temperature", type=float, default=0.7,
        help="Sampling-Temperatur (Standard: 0.7)",
    )
    parser.add_argument(
        "--top_p", type=float, default=0.9,
        help="Top-P Nucleus-Sampling (Standard: 0.9)",
    )
    parser.add_argument(
        "--max_new_tokens", type=int, default=512,
        help="Maximale Anzahl neuer Tokens (Standard: 512)",
    )

    args = parser.parse_args()

    print("=" * 70)
    print("QWEN3-8B MIT LORA-ADAPTER")
    print("=" * 70)

    # Modell + Adapter laden
    model, tokenizer = load_model_with_adapter(
        args.model_name,
        args.adapter_dir,
        quantize=args.quantize,
    )

    # Merge-Modus: Adapter in Basismodell mergen und speichern
    if args.merge:
        merge_and_save(model, tokenizer, args.merge_output_dir)
        return

    # Interaktiver Chat-Modus
    interactive_chat(model, tokenizer, args)


if __name__ == "__main__":
    main()
