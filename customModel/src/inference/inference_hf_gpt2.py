"""
Inferenz-Script für HF-GPT2 Modell
===================================

Interaktive Text-Generierung mit dem trainierten
Hugging Face GPT-2 Modell.

Verwendung:
    python inference_hf_gpt2.py
"""

import torch
from pathlib import Path
from transformers import GPT2LMHeadModel, PreTrainedTokenizerFast


def load_model():
    """Lädt das trainierte HF-GPT2 Modell."""
    script_dir = Path(__file__).parent
    model_path = script_dir.parent.parent / "dist" / "hf_gpt2_model"

    if not model_path.exists():
        print(f"❌ Modell nicht gefunden: {model_path}")
        print("   Bitte erst trainieren mit: python gpt_transformer_language_model.py")
        return None, None

    print(f"📂 Lade Modell aus: {model_path}")

    model = GPT2LMHeadModel.from_pretrained(model_path)
    tokenizer = PreTrainedTokenizerFast.from_pretrained(model_path)

    model.eval()
    print("✅ Modell geladen!")

    return model, tokenizer


def generate_text(model, tokenizer, prompt: str, max_new_tokens: int = 20,
                  temperature: float = 1.0, top_k: int = 50, top_p: float = 0.95):
    """
    Generiert Text mit verschiedenen Sampling-Strategien.

    Args:
        prompt: Starttext
        max_new_tokens: Maximale Anzahl neuer Tokens
        temperature: Kreativität (0.1 = konservativ, 1.5 = kreativ)
        top_k: Nur aus Top-K Tokens samplen
        top_p: Nucleus Sampling Schwelle
    """
    inputs = tokenizer(prompt, return_tensors="pt")

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            do_sample=True,
            top_k=top_k,
            top_p=top_p,
            pad_token_id=tokenizer.pad_token_id,
            eos_token_id=tokenizer.eos_token_id,
        )

    generated = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return generated


def analyze_logits(model, tokenizer, text: str, top_k: int = 10):
    """
    Analysiert die Logits für die nächste Token-Vorhersage.
    """
    inputs = tokenizer(text, return_tensors="pt")

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits[0, -1, :]  # Letzte Position

    # Softmax für Wahrscheinlichkeiten
    probs = torch.softmax(logits, dim=-1)

    # Top-K
    top_probs, top_indices = torch.topk(probs, top_k)

    print(f"\n🔍 Logits-Analyse für: '{text}'")
    print("=" * 60)
    print(f"{'Rang':<6} {'Token':<20} {'Logit':<12} {'Wahrsch.':<12}")
    print("-" * 60)

    for i, (idx, prob) in enumerate(zip(top_indices, top_probs)):
        token = tokenizer.decode([idx.item()])
        logit = logits[idx].item()
        print(f"{i+1:<6} {repr(token):<20} {logit:>8.3f}    {prob.item()*100:>8.2f}%")

    print("-" * 60)


def interactive_mode(model, tokenizer):
    """
    Interaktiver Modus für Text-Generierung.
    """
    print("\n" + "=" * 60)
    print("🎮 INTERAKTIVER MODUS")
    print("=" * 60)
    print("""
    Befehle:
    - Einfach Text eingeben zum Generieren
    - 'temp X.X' - Temperature ändern (z.B. 'temp 0.8')
    - 'len X'    - Ausgabelänge ändern (z.B. 'len 15')
    - 'logits'   - Logits-Analyse für letzten Prompt
    - 'quit'     - Beenden
    """)

    temperature = 0.8
    max_tokens = 15
    last_prompt = ""

    while True:
        try:
            user_input = input(f"\n📝 Prompt (temp={temperature}, len={max_tokens}): ").strip()

            if not user_input:
                continue

            if user_input.lower() == "quit":
                print("\n👋 Auf Wiedersehen!")
                break

            if user_input.lower().startswith("temp "):
                try:
                    temperature = float(user_input.split()[1])
                    print(f"   ✅ Temperature: {temperature}")
                except:
                    print("   ❌ Ungültiger Wert")
                continue

            if user_input.lower().startswith("len "):
                try:
                    max_tokens = int(user_input.split()[1])
                    print(f"   ✅ Max Tokens: {max_tokens}")
                except:
                    print("   ❌ Ungültiger Wert")
                continue

            if user_input.lower() == "logits":
                if last_prompt:
                    analyze_logits(model, tokenizer, last_prompt)
                else:
                    print("   ❌ Noch kein Prompt eingegeben")
                continue

            # Text generieren
            last_prompt = user_input
            generated = generate_text(
                model, tokenizer, user_input,
                max_new_tokens=max_tokens,
                temperature=temperature
            )
            print(f"\n   🤖 {generated}")

        except KeyboardInterrupt:
            print("\n\n👋 Auf Wiedersehen!")
            break


def main():
    print("=" * 60)
    print("🤖 HF-GPT2 INFERENZ")
    print("=" * 60)

    # Modell laden
    model, tokenizer = load_model()
    if model is None:
        return

    # Modell-Info
    total_params = sum(p.numel() for p in model.parameters())
    print(f"\n📊 Modell-Info:")
    print(f"   - Parameter: {total_params:,}")
    print(f"   - Vokabular: {tokenizer.vocab_size} Tokens")

    # Demo-Generierung
    print("\n" + "=" * 60)
    print("📝 DEMO-GENERIERUNG")
    print("=" * 60)

    demo_prompts = ["die katze", "der hund", "das kind"]
    temperatures = [0.5, 0.8, 1.2]

    for prompt in demo_prompts:
        print(f"\n'{prompt}':")
        for temp in temperatures:
            result = generate_text(model, tokenizer, prompt,
                                   max_new_tokens=10, temperature=temp)
            print(f"   temp={temp}: {result}")

    # Logits-Analyse
    print("\n" + "=" * 60)
    print("🔬 LOGITS-ANALYSE")
    print("=" * 60)
    analyze_logits(model, tokenizer, "die katze sitzt", top_k=10)

    # Interaktiver Modus
    interactive_mode(model, tokenizer)


if __name__ == "__main__":
    main()
