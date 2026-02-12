"""
Inferenz fuer Faktenkorrektur-Modelle
======================================

Laedt und vergleicht die beiden LoRA-Varianten aus dem
Faktenkorrektur-Training (Option 7):
- LoRA nur auf W_V (Faktenkorrektur)
- LoRA auf W_Q, W_K, W_V, W_O (Vollstaendig)
- Original (als Referenz)

Verwendung:
    python src/main.py   # Option 8
"""

import json
from pathlib import Path

import torch
import torch.nn.functional as F

from training.training_transformer import (
    MiniGPT,
    SimpleTokenizer,
    load_transformer_model,
)
from training.finetuning_transformer import apply_lora
from training.finetuning_fact_correction import apply_lora_v_only
from inference import get_device, print_device_info


# =============================================================================
# MODELL-LADEN
# =============================================================================

def load_fact_correction_adapter(base_model_dir, adapter_dir, target="v_only"):
    """
    Laedt ein Basismodell und wendet einen Faktenkorrektur-Adapter an.

    Args:
        target: "v_only" -> LoRA nur auf v_proj
                "all"    -> LoRA auf q, k, v, out_proj
    """
    adapter_path = Path(adapter_dir)

    # 1. LoRA-Config laden
    with open(adapter_path / "lora_config.json", "r") as f:
        lora_config = json.load(f)

    # 2. Tokenizer laden
    tokenizer = SimpleTokenizer.load(str(adapter_path / "tokenizer.json"))

    # 3. Basismodell laden
    base_path = Path(base_model_dir)
    with open(base_path / "config.json", "r") as f:
        model_config = json.load(f)

    model = MiniGPT(
        vocab_size=lora_config["vocab_size"],
        embed_dim=model_config["embed_dim"],
        num_heads=model_config.get("num_heads", 4),
        num_layers=model_config.get("num_layers", 2),
        max_len=model_config.get("max_len", 50),
    )

    # Basis-Gewichte laden (partial load wegen erweitertem Vokabular)
    base_state = torch.load(base_path / "model.pt", weights_only=True)
    model_state = model.state_dict()
    for key, value in base_state.items():
        if key in model_state and model_state[key].shape == value.shape:
            model_state[key] = value
    model.load_state_dict(model_state)

    # 4. LoRA-Schichten einfuegen (je nach Variante)
    rank = lora_config["rank"]
    if target == "v_only":
        apply_lora_v_only(model, rank=rank, alpha=1.0)
    else:
        apply_lora(model, rank=rank, alpha=1.0)

    # 5. LoRA-Gewichte laden
    lora_state = torch.load(adapter_path / "lora_weights.pt", weights_only=True)
    for name, param in model.named_parameters():
        if name in lora_state:
            param.data.copy_(lora_state[name])

    # 6. Erweiterte Embedding-Gewichte laden
    embed_state = torch.load(adapter_path / "embedding_weights.pt", weights_only=True)
    for name, param in model.named_parameters():
        if name in embed_state:
            param.data.copy_(embed_state[name])

    model.eval()
    return model, tokenizer


def show_top_predictions(models, prompt, top_k=5):
    """Zeigt die Top-K Vorhersagen aller Modelle fuer ein Prompt."""
    print(f"\n   Prompt: '{prompt}'")
    print(f"   {'Modell':<25} {'#1':<14} {'#2':<14} {'#3':<14} {'#4':<14} {'#5':<14}")
    print("   " + "-" * 95)

    for name, (model, tokenizer) in models.items():
        model.eval()
        tokens = tokenizer.encode(prompt)
        if not tokens:
            continue

        device = next(model.parameters()).device
        with torch.no_grad():
            inp = torch.tensor(tokens, device=device).unsqueeze(0)
            logits = model(inp)
            probs = F.softmax(logits[0, -1], dim=-1)
            top_probs, top_idx = torch.topk(probs, top_k)

        preds = []
        for p, idx in zip(top_probs, top_idx):
            word = tokenizer.idx_to_word.get(idx.item(), "?")
            preds.append(f"{word}({p.item()*100:.0f}%)")

        print(f"   {name:<25} {'  '.join(f'{p:<14}' for p in preds)}")


def generate_text(model, tokenizer, start_text, max_length=6, temperature=0.8):
    """Generiert Text mit einem Modell."""
    model.eval()
    tokens = tokenizer.encode(start_text)
    if not tokens:
        return start_text

    device = next(model.parameters()).device

    for _ in range(max_length):
        with torch.no_grad():
            context = tokens[-10:] if len(tokens) > 10 else tokens
            inp = torch.tensor(context, device=device).unsqueeze(0)
            logits = model(inp)
            last_logits = logits[0, -1] / temperature
            probs = F.softmax(last_logits, dim=-1)
            next_token = torch.multinomial(probs, 1).item()
            tokens.append(next_token)

    return tokenizer.decode(tokens)


# =============================================================================
# INTERAKTIVER MODUS
# =============================================================================

def interactive_mode(models):
    """Interaktiver Modus zum Testen der Faktenkorrektur."""
    model_names = list(models.keys())
    current_name = model_names[0]
    current_model, current_tokenizer = models[current_name]
    temperature = 0.8

    print(f"""
    Befehle:
      <text>                - Generiere Text mit aktivem Modell
      /model                - Modell wechseln
      /compare <text>       - Alle Modelle vergleichen
      /top <text>           - Top-5 Vorhersagen aller Modelle
      /temp <wert>          - Temperature setzen (aktuell: {temperature})
      /quit                 - Beenden

    Aktives Modell: {current_name}

    Prompts zum Testen:
      Korrigiert:    die katze sitzt auf dem, der hund läuft im
      Unveraendert:  die sonne scheint am, das kind spielt im
    """)

    while True:
        try:
            user_input = input(f"\n[{current_name}] > ").strip()
            if not user_input:
                continue

            if user_input.startswith("/"):
                parts = user_input.split(maxsplit=1)
                cmd = parts[0].lower()
                arg = parts[1] if len(parts) > 1 else ""

                if cmd in ["/quit", "/exit"]:
                    print("Auf Wiedersehen!")
                    break

                elif cmd == "/model":
                    print("\n   Verfuegbare Modelle:")
                    for i, name in enumerate(model_names):
                        marker = ">>>" if name == current_name else "   "
                        print(f"   {marker} {i+1}. {name}")
                    choice = input("   Nummer waehlen: ").strip()
                    try:
                        idx = int(choice) - 1
                        if 0 <= idx < len(model_names):
                            current_name = model_names[idx]
                            current_model, current_tokenizer = models[current_name]
                            print(f"   Aktives Modell: {current_name}")
                    except ValueError:
                        print("   Bitte eine Nummer eingeben.")

                elif cmd == "/compare":
                    prompts = [p.strip() for p in arg.split(",")] if arg else [
                        "die katze sitzt auf dem",
                        "der hund läuft im",
                        "die sonne scheint am",
                    ]
                    for prompt in prompts:
                        print(f"\n   --- '{prompt}' ---")
                        for name, (model, tok) in models.items():
                            result = generate_text(model, tok, prompt,
                                                   temperature=temperature)
                            print(f"   {name:<25} -> '{result}'")

                elif cmd == "/top":
                    if arg:
                        show_top_predictions(models, arg)
                    else:
                        print("   Beispiel: /top die katze sitzt auf dem")

                elif cmd == "/temp":
                    try:
                        temperature = float(arg)
                        print(f"   Temperature: {temperature}")
                    except ValueError:
                        print("   Beispiel: /temp 0.8")

                else:
                    print(f"   Unbekannter Befehl: {cmd}")

            else:
                result = generate_text(current_model, current_tokenizer,
                                       user_input, temperature=temperature)
                print(f"   -> '{result}'")

        except KeyboardInterrupt:
            print("\n   Abgebrochen.")
            break
        except Exception as e:
            print(f"   Fehler: {e}")


# =============================================================================
# HAUPTPROGRAMM
# =============================================================================

def main():
    script_dir = Path(__file__).parent
    base_dir = script_dir.parent.parent / "dist"
    base_model_dir = base_dir / "transformer_model"
    fc_dir = base_dir / "finetuning_results" / "fact_correction"

    print("=" * 70)
    print("FAKTENKORREKTUR - INFERENZ")
    print("Vergleich: Original vs. V-only vs. Alle Projektionen")
    print("=" * 70)

    if not (base_model_dir / "model.pt").exists():
        print("\n   FEHLER: Kein Basismodell gefunden!")
        print(f"   Erwartet in: {base_model_dir}")
        print("   Bitte erst trainieren (Option 2).")
        return

    if not fc_dir.exists():
        print("\n   FEHLER: Keine Faktenkorrektur-Modelle gefunden!")
        print(f"   Erwartet in: {fc_dir}")
        print("   Bitte erst Faktenkorrektur trainieren (Option 7).")
        return

    # Device bestimmen
    device = get_device()
    print_device_info(device)

    # --- Modelle laden ---
    models = {}

    print("\n   Lade Original-Modell...")
    model_orig, tok_orig = load_transformer_model(str(base_model_dir))
    model_orig = model_orig.to(device)
    models["Original"] = (model_orig, tok_orig)

    v_only_dir = fc_dir / "v_only" / "lora_adapter"
    if v_only_dir.exists():
        print("\n   Lade V-only Adapter...")
        model_v, tok_v = load_fact_correction_adapter(
            str(base_model_dir), str(v_only_dir), target="v_only")
        model_v = model_v.to(device)
        models["LoRA V-only"] = (model_v, tok_v)

    all_dir = fc_dir / "all" / "lora_adapter"
    if all_dir.exists():
        print("\n   Lade Alle-Projektionen Adapter...")
        model_all, tok_all = load_fact_correction_adapter(
            str(base_model_dir), str(all_dir), target="all")
        model_all = model_all.to(device)
        models["LoRA Alle (Q,K,V,O)"] = (model_all, tok_all)

    print(f"\n   {len(models)} Modell(e) geladen.")

    # --- Schnellvergleich ---
    print("\n" + "=" * 70)
    print("SCHNELLVERGLEICH")
    print("=" * 70)

    print("\n   Korrigierte Fakten (sollten sich geaendert haben):")
    for prompt in ["die katze sitzt auf dem", "der hund läuft im",
                   "die frau kocht", "der mann liest"]:
        show_top_predictions(models, prompt)

    print("\n   Unveraendertes Wissen (sollte gleich geblieben sein):")
    for prompt in ["die sonne scheint am", "das kind spielt im",
                   "die blume blüht im"]:
        show_top_predictions(models, prompt)

    # --- Interaktiver Modus ---
    interactive_mode(models)


if __name__ == "__main__":
    main()
