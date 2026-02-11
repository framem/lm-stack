"""
Fine-Tuning eines Transformer-Modells - Lernprojekt
====================================================

Dieses Script zeigt die 3 wichtigsten Ansätze, um ein vortrainiertes Modell
mit neuem Wissen zu aktualisieren, OHNE es komplett neu zu trainieren.

Warum Fine-Tuning?
------------------
Stell dir vor, du hast ein Modell tagelang auf riesigen Datenmengen trainiert.
Jetzt willst du ihm "Kochwissen" beibringen. Neu trainieren? Dauert Tage.
Fine-Tuning? Minuten bis Stunden.

Die 3 Ansätze:
1. FULL FINE-TUNING:    Alle Gewichte weitertrainieren (kleinere Lernrate)
2. LAYER FREEZING:      Untere Schichten einfrieren, nur obere trainieren
3. LoRA:                Kleine Matrizen an bestehende Gewichte "ankleben"

Autor: Lernprojekt
"""

import copy
import json
import math
from pathlib import Path

import matplotlib.pyplot as plt
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader

from .training_config import (
    RANDOM_SEED, WARMUP_FRACTION, GRAD_CLIP_MAX_NORM,
    EARLY_STOPPING_PATIENCE,
)
from .training_data import FINETUNING_DATA
from .training_transformer import (
    TextDataset,
    load_transformer_model,
)
from .model_report import generate_finetuning_report

torch.manual_seed(RANDOM_SEED)


# =============================================================================
# HILFSFUNKTIONEN
# =============================================================================

def save_finetuned_model(model, tokenizer, save_dir, label, *,
                         losses=None, epochs=0, lr=0.0,
                         base_vocab_size=0, new_words=None,
                         training_data=None,
                         frozen_layers=None, trainable_layers=None):
    """
    Speichert ein fine-getuntes Modell (Full FT oder Layer Freezing).

    Dabei wird das komplette Modell gespeichert - genau wie beim
    Original-Training. Die Inferenz funktioniert identisch.
    """
    save_path = Path(save_dir) / label
    save_path.mkdir(parents=True, exist_ok=True)

    # Config
    config = {
        "model_type": "MiniGPT",
        "finetuning_method": label,
        "vocab_size": tokenizer.vocab_size,
        "embed_dim": model.embed_dim,
        "num_heads": len(model.blocks[0].attention.q_proj.weight) // model.embed_dim if model.blocks else 4,
        "num_layers": len(model.blocks),
        "max_len": 50,
        "weight_tying": getattr(model, 'weight_tying', False),
    }

    with open(save_path / "config.json", "w") as f:
        json.dump(config, f, indent=2)

    torch.save(model.state_dict(), save_path / "model.pt")
    tokenizer.save(str(save_path / "tokenizer.json"))

    # Report generieren
    method = "layer_freezing" if "frozen" in label else "full_finetuning"
    total_params = count_parameters(model)
    trainable_params = count_parameters(model, only_trainable=True)

    generate_finetuning_report(
        model, save_path,
        method=method,
        total_params=total_params,
        trainable_params=trainable_params if method == "layer_freezing" else total_params,
        final_loss=losses[-1] if losses else 0.0,
        epochs=epochs,
        learning_rate=lr,
        base_vocab_size=base_vocab_size,
        new_vocab_size=tokenizer.vocab_size,
        new_words=new_words,
        training_data=training_data,
        frozen_layers=frozen_layers,
        trainable_layers=trainable_layers,
    )

    total_size = sum(f.stat().st_size for f in save_path.iterdir()) / 1024
    print(f"   Gespeichert in: {save_path}")
    print(f"   Größe: {total_size:.1f} KB")

    return save_path


def merge_lora_weights(model):
    """
    "Merged" die LoRA-Gewichte zurück in die Original-Gewichte.

    WICHTIGES KONZEPT:
    ==================
    Nach dem Training kann man die LoRA-Matrizen A und B in die
    Original-Gewichte W "einbacken":

        W_neu = W_original + (B @ A) * scaling

    Danach braucht man die LoRA-Schichten nicht mehr und hat ein
    normales Modell, das man ganz normal für Inferenz nutzen kann.

    Das ist wie: Den transparenten Aufkleber (LoRA) fest auf das
    Foto (Gewichte) aufkleben, sodass es ein einziges Bild wird.

    Vorteil: Keine Extra-Berechnung bei Inferenz (gleiche Geschwindigkeit)
    Nachteil: Man kann den "Aufkleber" nicht mehr ablösen
    """
    merged_count = 0

    for block in model.blocks:
        attention = block.attention
        for proj_name in ['q_proj', 'k_proj', 'v_proj', 'out_proj']:
            layer = getattr(attention, proj_name)

            if isinstance(layer, LoRALinear):
                # W_neu = W_original + (B @ A) * scaling
                with torch.no_grad():
                    lora_update = (layer.lora_B @ layer.lora_A) * layer.scaling
                    layer.original.weight.add_(lora_update)

                # LoRA-Wrapper durch das gemergte Original ersetzen
                setattr(attention, proj_name, layer.original)
                merged_count += 1

    print(f"   {merged_count} LoRA-Schichten in Originalgewichte gemerged")
    return model


def save_lora_adapter(model, tokenizer, save_dir, *,
                      losses=None, epochs=0, lr=0.0,
                      rank=4, alpha=1.0,
                      base_vocab_size=0, new_words=None,
                      training_data=None):
    """
    Speichert NUR die LoRA-Adapter-Gewichte (ohne das Basismodell).

    WICHTIGES KONZEPT:
    ==================
    In der Praxis speichert man oft NUR die LoRA-Gewichte separat:

    Basismodell (LLaMA-70B):     ~140 GB  -> Einmal herunterladen
    LoRA-Adapter (Kochwissen):   ~50 MB   -> Klein, schnell teilbar
    LoRA-Adapter (Medizin):      ~50 MB   -> Anderer Adapter, gleiches Basismodell!

    Man kann also VIELE verschiedene Adapter für EIN Basismodell haben.
    Auf Hugging Face gibt es tausende LoRA-Adapter für populäre Modelle.
    """
    save_path = Path(save_dir) / "lora_adapter"
    save_path.mkdir(parents=True, exist_ok=True)

    # Nur LoRA-Parameter extrahieren
    lora_state = {}
    embedding_state = {}

    for name, param in model.named_parameters():
        if 'lora_' in name:
            lora_state[name] = param.data.clone()
        elif 'token_embedding' in name or 'lm_head' in name:
            embedding_state[name] = param.data.clone()

    # LoRA-Adapter speichern
    torch.save(lora_state, save_path / "lora_weights.pt")

    # Erweiterte Embeddings speichern (für neue Wörter)
    torch.save(embedding_state, save_path / "embedding_weights.pt")

    # LoRA-Konfiguration speichern
    lora_config = {
        "method": "lora",
        "rank": None,  # Wird aus den Gewichten ermittelt
        "target_modules": ["q_proj", "k_proj", "v_proj", "out_proj"],
        "vocab_size": tokenizer.vocab_size,
    }

    # Rank aus den gespeicherten Gewichten ermitteln
    for name, param in lora_state.items():
        if 'lora_A' in name:
            lora_config["rank"] = param.shape[0]
            break

    with open(save_path / "lora_config.json", "w") as f:
        json.dump(lora_config, f, indent=2)

    tokenizer.save(str(save_path / "tokenizer.json"))

    lora_size = sum(p.numel() * 4 for p in lora_state.values()) / 1024  # float32 = 4 bytes
    embed_size = sum(p.numel() * 4 for p in embedding_state.values()) / 1024
    print(f"   LoRA-Adapter gespeichert in: {save_path}")
    print(f"   LoRA-Gewichte:    {lora_size:.1f} KB ({len(lora_state)} Tensoren)")
    print(f"   Embedding-Extras: {embed_size:.1f} KB")

    # Report generieren
    total_params = count_parameters(model)
    trainable_params = count_parameters(model, only_trainable=True)

    generate_finetuning_report(
        model, save_path,
        method="lora_adapter",
        total_params=total_params,
        trainable_params=trainable_params,
        final_loss=losses[-1] if losses else 0.0,
        epochs=epochs,
        learning_rate=lr,
        base_vocab_size=base_vocab_size,
        new_vocab_size=tokenizer.vocab_size,
        new_words=new_words,
        training_data=training_data,
        lora_rank=rank,
        lora_alpha=alpha,
        lora_target_modules=["q_proj", "k_proj", "v_proj", "out_proj"],
    )

    return save_path


def save_lora_merged(model, tokenizer, save_dir, *,
                     losses=None, epochs=0, lr=0.0,
                     rank=4, alpha=1.0,
                     base_vocab_size=0, new_words=None,
                     training_data=None):
    """
    Merged LoRA in die Gewichte und speichert als normales Modell.

    Nach dem Mergen ist das Modell identisch zu einem voll fine-getunten
    Modell - es braucht keine spezielle LoRA-Inferenz-Logik mehr.
    """
    save_path = Path(save_dir) / "lora_merged"
    save_path.mkdir(parents=True, exist_ok=True)

    # Parameter VOR dem Merge zählen (danach sind LoRA-Schichten weg)
    total_params = count_parameters(model)
    trainable_params = count_parameters(model, only_trainable=True)

    # LoRA reinmergen
    model = merge_lora_weights(model)

    # Config (jetzt ein normales MiniGPT)
    config = {
        "model_type": "MiniGPT",
        "finetuning_method": "lora_merged",
        "vocab_size": tokenizer.vocab_size,
        "embed_dim": model.embed_dim,
        "num_heads": len(model.blocks[0].attention.q_proj.weight) // model.embed_dim if model.blocks else 4,
        "num_layers": len(model.blocks),
        "max_len": 50,
        "weight_tying": getattr(model, 'weight_tying', False),
    }

    with open(save_path / "config.json", "w") as f:
        json.dump(config, f, indent=2)

    torch.save(model.state_dict(), save_path / "model.pt")
    tokenizer.save(str(save_path / "tokenizer.json"))

    # Report generieren
    generate_finetuning_report(
        model, save_path,
        method="lora_merged",
        total_params=total_params,
        trainable_params=trainable_params,
        final_loss=losses[-1] if losses else 0.0,
        epochs=epochs,
        learning_rate=lr,
        base_vocab_size=base_vocab_size,
        new_vocab_size=tokenizer.vocab_size,
        new_words=new_words,
        training_data=training_data,
        lora_rank=rank,
        lora_alpha=alpha,
        lora_target_modules=["q_proj", "k_proj", "v_proj", "out_proj"],
    )

    total_size = sum(f.stat().st_size for f in save_path.iterdir()) / 1024
    print(f"   Gemerged gespeichert in: {save_path}")
    print(f"   Größe: {total_size:.1f} KB (normales Modell, keine LoRA-Logik nötig)")

    return save_path


def expand_tokenizer(tokenizer, new_texts):
    """
    Erweitert das Vokabular des Tokenizers um neue Wörter.

    WICHTIGES KONZEPT: Wenn neue Trainingsdaten Wörter enthalten, die
    der Tokenizer nicht kennt, müssen wir das Vokabular erweitern.

    Das ist ein echtes Problem in der Praxis:
    - GPT kennt "COVID" nicht? -> Neues Token nötig
    - Fachbegriffe aus einer Domäne? -> Vokabular erweitern

    Returns:
        new_words: Liste der neu hinzugefügten Wörter
    """
    new_words = []
    for text in new_texts:
        for word in text.lower().split():
            if word not in tokenizer.word_to_idx:
                idx = tokenizer.vocab_size
                tokenizer.word_to_idx[word] = idx
                tokenizer.idx_to_word[idx] = word
                tokenizer.vocab_size += 1
                new_words.append(word)

    return new_words


def expand_model_embeddings(model, old_vocab_size, new_vocab_size):
    """
    Erweitert Embedding- und Output-Layer für neue Vokabular-Größe.

    WICHTIGES KONZEPT: Wenn das Vokabular wächst, müssen auch die
    Gewichts-Matrizen wachsen:

    Vorher:  Embedding [50 Wörter x 64 Dim] -> Jedes der 50 Wörter hat einen 64-dim Vektor
    Nachher: Embedding [62 Wörter x 64 Dim] -> 12 neue Wörter bekommen zufällige Vektoren

    Die ALTEN Gewichte bleiben erhalten! Nur neue werden hinzugefügt.
    """
    if new_vocab_size <= old_vocab_size:
        return

    print(f"\n   Vokabular erweitern: {old_vocab_size} -> {new_vocab_size} Tokens")

    # --- Token Embedding erweitern ---
    old_embedding = model.token_embedding
    new_embedding = nn.Embedding(new_vocab_size, model.embed_dim)

    # Alte Gewichte kopieren
    with torch.no_grad():
        new_embedding.weight[:old_vocab_size] = old_embedding.weight

        # Neue Embeddings: Mittelwert der alten + kleines Rauschen
        # (besser als komplett zufällig, weil sie "im richtigen Wertebereich" starten)
        mean_embedding = old_embedding.weight.mean(dim=0)
        for i in range(old_vocab_size, new_vocab_size):
            new_embedding.weight[i] = mean_embedding + torch.randn_like(mean_embedding) * 0.01

    model.token_embedding = new_embedding

    # --- LM Head (Output Layer) erweitern ---
    old_lm_head = model.lm_head
    new_lm_head = nn.Linear(model.embed_dim, new_vocab_size, bias=False)

    with torch.no_grad():
        new_lm_head.weight[:old_vocab_size] = old_lm_head.weight

        # Neue Output-Gewichte: klein initialisieren
        # (damit neue Wörter anfangs niedrige Wahrscheinlichkeit haben)
        nn.init.normal_(new_lm_head.weight[old_vocab_size:], mean=0.0, std=0.01)

    model.lm_head = new_lm_head
    model.vocab_size = new_vocab_size

    # Re-tie weights if model uses weight tying
    if getattr(model, 'weight_tying', False):
        model.lm_head.weight = model.token_embedding.weight

    print(f"   Token Embedding: [{old_vocab_size}, {model.embed_dim}] -> [{new_vocab_size}, {model.embed_dim}]")
    print(f"   LM Head:         [{model.embed_dim}, {old_vocab_size}] -> [{model.embed_dim}, {new_vocab_size}]")
    if getattr(model, 'weight_tying', False):
        print(f"   Weight Tying:    Wiederhergestellt")


def count_parameters(model, only_trainable=False):
    """Zählt die Parameter eines Modells."""
    if only_trainable:
        return sum(p.numel() for p in model.parameters() if p.requires_grad)
    return sum(p.numel() for p in model.parameters())


def train_model(model, dataloader, vocab_size, epochs, lr, label="",
                val_dataloader=None):
    """Gemeinsame Trainingsschleife für alle Fine-Tuning-Ansätze."""
    trainable_params = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.Adam(trainable_params, lr=lr)
    criterion = nn.CrossEntropyLoss()

    # Cosine annealing with linear warmup
    total_steps = len(dataloader) * epochs
    warmup_steps = int(total_steps * WARMUP_FRACTION)

    def lr_lambda(step):
        if step < warmup_steps:
            return step / max(warmup_steps, 1)
        progress = (step - warmup_steps) / max(total_steps - warmup_steps, 1)
        return 0.5 * (1 + math.cos(math.pi * progress))

    scheduler = torch.optim.lr_scheduler.LambdaLR(optimizer, lr_lambda)

    use_early_stopping = val_dataloader is not None and len(val_dataloader) > 0
    best_val_loss = float('inf')
    best_state = None
    patience_counter = 0

    losses = []

    for epoch in range(epochs):
        model.train()
        total_loss = 0
        for inp, tgt in dataloader:
            logits = model(inp)
            loss = criterion(logits.view(-1, vocab_size), tgt.view(-1))

            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(trainable_params, GRAD_CLIP_MAX_NORM)
            optimizer.step()
            scheduler.step()
            total_loss += loss.item()

        avg_loss = total_loss / len(dataloader)
        losses.append(avg_loss)

        # Validation + Early Stopping
        val_loss_str = ""
        if use_early_stopping:
            model.eval()
            val_loss = 0
            with torch.no_grad():
                for inp, tgt in val_dataloader:
                    logits = model(inp)
                    loss = criterion(logits.view(-1, vocab_size), tgt.view(-1))
                    val_loss += loss.item()
            avg_val_loss = val_loss / len(val_dataloader)
            val_loss_str = f" | Val: {avg_val_loss:.4f}"

            if avg_val_loss < best_val_loss:
                best_val_loss = avg_val_loss
                best_state = copy.deepcopy(model.state_dict())
                patience_counter = 0
            else:
                patience_counter += 1

        if (epoch + 1) % 10 == 0:
            current_lr = scheduler.get_last_lr()[0]
            print(f"   [{label}] Epoche {epoch+1:3d}/{epochs} | Loss: {avg_loss:.4f}{val_loss_str} | LR: {current_lr:.6f}")

        if use_early_stopping and patience_counter >= EARLY_STOPPING_PATIENCE:
            print(f"   [{label}] Early Stopping bei Epoche {epoch+1}")
            break

    # Restore best model weights
    if best_state is not None:
        model.load_state_dict(best_state)
        print(f"   [{label}] Bestes Modell wiederhergestellt (Val Loss: {best_val_loss:.4f})")

    return losses


def evaluate_model(model, tokenizer, test_prompts, label=""):
    """Testet das Modell auf Prompts und zeigt Vorhersagen."""
    model.eval()
    print(f"\n   [{label}] Vorhersagen:")

    for prompt in test_prompts:
        tokens = tokenizer.encode(prompt)
        if not tokens or all(t == 1 for t in tokens):  # All UNK
            print(f"   '{prompt}' -> (unbekannte Wörter)")
            continue

        inp = torch.tensor(tokens).unsqueeze(0)
        with torch.no_grad():
            logits = model(inp)
            last_logits = logits[0, -1]
            probs = F.softmax(last_logits, dim=-1)
            top_probs, top_idx = torch.topk(probs, 5)

        predictions = []
        for prob, idx in zip(top_probs, top_idx):
            word = tokenizer.idx_to_word.get(idx.item(), "<UNK>")
            predictions.append(f"{word}({prob.item()*100:.1f}%)")

        print(f"   '{prompt}' -> {', '.join(predictions)}")


# =============================================================================
# ANSATZ 1: FULL FINE-TUNING
# =============================================================================

def full_finetuning(base_model, tokenizer, new_data, epochs=50, val_data=None):
    """
    FULL FINE-TUNING - Alle Gewichte weitertrainieren
    ==================================================

    Idee:
    -----
    Nimm das vortrainierte Modell und trainiere ALLE Gewichte weiter,
    aber mit einer KLEINEREN Lernrate.

    Warum kleinere Lernrate?
    ------------------------
    - Große Lernrate (0.005): Gut für Training von Scratch
      -> Macht große Schritte, findet schnell ein Minimum
    - Kleine Lernrate (0.001): Gut für Fine-Tuning
      -> Macht kleine Schritte, zerstört gelerntes Wissen nicht

    Analogie:
    ---------
    Stell dir einen Bildhauer vor:
    - Training von Scratch = Grober Meißel (formt die Grundform)
    - Fine-Tuning = Feiner Meißel (verfeinert Details, ohne Grundform zu zerstören)

    Vorteile:
    - Einfach zu implementieren
    - Modell kann sich maximal anpassen

    Nachteile:
    - "Catastrophic Forgetting": Modell kann altes Wissen vergessen!
    - Alle Parameter müssen gespeichert werden
    - Bei großen Modellen: viel Speicher nötig
    """
    print("\n" + "=" * 70)
    print("ANSATZ 1: FULL FINE-TUNING")
    print("=" * 70)

    # Tiefe Kopie des Modells (damit wir das Original nicht verändern)
    model = copy.deepcopy(base_model)

    total_params = count_parameters(model)
    trainable = count_parameters(model, only_trainable=True)
    print(f"\n   Gesamte Parameter:    {total_params:,}")
    print(f"   Trainierbare Params:  {trainable:,} ({trainable/total_params*100:.1f}%)")

    # WICHTIG: Kleinere Lernrate als beim initialen Training!
    # Original: 0.005, Fine-Tuning: 0.001
    FINETUNE_LR = 0.001

    print(f"   Lernrate:             {FINETUNE_LR} (Original war 0.005)")
    print(f"   -> 5x kleiner, um gelerntes Wissen zu schützen\n")

    dataset = TextDataset(new_data, tokenizer, seq_len=4)
    dataloader = DataLoader(dataset, batch_size=4, shuffle=True)

    val_loader = None
    if val_data:
        val_dataset = TextDataset(val_data, tokenizer, seq_len=4)
        if len(val_dataset) > 0:
            val_loader = DataLoader(val_dataset, batch_size=4, shuffle=False)

    losses = train_model(model, dataloader, tokenizer.vocab_size, epochs, FINETUNE_LR, "Full FT",
                         val_dataloader=val_loader)

    return model, losses


# =============================================================================
# ANSATZ 2: LAYER FREEZING (PARTIAL FINE-TUNING)
# =============================================================================

def layer_freezing(base_model, tokenizer, new_data, epochs=50, val_data=None):
    """
    LAYER FREEZING - Nur bestimmte Schichten trainieren
    =====================================================

    Idee:
    -----
    Friere die unteren Schichten ein (kein Gradient-Update) und
    trainiere nur die oberen Schichten + Output-Layer.

    Warum funktioniert das?
    -----------------------
    Verschiedene Schichten lernen verschiedene Dinge:

    Untere Schichten (nahe am Input):
    -> Lernen ALLGEMEINE Muster (Syntax, Grammatik, Wortarten)
    -> Ändern sich wenig zwischen Domänen
    -> EINFRIEREN: Spart Rechenzeit, schützt Grundwissen

    Obere Schichten (nahe am Output):
    -> Lernen SPEZIFISCHE Muster (Semantik, Zusammenhänge)
    -> Müssen sich an neue Domäne anpassen
    -> TRAINIEREN: Passt das Modell an neue Daten an

    Analogie:
    ---------
    Wie ein Koch der eine neue Küche lernt:
    - Grundtechniken (Schneiden, Braten) bleiben gleich  -> EINFRIEREN
    - Rezepte und Gewürze ändern sich                   -> TRAINIEREN

    Vorteile:
    - Schützt vor Catastrophic Forgetting
    - Schneller als Full Fine-Tuning
    - Weniger Speicher für Gradienten nötig

    Nachteile:
    - Weniger flexibel als Full Fine-Tuning
    - Man muss entscheiden, WO man einfriert
    """
    print("\n" + "=" * 70)
    print("ANSATZ 2: LAYER FREEZING")
    print("=" * 70)

    model = copy.deepcopy(base_model)

    # --- Schichten einfrieren ---
    # Schritt 1: ALLES einfrieren
    for param in model.parameters():
        param.requires_grad = False

    # Schritt 2: Nur bestimmte Teile wieder "auftauen"
    # -> Letzter Transformer Block
    for param in model.blocks[-1].parameters():
        param.requires_grad = True

    # -> Finale LayerNorm
    for param in model.ln_final.parameters():
        param.requires_grad = True

    # -> LM Head (Output-Schicht)
    for param in model.lm_head.parameters():
        param.requires_grad = True

    # -> Token Embedding (für neue Wörter)
    for param in model.token_embedding.parameters():
        param.requires_grad = True

    # Übersicht: Was ist eingefroren, was nicht?
    print("\n   Schicht-Übersicht:")
    print("   " + "-" * 50)
    for name, param in model.named_parameters():
        status = "TRAINIERBAR" if param.requires_grad else "EINGEFROREN"
        icon = ">>>" if param.requires_grad else "   "
        print(f"   {icon} {name:<40} {status}")
    print("   " + "-" * 50)

    total_params = count_parameters(model)
    trainable = count_parameters(model, only_trainable=True)
    frozen = total_params - trainable
    print(f"\n   Gesamte Parameter:    {total_params:,}")
    print(f"   Eingefroren:          {frozen:,} ({frozen/total_params*100:.1f}%)")
    print(f"   Trainierbar:          {trainable:,} ({trainable/total_params*100:.1f}%)")

    FINETUNE_LR = 0.001

    dataset = TextDataset(new_data, tokenizer, seq_len=4)
    dataloader = DataLoader(dataset, batch_size=4, shuffle=True)

    val_loader = None
    if val_data:
        val_dataset = TextDataset(val_data, tokenizer, seq_len=4)
        if len(val_dataset) > 0:
            val_loader = DataLoader(val_dataset, batch_size=4, shuffle=False)

    losses = train_model(model, dataloader, tokenizer.vocab_size, epochs, FINETUNE_LR, "Frozen",
                         val_dataloader=val_loader)

    return model, losses


# =============================================================================
# ANSATZ 3: LoRA (Low-Rank Adaptation)
# =============================================================================

class LoRALinear(nn.Module):
    """
    LoRA-Schicht - Die clevere Alternative zu Full Fine-Tuning.

    KERNIDEE:
    =========
    Statt die Original-Gewichte W zu ändern, fügen wir KLEINE Matrizen
    A und B hinzu:

        Original:     y = W * x           (W ist [out, in], z.B. [64, 64])
        Mit LoRA:     y = W * x + B * A * x

    Wobei:
        W = Originale Gewichte [out_dim, in_dim]    -> EINGEFROREN
        A = Runterprojektion  [rank, in_dim]         -> TRAINIERBAR (klein!)
        B = Hochprojektion    [out_dim, rank]         -> TRAINIERBAR (klein!)

    WARUM FUNKTIONIERT DAS?
    =======================
    Forschung hat gezeigt: Die Gewichtsänderungen beim Fine-Tuning haben
    einen niedrigen "Rang" (rank). Das heißt, die meisten Änderungen
    lassen sich durch wenige Dimensionen beschreiben.

    Beispiel mit Zahlen:
    --------------------
    Original W:          [64 x 64] = 4.096 Parameter
    LoRA A:              [4 x 64]  = 256 Parameter
    LoRA B:              [64 x 4]  = 256 Parameter
    LoRA gesamt:                    = 512 Parameter (nur 12.5% von W!)

    rank=4 bedeutet: Wir nehmen an, dass die Änderung in einem
    4-dimensionalen Unterraum des 64-dimensionalen Raums liegt.

    ANALOGIE:
    =========
    Stell dir ein Foto vor (die Original-Gewichte).
    Statt das ganze Foto neu zu malen (Full Fine-Tuning),
    klebst du einen kleinen, transparenten Aufkleber drauf (LoRA).
    Der Aufkleber verändert nur wenig, aber gezielt.

    VORTEILE:
    - Extrem wenige trainierbare Parameter (oft <1% des Originals)
    - Originale Gewichte bleiben komplett erhalten
    - Mehrere LoRA-Adapter für verschiedene Aufgaben möglich
    - LoRA-Adapter sind winzig (leicht zu speichern/teilen)

    NACHTEILE:
    - Limitierte Ausdrückbarkeit (niedrigrangige Approximation)
    - Hyperparameter-Tuning nötig (rank, alpha)
    """

    def __init__(self, original_layer: nn.Linear, rank: int = 4, alpha: float = 1.0):
        super().__init__()

        self.original = original_layer
        self.rank = rank
        self.alpha = alpha
        in_features = original_layer.in_features
        out_features = original_layer.out_features

        # Originale Gewichte EINFRIEREN
        for param in self.original.parameters():
            param.requires_grad = False

        # LoRA-Matrizen (die "Aufkleber")
        # A: Runterprojektion in den niedrig-dimensionalen Raum
        self.lora_A = nn.Parameter(torch.randn(rank, in_features) * 0.01)
        # B: Hochprojektion zurück in den originalen Raum
        self.lora_B = nn.Parameter(torch.zeros(out_features, rank))
        # B startet bei 0 -> Am Anfang ist LoRA-Beitrag = 0
        # Das Modell verhält sich also zunächst EXAKT wie das Original!

        # Skalierungsfaktor
        self.scaling = alpha / rank

    def forward(self, x):
        # Original-Berechnung (eingefroren)
        original_out = self.original(x)

        # LoRA-Beitrag: x -> A -> B -> skalieren
        # x:        [batch, seq, in_features]
        # x @ A^T:  [batch, seq, rank]        (Runterprojektion)
        # ... @ B^T:[batch, seq, out_features] (Hochprojektion)
        lora_out = F.linear(F.linear(x, self.lora_A), self.lora_B) * self.scaling

        return original_out + lora_out


def apply_lora(model, rank=4, alpha=1.0):
    """
    Wendet LoRA auf alle Attention-Projektionen im Modell an.

    In der Praxis wird LoRA typischerweise auf Q, K, V und Out-Projektionen
    der Attention-Layer angewendet - das sind die Schichten, wo Fine-Tuning
    den größten Effekt hat.
    """
    lora_layers = []

    for block_idx, block in enumerate(model.blocks):
        attention = block.attention

        # Q, K, V und Output-Projektion mit LoRA wrappen
        attention.q_proj = LoRALinear(attention.q_proj, rank, alpha)
        attention.k_proj = LoRALinear(attention.k_proj, rank, alpha)
        attention.v_proj = LoRALinear(attention.v_proj, rank, alpha)
        attention.out_proj = LoRALinear(attention.out_proj, rank, alpha)

        lora_layers.extend([
            f"block[{block_idx}].attention.q_proj",
            f"block[{block_idx}].attention.k_proj",
            f"block[{block_idx}].attention.v_proj",
            f"block[{block_idx}].attention.out_proj",
        ])

    return lora_layers


def lora_finetuning(base_model, tokenizer, new_data, epochs=50, rank=4, val_data=None):
    """
    LoRA FINE-TUNING - Kleine Adapter statt alle Gewichte ändern
    ==============================================================
    """
    print("\n" + "=" * 70)
    print("ANSATZ 3: LoRA (Low-Rank Adaptation)")
    print("=" * 70)

    model = copy.deepcopy(base_model)

    # Alle Parameter einfrieren
    for param in model.parameters():
        param.requires_grad = False

    # LoRA anwenden
    print(f"\n   LoRA-Konfiguration:")
    print(f"   - Rank: {rank}")
    print(f"   - Alpha: 1.0")
    print(f"   - Angewendet auf: Q, K, V, Out Projektionen\n")

    lora_layers = apply_lora(model, rank=rank, alpha=1.0)

    for layer_name in lora_layers:
        print(f"   + LoRA eingefügt: {layer_name}")

    # Embedding und LM Head auch trainierbar (für neue Wörter)
    for param in model.token_embedding.parameters():
        param.requires_grad = True
    for param in model.lm_head.parameters():
        param.requires_grad = True

    # Parameter-Statistik
    total_params = count_parameters(model)
    trainable = count_parameters(model, only_trainable=True)
    frozen = total_params - trainable

    # LoRA-Parameter separat zählen
    lora_params = sum(
        p.numel() for n, p in model.named_parameters()
        if p.requires_grad and 'lora_' in n
    )

    print(f"\n   Parameter-Übersicht:")
    print(f"   {'Gesamt:':<25} {total_params:>8,}")
    print(f"   {'Eingefroren (Original):':<25} {frozen:>8,} ({frozen/total_params*100:.1f}%)")
    print(f"   {'Trainierbar gesamt:':<25} {trainable:>8,} ({trainable/total_params*100:.1f}%)")
    print(f"   {'  davon LoRA-Params:':<25} {lora_params:>8,}")
    print(f"   {'  davon Embedding/Head:':<25} {trainable - lora_params:>8,}")

    FINETUNE_LR = 0.002  # LoRA verträgt höhere Lernrate

    dataset = TextDataset(new_data, tokenizer, seq_len=4)
    dataloader = DataLoader(dataset, batch_size=4, shuffle=True)

    val_loader = None
    if val_data:
        val_dataset = TextDataset(val_data, tokenizer, seq_len=4)
        if len(val_dataset) > 0:
            val_loader = DataLoader(val_dataset, batch_size=4, shuffle=False)

    losses = train_model(model, dataloader, tokenizer.vocab_size, epochs, FINETUNE_LR, "LoRA",
                         val_dataloader=val_loader)

    return model, losses


# =============================================================================
# VERGLEICH UND VISUALISIERUNG
# =============================================================================

def compare_approaches(results, save_dir):
    """Vergleicht die drei Ansätze visuell."""
    print("\n" + "=" * 70)
    print("VERGLEICH DER ANSÄTZE")
    print("=" * 70)

    # Loss-Kurven vergleichen
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    colors = ['#e74c3c', '#2ecc71', '#3498db']
    labels_map = {
        'full': 'Full Fine-Tuning',
        'frozen': 'Layer Freezing',
        'lora': 'LoRA',
    }

    # Plot 1: Loss-Kurven
    ax = axes[0]
    for (name, data), color in zip(results.items(), colors):
        ax.plot(data['losses'], label=labels_map[name], color=color, linewidth=2)
    ax.set_xlabel('Epoche')
    ax.set_ylabel('Loss')
    ax.set_title('Trainings-Loss Vergleich')
    ax.legend()
    ax.grid(True, alpha=0.3)

    # Plot 2: Parameter-Vergleich (Balkendiagramm)
    ax = axes[1]
    names = list(results.keys())
    trainable_counts = [results[n]['trainable_params'] for n in names]
    total_counts = [results[n]['total_params'] for n in names]
    frozen_counts = [t - tr for t, tr in zip(total_counts, trainable_counts)]

    x = range(len(names))
    bars1 = ax.bar(x, trainable_counts, label='Trainierbar', color='#2ecc71', alpha=0.8)
    bars2 = ax.bar(x, frozen_counts, bottom=trainable_counts, label='Eingefroren', color='#95a5a6', alpha=0.5)
    ax.set_xticks(x)
    ax.set_xticklabels([labels_map[n] for n in names], rotation=15)
    ax.set_ylabel('Anzahl Parameter')
    ax.set_title('Trainierbare vs. Eingefrorene Parameter')
    ax.legend()
    ax.grid(True, alpha=0.3, axis='y')

    # Prozentangaben auf die Balken
    for i, (tr, tot) in enumerate(zip(trainable_counts, total_counts)):
        pct = tr / tot * 100
        ax.text(i, tr / 2, f'{pct:.1f}%', ha='center', va='center', fontweight='bold', fontsize=11)

    plt.tight_layout()
    plt.savefig(save_dir / "finetuning_comparison.png", dpi=150, bbox_inches='tight')
    plt.close()
    print(f"\n   Plot gespeichert: {save_dir / 'finetuning_comparison.png'}")

    # Zusammenfassungstabelle
    print(f"\n   {'Ansatz':<22} {'Trainierbar':>14} {'Final Loss':>12} {'Bewertung'}")
    print("   " + "-" * 70)
    for name, data in results.items():
        pct = data['trainable_params'] / data['total_params'] * 100
        final_loss = data['losses'][-1]
        label = labels_map[name]

        if name == 'full':
            note = "Max. Anpassung, Risiko: Catastrophic Forgetting"
        elif name == 'frozen':
            note = "Guter Kompromiss"
        else:
            note = "Minimale Params, sehr effizient"

        print(f"   {label:<22} {data['trainable_params']:>8,} ({pct:>4.1f}%) {final_loss:>10.4f}   {note}")


# =============================================================================
# CATASTROPHIC FORGETTING DEMO
# =============================================================================

def demonstrate_catastrophic_forgetting(original_model, finetuned_model, tokenizer):
    """
    Zeigt das Problem des "Catastrophic Forgetting".

    CATASTROPHIC FORGETTING:
    ========================
    Wenn ein Modell auf neuen Daten trainiert wird, kann es
    das ALTE Wissen vergessen. Das ist wie ein Mensch, der
    beim Lernen einer neuen Sprache die alte vergisst.

    Wir testen: Kann das fine-getunte Modell noch die alten
    Sätze vervollständigen?
    """
    print("\n" + "=" * 70)
    print("CATASTROPHIC FORGETTING - Vergisst das Modell altes Wissen?")
    print("=" * 70)

    # Prompts aus den ORIGINALEN Trainingsdaten
    old_prompts = ["die katze", "der hund", "das kind"]
    # Prompts aus den NEUEN Fine-Tuning-Daten
    new_prompts = ["der wind", "die suppe", "der kuchen"]

    print("\n   --- Altes Wissen (aus Original-Training) ---")
    print("\n   Original-Modell:")
    evaluate_model(original_model, tokenizer, old_prompts, "Original")
    print("\n   Fine-Tuned Modell:")
    evaluate_model(finetuned_model, tokenizer, old_prompts, "Fine-Tuned")

    print("\n   --- Neues Wissen (aus Fine-Tuning) ---")
    print("\n   Original-Modell:")
    evaluate_model(original_model, tokenizer, new_prompts, "Original")
    print("\n   Fine-Tuned Modell:")
    evaluate_model(finetuned_model, tokenizer, new_prompts, "Fine-Tuned")


# =============================================================================
# HAUPTPROGRAMM
# =============================================================================

def main(epochs=50):
    print("=" * 70)
    print("FINE-TUNING LERNPROJEKT")
    print("Vortrainiertes Transformer-Modell mit neuem Wissen erweitern")
    print("=" * 70)

    # --- Schritt 1: Vortrainiertes Modell laden ---
    print("\n--- SCHRITT 1: Vortrainiertes Modell laden ---")

    script_dir = Path(__file__).parent
    model_dir = script_dir.parent.parent / "dist" / "transformer_model"

    if not (model_dir / "model.pt").exists():
        print("\n   FEHLER: Kein vortrainiertes Modell gefunden!")
        print(f"   Erwartet in: {model_dir}")
        print("   Bitte erst das Transformer-Modell trainieren (Option 2 im Hauptmenü).")
        return

    original_model, tokenizer = load_transformer_model(str(model_dir))
    old_vocab_size = tokenizer.vocab_size
    print(f"   Vokabular: {old_vocab_size} Tokens")
    print(f"   Parameter: {count_parameters(original_model):,}")

    # --- Schritt 2: Vokabular erweitern ---
    print("\n--- SCHRITT 2: Vokabular für neue Daten erweitern ---")

    new_words = expand_tokenizer(tokenizer, FINETUNING_DATA)
    if new_words:
        print(f"   Neue Wörter ({len(new_words)}): {', '.join(new_words)}")
    else:
        print("   Keine neuen Wörter nötig - alle bereits im Vokabular.")

    # --- Schritt 3: Modell-Embeddings erweitern ---
    if tokenizer.vocab_size > old_vocab_size:
        print("\n--- SCHRITT 3: Modell-Embeddings erweitern ---")
        expand_model_embeddings(original_model, old_vocab_size, tokenizer.vocab_size)

    # --- Schritt 4: Alle drei Ansätze ausführen ---
    print("\n--- SCHRITT 4: Fine-Tuning mit 3 verschiedenen Ansätzen ---")

    EPOCHS = epochs

    # Train/Val split for early stopping (shared across all 3 approaches)
    from .training_config import VALIDATION_SPLIT
    val_size = max(1, int(len(FINETUNING_DATA) * VALIDATION_SPLIT))
    if val_size >= len(FINETUNING_DATA):
        # Too few data points for a split
        ft_train_data = FINETUNING_DATA
        ft_val_data = None
    else:
        ft_train_data = FINETUNING_DATA[:-val_size]
        ft_val_data = FINETUNING_DATA[-val_size:]
        print(f"   Daten-Split: {len(ft_train_data)} Training / {len(ft_val_data)} Validation")

    # Test-Prompts (Mix aus alt und neu)
    test_prompts = ["die katze", "der wind", "die suppe", "der hund"]

    results = {}

    # Ansatz 1: Full Fine-Tuning
    model_full, losses_full = full_finetuning(
        original_model, tokenizer, ft_train_data, epochs=EPOCHS, val_data=ft_val_data
    )
    results['full'] = {
        'model': model_full,
        'losses': losses_full,
        'total_params': count_parameters(model_full),
        'trainable_params': count_parameters(model_full),  # Alle trainierbar
    }
    evaluate_model(model_full, tokenizer, test_prompts, "Full FT")

    # Ansatz 2: Layer Freezing
    model_frozen, losses_frozen = layer_freezing(
        original_model, tokenizer, ft_train_data, epochs=EPOCHS, val_data=ft_val_data
    )
    results['frozen'] = {
        'model': model_frozen,
        'losses': losses_frozen,
        'total_params': count_parameters(model_frozen),
        'trainable_params': count_parameters(model_frozen, only_trainable=True),
    }
    evaluate_model(model_frozen, tokenizer, test_prompts, "Frozen")

    # Ansatz 3: LoRA
    model_lora, losses_lora = lora_finetuning(
        original_model, tokenizer, ft_train_data, epochs=EPOCHS, rank=4, val_data=ft_val_data
    )
    results['lora'] = {
        'model': model_lora,
        'losses': losses_lora,
        'total_params': count_parameters(model_lora),
        'trainable_params': count_parameters(model_lora, only_trainable=True),
    }
    evaluate_model(model_lora, tokenizer, test_prompts, "LoRA")

    # --- Schritt 5: Modelle speichern ---
    print("\n--- SCHRITT 5: Fine-Tuned Modelle speichern ---")

    save_dir = model_dir.parent / "finetuning_results"
    save_dir.mkdir(parents=True, exist_ok=True)

    # Gemeinsame Report-Daten
    report_kwargs = dict(
        base_vocab_size=old_vocab_size,
        new_words=new_words,
        training_data=FINETUNING_DATA,
        epochs=EPOCHS,
    )

    # Full Fine-Tuning: Komplettes Modell speichern
    print("\n   [1/4] Full Fine-Tuning Modell:")
    save_finetuned_model(model_full, tokenizer, save_dir, "full_finetuned",
                         losses=losses_full, lr=0.001, **report_kwargs)

    # Layer Freezing: Komplettes Modell speichern
    # Eingefrorene/trainierte Schichten für den Report sammeln
    frozen_layers = [n for n, p in model_frozen.named_parameters() if not p.requires_grad]
    trainable_layers = [n for n, p in model_frozen.named_parameters() if p.requires_grad]
    print("\n   [2/4] Layer Freezing Modell:")
    save_finetuned_model(model_frozen, tokenizer, save_dir, "layer_frozen",
                         losses=losses_frozen, lr=0.001,
                         frozen_layers=frozen_layers,
                         trainable_layers=trainable_layers,
                         **report_kwargs)

    # LoRA: Zwei Varianten!
    LORA_RANK = 4
    LORA_ALPHA = 1.0
    lora_kwargs = dict(rank=LORA_RANK, alpha=LORA_ALPHA, **report_kwargs)

    # Variante A: Nur den Adapter speichern (winzig!)
    print("\n   [3/4] LoRA-Adapter (nur die kleinen Zusatz-Gewichte):")
    save_lora_adapter(model_lora, tokenizer, save_dir,
                      losses=losses_lora, lr=0.002, **lora_kwargs)

    # Variante B: LoRA in Gewichte mergen und als normales Modell speichern
    print("\n   [4/4] LoRA gemerged (LoRA in Originalgewichte eingebacken):")
    lora_for_merge = copy.deepcopy(model_lora)  # Kopie, da merge destruktiv ist
    save_lora_merged(lora_for_merge, tokenizer, save_dir,
                     losses=losses_lora, lr=0.002, **lora_kwargs)

    # --- Schritt 6: Vergleich ---
    compare_approaches(results, save_dir)

    # --- Schritt 7: Catastrophic Forgetting Demo ---
    demonstrate_catastrophic_forgetting(original_model, model_full, tokenizer)

    # --- Zusammenfassung ---
    print("\n" + "=" * 70)
    print("ZUSAMMENFASSUNG")
    print("=" * 70)
    print("""
    Was du gelernt hast:

    1. FULL FINE-TUNING
       - Alle Gewichte weitertrainieren mit kleinerer Lernrate
       - Maximale Anpassungsfähigkeit
       - Risiko: Catastrophic Forgetting (altes Wissen geht verloren)

    2. LAYER FREEZING
       - Untere Schichten einfrieren (allgemeines Wissen schützen)
       - Obere Schichten trainieren (spezifisches Wissen anpassen)
       - Guter Kompromiss zwischen Anpassung und Wissenserhalt

    3. LoRA (Low-Rank Adaptation)
       - Kleine Matrizen A und B an bestehende Gewichte "ankleben"
       - Originalgewichte bleiben KOMPLETT unverändert
       - Extrem parametereffizient (<5% der Parameter trainierbar)
       - In der Praxis DER Standard für LLM Fine-Tuning

    PRAXIS-TIPPS:
    - Kleine Modelle (<1M Params): Full Fine-Tuning ist OK
    - Mittlere Modelle (1M-1B): Layer Freezing oder LoRA
    - Große Modelle (>1B, z.B. LLaMA, GPT): Fast immer LoRA
      (Full Fine-Tuning von LLaMA-70B braucht >140GB GPU RAM!)

    SPEICHERUNG:
    - Full FT / Layer Freezing: Komplettes Modell (wie nach normalem Training)
    - LoRA Adapter: NUR die kleinen LoRA-Matrizen (winzig!)
    - LoRA Merged: LoRA-Gewichte in Original "eingebacken" (normales Modell)

    WEITERE TECHNIKEN (nicht implementiert, aber wissenswert):
    - QLoRA: LoRA + Quantisierung (4-bit) -> Noch weniger Speicher
    - Prefix Tuning: Trainierbare "Prompt-Vektoren" vor dem Input
    - Adapter Layers: Kleine Zwischen-Schichten in den Transformer Block
    - RLHF: Fine-Tuning mit menschlichem Feedback (wie bei ChatGPT)
    """)

    print(f"   Ergebnisse gespeichert in: {save_dir.absolute()}")
    print("=" * 70)

    return results


if __name__ == "__main__":
    results = main()
