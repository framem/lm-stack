"""
Mini-LLaMA Inferenz
===================

Interaktive Text-Generierung mit dem trainierten Mini-LLaMA Modell.
"""

import torch
from pathlib import Path
from transformers import LlamaForCausalLM, AutoTokenizer


def load_model(model_dir: str):
    """Laedt das trainierte Mini-LLaMA Modell."""
    model_path = Path(model_dir)

    print(f"Lade Modell von: {model_path}")

    # Tokenizer laden
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    print(f"   Tokenizer geladen ({tokenizer.vocab_size} Tokens)")

    # Modell laden
    model = LlamaForCausalLM.from_pretrained(model_path)
    print(f"   Modell geladen")

    return model, tokenizer


def generate_text(model, tokenizer, prompt: str, max_new_tokens: int = 30,
                  temperature: float = 0.8, device: str = "cpu"):
    """Generiert Text basierend auf einem Prompt."""
    model.to(device)
    model.eval()

    inputs = tokenizer(prompt, return_tensors="pt").to(device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            do_sample=True,
            top_k=50,
            top_p=0.95,
            pad_token_id=tokenizer.pad_token_id,
            eos_token_id=tokenizer.eos_token_id,
            repetition_penalty=1.1,
        )

    generated = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return generated


def main():
    print("=" * 60)
    print("MINI-LLAMA INFERENZ")
    print("=" * 60)

    # Modell-Pfad
    script_dir = Path(__file__).parent
    model_dir = script_dir.parent.parent / "dist" / "llama_mini"

    if not model_dir.exists():
        print(f"\n[X] Modell nicht gefunden: {model_dir}")
        print("    Bitte erst trainieren mit Option 3 im Hauptmenue.")
        return

    # Device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"\nDevice: {device}")

    # Modell laden
    model, tokenizer = load_model(str(model_dir))

    # Interaktive Schleife
    print("\n" + "=" * 60)
    print("📝 Interaktive Text-Generierung")
    print("   Gib einen Anfangstext ein, das Modell vervollständigt ihn.")
    print("   Eingabe 'q' zum Beenden.")
    print("=" * 60)

    while True:
        prompt = input("\n🖊️  Dein Text: ").strip()

        if prompt.lower() == 'q':
            print("\n👋 Auf Wiedersehen!")
            break

        if not prompt:
            print("   ⚠️ Bitte Text eingeben.")
            continue

        generated = generate_text(model, tokenizer, prompt, device=device)
        print(f"\n🦙 Generiert: {generated}")


if __name__ == "__main__":
    main()
