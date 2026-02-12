"""
Inferenz-Script für fine-getunte Transformer-Modelle
=====================================================

Lädt und vergleicht die verschiedenen Fine-Tuning-Varianten:
- Full Fine-Tuning
- Layer Freezing
- LoRA (Adapter oder gemerged)
- Original (als Referenz)

Verwendung:
    python src/main.py   # Option 6

Autor: Lernprojekt
"""

import json
import argparse
from pathlib import Path

import torch
import torch.nn.functional as F

from training.training_transformer import (
    MiniGPT,
    SimpleTokenizer,
    load_transformer_model,
    analyze_logits_detailed,
    visualize_attention,
)
from training.finetuning_transformer import LoRALinear, apply_lora
from inference import get_device, print_device_info


# =============================================================================
# MODELL-LADEN
# =============================================================================

def load_lora_adapter(base_model_dir, adapter_dir):
    """
    Lädt ein Basismodell und wendet einen LoRA-Adapter darauf an.

    WICHTIGES KONZEPT:
    ==================
    In der Praxis hat man oft:
      1. Ein großes Basismodell (z.B. LLaMA-70B, einmal heruntergeladen)
      2. Viele kleine LoRA-Adapter (je 50 MB, für verschiedene Aufgaben)

    Diese Funktion zeigt, wie man Basismodell + Adapter kombiniert:
      Basismodell laden -> Vokabular erweitern -> LoRA draufsetzen -> Adapter-Gewichte laden
    """
    adapter_path = Path(adapter_dir)

    # 1. LoRA-Config laden
    with open(adapter_path / "lora_config.json", "r") as f:
        lora_config = json.load(f)

    # 2. Tokenizer des Adapters laden (hat erweitertes Vokabular)
    tokenizer = SimpleTokenizer.load(str(adapter_path / "tokenizer.json"))

    # 3. Basismodell laden
    base_path = Path(base_model_dir)
    with open(base_path / "config.json", "r") as f:
        model_config = json.load(f)

    model = MiniGPT(
        vocab_size=lora_config["vocab_size"],  # Erweitertes Vokabular!
        embed_dim=model_config["embed_dim"],
        num_heads=model_config.get("num_heads", 4),
        num_layers=model_config.get("num_layers", 2),
        max_len=model_config.get("max_len", 50),
    )

    # Basis-Gewichte laden (nur die, die passen)
    base_state = torch.load(base_path / "model.pt", weights_only=True)
    # Embeddings/LM-Head haben sich in der Größe geändert -> partial load
    model_state = model.state_dict()
    for key, value in base_state.items():
        if key in model_state and model_state[key].shape == value.shape:
            model_state[key] = value
    model.load_state_dict(model_state)

    # 4. LoRA-Schichten einfügen
    rank = lora_config["rank"]
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
    print(f"   Basismodell:  {base_model_dir}")
    print(f"   LoRA-Adapter: {adapter_dir}")
    print(f"   Rank: {rank}, Vokabular: {tokenizer.vocab_size} Tokens")

    return model, tokenizer


def discover_models(base_dir):
    """
    Findet alle verfügbaren Modelle (Original + Fine-Tuned).
    Gibt ein dict mit Name -> (Pfad, Typ) zurück.
    """
    models = {}

    # Original-Modell
    original_dir = base_dir / "transformer_model"
    if (original_dir / "model.pt").exists():
        models["original"] = {
            "path": original_dir,
            "type": "standard",
            "label": "Transformer (Basis-Training)",
        }

    # Fine-Tuning-Ergebnisse
    ft_dir = base_dir / "finetuning_results"
    if ft_dir.exists():
        # Full Fine-Tuned
        full_dir = ft_dir / "full_finetuned"
        if (full_dir / "model.pt").exists():
            models["full_ft"] = {
                "path": full_dir,
                "type": "standard",
                "label": "Full Fine-Tuning",
            }

        # Layer Freezing
        frozen_dir = ft_dir / "layer_frozen"
        if (frozen_dir / "model.pt").exists():
            models["frozen"] = {
                "path": frozen_dir,
                "type": "standard",
                "label": "Layer Freezing",
            }

        # LoRA Adapter
        lora_adapter_dir = ft_dir / "lora_adapter"
        if (lora_adapter_dir / "lora_weights.pt").exists():
            models["lora_adapter"] = {
                "path": lora_adapter_dir,
                "type": "lora_adapter",
                "label": "LoRA (Adapter)",
            }

        # LoRA Merged
        lora_merged_dir = ft_dir / "lora_merged"
        if (lora_merged_dir / "model.pt").exists():
            models["lora_merged"] = {
                "path": lora_merged_dir,
                "type": "standard",
                "label": "LoRA (Gemerged)",
            }

    return models


def load_model_by_type(model_info, base_dir):
    """Lädt ein Modell anhand seines Typs."""
    if model_info["type"] == "standard":
        return load_transformer_model(str(model_info["path"]))
    elif model_info["type"] == "lora_adapter":
        base_model_dir = base_dir / "transformer_model"
        return load_lora_adapter(str(base_model_dir), str(model_info["path"]))


# =============================================================================
# TEXT-GENERIERUNG
# =============================================================================

def generate_text(model, tokenizer, start_text, max_length=10,
                  temperature=1.0, top_p=1.0, show_steps=False):
    """Generiert Text mit einem Modell."""
    model.eval()
    tokens = tokenizer.encode(start_text)

    if not tokens:
        return start_text

    device = next(model.parameters()).device

    for step in range(max_length):
        with torch.no_grad():
            context = tokens[-10:] if len(tokens) > 10 else tokens
            inp = torch.tensor(context, device=device).unsqueeze(0)
            logits = model(inp)
            last_logits = logits[0, -1] / temperature

            probs = F.softmax(last_logits, dim=-1)

            if top_p < 1.0:
                sorted_probs, sorted_indices = torch.sort(probs, descending=True)
                cumsum = torch.cumsum(sorted_probs, dim=0)
                mask = cumsum > top_p
                mask[1:] = mask[:-1].clone()
                mask[0] = False
                probs[sorted_indices[mask]] = 0.0
                probs = probs / probs.sum()

            next_token = torch.multinomial(probs, 1).item()
            tokens.append(next_token)

            if show_steps:
                word = tokenizer.idx_to_word.get(next_token, "<UNK>")
                prob = probs[next_token].item() * 100
                print(f"      Schritt {step+1}: + '{word}' ({prob:.1f}%)")

            if next_token == tokenizer.word_to_idx.get("<EOS>", -1):
                break

    return tokenizer.decode(tokens)


# =============================================================================
# VERGLEICHSMODUS
# =============================================================================

def compare_models(loaded_models, prompts, temperature=0.8):
    """
    Vergleicht alle geladenen Modelle auf denselben Prompts.

    LERNEFFEKT:
    ===========
    Hier sieht man direkt, wie sich die verschiedenen Fine-Tuning-Methoden
    auf die Textgenerierung auswirken:
    - Kann das Full-FT-Modell noch alte Sätze? (Catastrophic Forgetting?)
    - Wie unterscheiden sich LoRA-Adapter vs. LoRA-Merged?
    - Welches Modell generiert die besten neuen Sätze?
    """
    print("\n" + "=" * 70)
    print("MODELL-VERGLEICH")
    print("=" * 70)
    print(f"   Temperature: {temperature}")
    print(f"   Prompts: {prompts}")

    for prompt in prompts:
        print(f"\n   --- Prompt: '{prompt}' ---")
        for name, (model, tokenizer) in loaded_models.items():
            result = generate_text(model, tokenizer, prompt,
                                   max_length=6, temperature=temperature)
            print(f"   {name:<25} -> '{result}'")


def show_top_predictions(loaded_models, prompt, top_k=5):
    """Zeigt die Top-K Vorhersagen aller Modelle für ein Prompt."""
    print(f"\n   --- Top-{top_k} Vorhersagen für '{prompt}' ---")
    print(f"   {'Modell':<25} {'#1':<12} {'#2':<12} {'#3':<12} {'#4':<12} {'#5':<12}")
    print("   " + "-" * 85)

    for name, (model, tokenizer) in loaded_models.items():
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

        print(f"   {name:<25} {'  '.join(f'{p:<12}' for p in preds)}")


# =============================================================================
# INTERAKTIVER MODUS
# =============================================================================

def interactive_mode(loaded_models):
    """Interaktiver Modus mit Modellauswahl."""
    model_names = list(loaded_models.keys())
    current_model_name = model_names[0]
    current_model, current_tokenizer = loaded_models[current_model_name]

    temperature = 0.8
    max_length = 10
    show_steps = False

    print("\n" + "=" * 70)
    print("FINE-TUNED MODELL INFERENZ - Interaktiver Modus")
    print("=" * 70)
    print(f"""
    Befehle:
      <text>                - Generiere Text mit aktivem Modell
      /model                - Modell wechseln
      /compare <text>       - Alle Modelle vergleichen
      /top <text>           - Top-5 Vorhersagen aller Modelle
      /analyze <text>       - Detaillierte Logits-Analyse
      /attention <text>     - Attention-Visualisierung
      /temp <wert>          - Temperature setzen (aktuell: {temperature})
      /length <wert>        - Max. Länge setzen (aktuell: {max_length})
      /steps                - Toggle Schritt-Anzeige
      /quit                 - Beenden

    Aktives Modell: {current_model_name}
    Verfügbare Modelle: {', '.join(model_names)}

    Beispiel-Prompts:
      Altes Wissen: die katze, der hund, das kind
      Neues Wissen: der wind, die suppe, der kuchen
    """)

    while True:
        try:
            user_input = input(f"\n[{current_model_name}] Eingabe: ").strip()

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
                    print("\n   Verfügbare Modelle:")
                    for i, name in enumerate(model_names):
                        marker = ">>>" if name == current_model_name else "   "
                        label = loaded_models[name][0].__class__.__name__
                        print(f"   {marker} {i+1}. {name}")
                    choice = input("   Nummer wählen: ").strip()
                    try:
                        idx = int(choice) - 1
                        if 0 <= idx < len(model_names):
                            current_model_name = model_names[idx]
                            current_model, current_tokenizer = loaded_models[current_model_name]
                            print(f"   Aktives Modell: {current_model_name}")
                        else:
                            print("   Ungültige Nummer.")
                    except ValueError:
                        print("   Bitte eine Nummer eingeben.")

                elif cmd == "/compare":
                    if arg:
                        prompts = [p.strip() for p in arg.split(",")]
                        compare_models(loaded_models, prompts, temperature)
                    else:
                        # Standard-Prompts: Mix aus alt und neu
                        compare_models(loaded_models,
                                       ["die katze", "der wind", "die suppe", "der hund"],
                                       temperature)

                elif cmd == "/top":
                    if arg:
                        show_top_predictions(loaded_models, arg)
                    else:
                        print("   Beispiel: /top der wind")

                elif cmd == "/analyze":
                    if arg:
                        analyze_logits_detailed(current_model, current_tokenizer, arg)
                    else:
                        print("   Beispiel: /analyze der hund")

                elif cmd == "/attention":
                    if arg:
                        visualize_attention(current_model, current_tokenizer, arg)
                    else:
                        print("   Beispiel: /attention die katze sitzt")

                elif cmd == "/temp":
                    try:
                        temperature = float(arg)
                        print(f"   Temperature: {temperature}")
                    except ValueError:
                        print("   Beispiel: /temp 0.8")

                elif cmd == "/length":
                    try:
                        max_length = int(arg)
                        print(f"   Max. Länge: {max_length}")
                    except ValueError:
                        print("   Beispiel: /length 15")

                elif cmd == "/steps":
                    show_steps = not show_steps
                    print(f"   Schritt-Anzeige: {'AN' if show_steps else 'AUS'}")

                else:
                    print(f"   Unbekannter Befehl: {cmd}")

            else:
                result = generate_text(current_model, current_tokenizer,
                                       user_input, max_length=max_length,
                                       temperature=temperature,
                                       show_steps=show_steps)
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

    print("=" * 70)
    print("FINE-TUNED MODELL INFERENZ")
    print("=" * 70)

    # Verfügbare Modelle finden
    available = discover_models(base_dir)

    if not available:
        print("\n   Keine Modelle gefunden!")
        print(f"   Erwartet in: {base_dir}")
        print("   Bitte erst trainieren (Option 2) und fine-tunen (Option 5).")
        return

    print(f"\n   Gefundene Modelle ({len(available)}):")
    for name, info in available.items():
        print(f"   - {name:<20} {info['label']:<25} ({info['path']})")

    # Device bestimmen
    device = get_device()
    print_device_info(device)

    # Alle Modelle laden
    print("\n   Lade Modelle...")
    loaded_models = {}

    for name, info in available.items():
        try:
            print(f"\n   [{name}] Lade {info['label']}...")
            model, tokenizer = load_model_by_type(info, base_dir)
            model = model.to(device)
            loaded_models[name] = (model, tokenizer)
        except Exception as e:
            print(f"   [{name}] Fehler beim Laden: {e}")

    if not loaded_models:
        print("\n   Kein Modell konnte geladen werden!")
        return

    print(f"\n   {len(loaded_models)} Modell(e) geladen.")

    # Schnellvergleich
    print("\n" + "=" * 70)
    print("SCHNELLVERGLEICH - Altes vs. Neues Wissen")
    print("=" * 70)

    old_prompts = ["die katze", "der hund"]
    new_prompts = ["der wind", "die suppe"]

    print("\n   Altes Wissen (aus Original-Training):")
    compare_models(loaded_models, old_prompts, temperature=0.8)

    print("\n   Neues Wissen (aus Fine-Tuning):")
    compare_models(loaded_models, new_prompts, temperature=0.8)

    # Top-Vorhersagen
    show_top_predictions(loaded_models, "der wind")
    show_top_predictions(loaded_models, "die katze")

    # Interaktiver Modus
    interactive_mode(loaded_models)


if __name__ == "__main__":
    main()
