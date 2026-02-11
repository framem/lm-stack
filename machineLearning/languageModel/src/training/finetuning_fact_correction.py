"""
Faktenkorrektur mit LoRA (nur V-Projektion)
============================================

Dieses Script demonstriert den Unterschied zwischen:
- LoRA auf ALLEN Attention-Projektionen (Q, K, V, O) -> neues Wissen
- LoRA NUR auf der Value-Projektion (V) -> Fakten korrigieren

Theorie: Siehe LORA_EXPLAINED.md, Kapitel 6 (Example 2).

Idee:
-----
Das Modell hat gelernt: "die katze sitzt auf dem -> tisch"
Wir wollen korrigieren:  "die katze sitzt auf dem -> sofa"

Die Attention-Struktur (welches Wort schaut auf welches) ist korrekt -
nur der INHALT (Value), der abgerufen wird, muss sich aendern.
Deshalb reicht LoRA auf W_V allein.

Ausfuehren:
    python -m machineLearning.languageModel.src.training.finetuning_fact_correction
"""

import copy
from pathlib import Path

import torch
from torch.utils.data import DataLoader

from .training_config import RANDOM_SEED
from .training_data import FACT_CORRECTION_DATA
from .training_transformer import TextDataset, load_transformer_model
from .finetuning_transformer import (
    LoRALinear,
    apply_lora,
    count_parameters,
    evaluate_model,
    expand_tokenizer,
    expand_model_embeddings,
    save_lora_adapter,
    save_lora_merged,
    train_model,
)

torch.manual_seed(RANDOM_SEED)


# =============================================================================
# LoRA NUR AUF V-PROJEKTION
# =============================================================================

def apply_lora_v_only(model, rank=4, alpha=1.0):
    """
    Wendet LoRA NUR auf die Value-Projektion (v_proj) an.

    Im Gegensatz zu apply_lora(), das Q, K, V und O wrapped, aendern wir
    hier nur V. Die Attention-Muster (Q, K) und die Ausgabe-Projektion (O)
    bleiben komplett eingefroren.

    Das ist sinnvoll wenn:
    - Die Satzstruktur gleich bleibt ("die katze sitzt auf dem ...")
    - Nur der abgerufene INHALT sich aendern soll ("tisch" -> "sofa")
    """
    lora_layers = []

    for block_idx, block in enumerate(model.blocks):
        attention = block.attention

        # NUR v_proj bekommt LoRA
        attention.v_proj = LoRALinear(attention.v_proj, rank, alpha)

        lora_layers.append(f"block[{block_idx}].attention.v_proj")

    return lora_layers


# =============================================================================
# TRAINING
# =============================================================================

def fact_correction_finetuning(base_model, tokenizer, data, *,
                                epochs=50, rank=4, target="v_only", label=""):
    """
    Trainiert LoRA fuer Faktenkorrektur.

    Args:
        target: "v_only" -> nur W_V (Faktenkorrektur)
                "all"    -> Q, K, V, O (zum Vergleich)
        label:  Name fuer die Ausgabe
    """
    model = copy.deepcopy(base_model)

    # Alle Parameter einfrieren
    for param in model.parameters():
        param.requires_grad = False

    # LoRA anwenden
    if target == "v_only":
        lora_layers = apply_lora_v_only(model, rank=rank, alpha=1.0)
    else:
        lora_layers = apply_lora(model, rank=rank, alpha=1.0)

    print(f"\n   [{label}] LoRA auf: {', '.join(lora_layers)}")

    # Embedding + LM Head trainierbar (fuer ggf. neue Woerter)
    for param in model.token_embedding.parameters():
        param.requires_grad = True
    for param in model.lm_head.parameters():
        param.requires_grad = True

    # Statistik
    total = count_parameters(model)
    trainable = count_parameters(model, only_trainable=True)
    lora_params = sum(
        p.numel() for n, p in model.named_parameters()
        if p.requires_grad and 'lora_' in n
    )

    print(f"   [{label}] Parameter: {total:,} gesamt, {trainable:,} trainierbar "
          f"(davon {lora_params:,} LoRA)")

    # Training
    dataset = TextDataset(data, tokenizer, seq_len=4)
    dataloader = DataLoader(dataset, batch_size=4, shuffle=True)

    lr = 0.002
    losses = train_model(model, dataloader, tokenizer.vocab_size, epochs, lr, label)

    return model, losses


# =============================================================================
# HAUPTPROGRAMM
# =============================================================================

def main(epochs=80):
    print("=" * 70)
    print("FAKTENKORREKTUR MIT LoRA")
    print("Vergleich: LoRA auf V-only vs. LoRA auf alle Projektionen")
    print("=" * 70)

    # --- Schritt 1: Vortrainiertes Modell laden ---
    print("\n--- SCHRITT 1: Vortrainiertes Modell laden ---")

    script_dir = Path(__file__).parent
    model_dir = script_dir.parent.parent / "dist" / "transformer_model"

    if not (model_dir / "model.pt").exists():
        print("\n   FEHLER: Kein vortrainiertes Modell gefunden!")
        print(f"   Erwartet in: {model_dir}")
        print("   Bitte erst das Transformer-Modell trainieren (Option 2 im Hauptmenue).")
        return

    original_model, tokenizer = load_transformer_model(str(model_dir))
    old_vocab_size = tokenizer.vocab_size

    # --- Schritt 2: Vokabular erweitern ---
    print("\n--- SCHRITT 2: Vokabular fuer Korrekturdaten erweitern ---")

    new_words = expand_tokenizer(tokenizer, FACT_CORRECTION_DATA)
    if new_words:
        print(f"   Neue Woerter ({len(new_words)}): {', '.join(new_words)}")
    else:
        print("   Keine neuen Woerter noetig.")

    if tokenizer.vocab_size > old_vocab_size:
        expand_model_embeddings(original_model, old_vocab_size, tokenizer.vocab_size)

    # --- Schritt 3: Original-Verhalten testen ---
    print("\n--- SCHRITT 3: Original-Vorhersagen (VOR Korrektur) ---")

    # Prompts die wir korrigieren wollen
    correction_prompts = [
        "die katze sitzt auf dem",      # Original: tisch, Ziel: sofa
        "der hund läuft im",            # Original: garten, Ziel: wald
        "die frau kocht",               # Original: das essen, Ziel: die suppe
        "der mann liest",               # Original: die zeitung, Ziel: das buch
    ]

    # Prompts die NICHT betroffen sein sollten (altes Wissen)
    unchanged_prompts = [
        "die sonne scheint am",         # himmel (soll gleich bleiben)
        "das kind spielt im",           # garten (soll gleich bleiben)
        "die blume blüht im",           # fruehling (soll gleich bleiben)
    ]

    evaluate_model(original_model, tokenizer, correction_prompts, "Original")
    evaluate_model(original_model, tokenizer, unchanged_prompts, "Original (unveraendert)")

    # --- Schritt 4: Beide Ansaetze trainieren ---
    print("\n--- SCHRITT 4: LoRA-Training ---")

    EPOCHS = epochs

    # Ansatz A: LoRA nur auf V (Faktenkorrektur)
    print("\n" + "=" * 70)
    print("ANSATZ A: LoRA nur auf V-Projektion (Faktenkorrektur)")
    print("=" * 70)
    model_v, losses_v = fact_correction_finetuning(
        original_model, tokenizer, FACT_CORRECTION_DATA,
        epochs=EPOCHS, rank=4, target="v_only", label="V-only",
    )

    # Ansatz B: LoRA auf alle Projektionen (zum Vergleich)
    print("\n" + "=" * 70)
    print("ANSATZ B: LoRA auf alle Projektionen (Q, K, V, O)")
    print("=" * 70)
    model_all, losses_all = fact_correction_finetuning(
        original_model, tokenizer, FACT_CORRECTION_DATA,
        epochs=EPOCHS, rank=4, target="all", label="Alle",
    )

    # --- Schritt 5: Ergebnisse vergleichen ---
    print("\n" + "=" * 70)
    print("ERGEBNISSE")
    print("=" * 70)

    print("\n--- Korrigierte Fakten (sollten sich geaendert haben) ---")
    evaluate_model(model_v, tokenizer, correction_prompts, "V-only")
    evaluate_model(model_all, tokenizer, correction_prompts, "Alle")

    print("\n--- Unveraendertes Wissen (sollte gleich geblieben sein) ---")
    evaluate_model(model_v, tokenizer, unchanged_prompts, "V-only")
    evaluate_model(model_all, tokenizer, unchanged_prompts, "Alle")

    # --- Zusammenfassung ---
    print("\n" + "=" * 70)
    print("ZUSAMMENFASSUNG")
    print("=" * 70)

    lora_v_params = sum(
        p.numel() for n, p in model_v.named_parameters()
        if 'lora_' in n
    )
    lora_all_params = sum(
        p.numel() for n, p in model_all.named_parameters()
        if 'lora_' in n
    )

    print(f"""
    Ansatz A (V-only):
      LoRA-Parameter:  {lora_v_params:,}
      Finaler Loss:    {losses_v[-1]:.4f}
      Ziel:            Fakten korrigieren, Attention-Struktur erhalten

    Ansatz B (Alle):
      LoRA-Parameter:  {lora_all_params:,}
      Finaler Loss:    {losses_all[-1]:.4f}
      Ziel:            Maximale Anpassung (wie fuer neues Domainwissen)

    Erwartung:
    - Korrigierte Fakten: Beide Ansaetze sollten die neuen Fakten lernen
    - Unveraendertes Wissen: V-only sollte weniger Seiteneffekte haben,
      da Q und K (die Attention-Struktur) nicht veraendert werden
    - V-only braucht nur {lora_v_params/lora_all_params*100:.0f}% der LoRA-Parameter von Ansatz B
    """)

    # --- Schritt 6: Modelle speichern ---
    print("\n--- SCHRITT 6: Modelle speichern ---")

    save_dir = model_dir.parent / "finetuning_results" / "fact_correction"
    save_dir.mkdir(parents=True, exist_ok=True)

    LORA_RANK = 4
    LORA_ALPHA = 1.0
    save_kwargs = dict(
        epochs=EPOCHS, lr=0.002,
        rank=LORA_RANK, alpha=LORA_ALPHA,
        base_vocab_size=old_vocab_size,
        new_words=new_words,
        training_data=FACT_CORRECTION_DATA,
    )

    # Ansatz A: V-only Adapter
    print("\n   [1/2] V-only LoRA-Adapter:")
    save_lora_adapter(model_v, tokenizer, save_dir / "v_only",
                      losses=losses_v, **save_kwargs)

    # Ansatz B: Alle Projektionen Adapter
    print("\n   [2/2] Alle-Projektionen LoRA-Adapter:")
    save_lora_adapter(model_all, tokenizer, save_dir / "all",
                      losses=losses_all, **save_kwargs)

    print(f"\n   Ergebnisse gespeichert in: {save_dir.absolute()}")

    return {
        "v_only": {"model": model_v, "losses": losses_v},
        "all": {"model": model_all, "losses": losses_all},
    }


if __name__ == "__main__":
    results = main()
