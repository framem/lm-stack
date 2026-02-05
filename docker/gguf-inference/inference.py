#!/usr/bin/env python3
"""GGUF Inferenz via llama-cpp-python"""

import argparse
import sys
from pathlib import Path
from llama_cpp import Llama


def find_models(model_dir: str):
    """Findet GGUF-Modelle im Verzeichnis."""
    path = Path(model_dir)
    if not path.exists():
        return []
    return list(path.glob("*.gguf"))


def main():
    parser = argparse.ArgumentParser(description="GGUF Inferenz")
    parser.add_argument("--model", "-m", help="Pfad zum GGUF-Modell")
    parser.add_argument("--prompt", "-p", help="Prompt für Generierung")
    parser.add_argument("--max-tokens", "-n", type=int, default=20, help="Max Tokens (default: 20)")
    parser.add_argument("--temperature", "-t", type=float, default=0.8, help="Temperature (default: 0.8)")
    parser.add_argument("--interactive", "-i", action="store_true", help="Interaktiver Modus")
    parser.add_argument("--list", "-l", action="store_true", help="Verfügbare Modelle auflisten")
    args = parser.parse_args()

    model_dir = "/models"

    if args.list:
        models = find_models(model_dir)
        if not models:
            print("Keine GGUF-Modelle gefunden in /models")
            return
        print("Verfügbare Modelle:")
        for m in models:
            size_mb = m.stat().st_size / (1024 * 1024)
            print(f"  - {m.name} ({size_mb:.1f} MB)")
        return

    # Modell finden
    if args.model:
        model_path = Path(model_dir) / args.model
    else:
        models = find_models(model_dir)
        if not models:
            print("Keine GGUF-Modelle gefunden. Nutze --list zum Auflisten.")
            sys.exit(1)
        model_path = models[0]
        print(f"Nutze: {model_path.name}")

    if not model_path.exists():
        print(f"Modell nicht gefunden: {model_path}")
        sys.exit(1)

    # Modell laden
    print(f"Lade {model_path.name}...")
    llm = Llama(model_path=str(model_path), n_ctx=128, verbose=False)
    print("Modell geladen!")

    if args.interactive:
        print("\nInteraktiver Modus (quit zum Beenden)")
        print("-" * 40)
        while True:
            try:
                prompt = input("\nPrompt: ").strip()
                if prompt.lower() == "quit":
                    break
                if not prompt:
                    continue
                output = llm(prompt, max_tokens=args.max_tokens, temperature=args.temperature, echo=True)
                print(f"-> {output['choices'][0]['text']}")
            except (KeyboardInterrupt, EOFError):
                break
        print("\nAuf Wiedersehen!")
    elif args.prompt:
        output = llm(args.prompt, max_tokens=args.max_tokens, temperature=args.temperature, echo=True)
        print(output["choices"][0]["text"])
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
