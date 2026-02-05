"""
Einfaches Sprachmodell mit PyTorch - Didaktisches Beispiel
============================================================

Dieses Script demonstriert die Grundlagen von Sprachmodellen:
1. Tokenisierung: Text in Zahlen umwandeln
2. Embedding: Zahlen in Vektoren umwandeln
3. Neuronales Netzwerk: Muster lernen
4. Logits: Wahrscheinlichkeiten für das nächste Wort
5. Inferenz: Text generieren

Autor: Lernprojekt
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
import numpy as np
from collections import Counter
import matplotlib.pyplot as plt
import json
import os
from pathlib import Path

from model_report import generate_model_report

# Für reproduzierbare Ergebnisse
torch.manual_seed(42)
np.random.seed(42)


# =============================================================================
# TEIL 1: VOKABULAR UND TOKENISIERUNG
# =============================================================================

class Tokenizer:
    """
    Der Tokenizer wandelt Text in Zahlen um und zurück.

    Beispiel:
        "Hallo Welt" -> [5, 12]  (Encoding)
        [5, 12] -> "Hallo Welt"  (Decoding)
    """

    def __init__(self):
        self.word_to_idx = {}  # Wort -> Zahl
        self.idx_to_word = {}  # Zahl -> Wort
        self.vocab_size = 0

        # Spezielle Tokens
        self.pad_token = "<PAD>"    # Füllzeichen
        self.unk_token = "<UNK>"    # Unbekanntes Wort
        self.bos_token = "<BOS>"    # Begin of Sequence
        self.eos_token = "<EOS>"    # End of Sequence

    def build_vocab(self, texts: list[str], min_freq: int = 1):
        """Erstellt das Vokabular aus einer Liste von Texten."""

        # Alle Wörter zählen
        word_counts = Counter()
        for text in texts:
            words = text.lower().split()
            word_counts.update(words)

        # Spezielle Tokens hinzufügen
        special_tokens = [self.pad_token, self.unk_token, self.bos_token, self.eos_token]
        for idx, token in enumerate(special_tokens):
            self.word_to_idx[token] = idx
            self.idx_to_word[idx] = token

        # Normale Wörter hinzufügen (nur wenn häufig genug)
        idx = len(special_tokens)
        for word, count in word_counts.items():
            if count >= min_freq:
                self.word_to_idx[word] = idx
                self.idx_to_word[idx] = word
                idx += 1

        self.vocab_size = len(self.word_to_idx)
        print(f"📚 Vokabular erstellt: {self.vocab_size} Wörter")

    def encode(self, text: str) -> list[int]:
        """Wandelt Text in eine Liste von Token-IDs um."""
        words = text.lower().split()
        unk_idx = self.word_to_idx[self.unk_token]
        return [self.word_to_idx.get(word, unk_idx) for word in words]

    def decode(self, indices: list[int]) -> str:
        """Wandelt Token-IDs zurück in Text."""
        words = [self.idx_to_word.get(idx, self.unk_token) for idx in indices]
        return " ".join(words)

    def show_vocabulary(self, max_words: int = 20):
        """Zeigt das Vokabular an."""
        print("\n📖 Vokabular (Wort -> Index):")
        print("-" * 30)
        for i, (word, idx) in enumerate(self.word_to_idx.items()):
            if i >= max_words:
                print(f"   ... und {self.vocab_size - max_words} weitere")
                break
            print(f"   '{word}' -> {idx}")

    def save(self, path: str):
        """Speichert den Tokenizer als JSON-Datei."""
        data = {
            "word_to_idx": self.word_to_idx,
            "idx_to_word": {str(k): v for k, v in self.idx_to_word.items()},
            "vocab_size": self.vocab_size,
            "special_tokens": {
                "pad": self.pad_token,
                "unk": self.unk_token,
                "bos": self.bos_token,
                "eos": self.eos_token
            }
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"💾 Tokenizer gespeichert: {path}")

    @classmethod
    def load(cls, path: str) -> "Tokenizer":
        """Lädt einen Tokenizer aus einer JSON-Datei."""
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        tokenizer = cls()
        tokenizer.word_to_idx = data["word_to_idx"]
        tokenizer.idx_to_word = {int(k): v for k, v in data["idx_to_word"].items()}
        tokenizer.vocab_size = data["vocab_size"]
        tokenizer.pad_token = data["special_tokens"]["pad"]
        tokenizer.unk_token = data["special_tokens"]["unk"]
        tokenizer.bos_token = data["special_tokens"]["bos"]
        tokenizer.eos_token = data["special_tokens"]["eos"]

        print(f"📂 Tokenizer geladen: {path} ({tokenizer.vocab_size} Wörter)")
        return tokenizer


# =============================================================================
# TEIL 2: DATASET
# =============================================================================

class TextDataset(Dataset):
    """
    Dataset für das Training.

    Erstellt Eingabe-Ziel-Paare:
    - Eingabe: "Die Katze sitzt"
    - Ziel:    "Katze sitzt auf"

    Das Modell lernt, das nächste Wort vorherzusagen.
    Mit EOS-Token lernt es auch, wann ein Satz zu Ende ist.
    """

    def __init__(self, texts: list[str], tokenizer: Tokenizer, seq_length: int = 5, use_eos: bool = True):
        self.tokenizer = tokenizer
        self.seq_length = seq_length
        self.data = []

        # EOS-Token ID holen
        eos_id = tokenizer.word_to_idx.get(tokenizer.eos_token, None)

        for text in texts:
            tokens = tokenizer.encode(text)

            # EOS-Token am Ende des Satzes hinzufügen
            if use_eos and eos_id is not None:
                tokens.append(eos_id)

            # Sliding Window über den Text
            for i in range(len(tokens) - seq_length):
                input_seq = tokens[i:i + seq_length]
                target_seq = tokens[i + 1:i + seq_length + 1]
                self.data.append((input_seq, target_seq))

        print(f"📊 Dataset erstellt: {len(self.data)} Trainingsbeispiele")
        if use_eos:
            print(f"   (mit EOS-Token am Satzende)")

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        input_seq, target_seq = self.data[idx]
        return torch.tensor(input_seq), torch.tensor(target_seq)


# =============================================================================
# TEIL 3: DAS SPRACHMODELL
# =============================================================================

class SimpleLanguageModel(nn.Module):
    """
    Ein einfaches Sprachmodell mit folgender Architektur:

    1. Embedding Layer: Wandelt Token-IDs in Vektoren um
    2. LSTM Layer: Lernt Sequenzmuster
    3. Linear Layer: Projiziert auf Vokabulargröße

    Die Ausgabe sind LOGITS (unnormalisierte Wahrscheinlichkeiten).
    Softmax(Logits) = Wahrscheinlichkeitsverteilung über alle Wörter
    """

    def __init__(self, vocab_size: int, embedding_dim: int = 64, hidden_dim: int = 128):
        super().__init__()

        self.vocab_size = vocab_size
        self.embedding_dim = embedding_dim
        self.hidden_dim = hidden_dim

        # Embedding: Token-ID -> Vektor
        # Jedes Wort bekommt einen lernbaren Vektor
        self.embedding = nn.Embedding(vocab_size, embedding_dim)

        # LSTM: Lernt zeitliche Abhängigkeiten
        # "Die Katze" -> beeinflusst die Vorhersage von "sitzt"
        self.lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True)

        # Output Layer: Hidden State -> Logits für jedes Wort
        self.fc = nn.Linear(hidden_dim, vocab_size)

        print(f"🧠 Modell erstellt:")
        print(f"   - Embedding: {vocab_size} Wörter -> {embedding_dim}D Vektoren")
        print(f"   - LSTM: {embedding_dim}D -> {hidden_dim}D hidden")
        print(f"   - Output: {hidden_dim}D -> {vocab_size} Logits")

    def forward(self, x):
        """
        Forward Pass durch das Netzwerk.

        Args:
            x: Token-IDs [batch_size, seq_length]

        Returns:
            logits: [batch_size, seq_length, vocab_size]
        """
        # Schritt 1: Embedding
        embedded = self.embedding(x)  # [batch, seq, embedding_dim]

        # Schritt 2: LSTM
        lstm_out, _ = self.lstm(embedded)  # [batch, seq, hidden_dim]

        # Schritt 3: Linear Layer -> Logits
        logits = self.fc(lstm_out)  # [batch, seq, vocab_size]

        return logits

    def get_probabilities(self, logits):
        """Wandelt Logits in Wahrscheinlichkeiten um."""
        return F.softmax(logits, dim=-1)

    def predict_next_word(self, input_ids: torch.Tensor, tokenizer: Tokenizer, top_k: int = 5):
        """
        Sagt das nächste Wort vorher und zeigt die Logits/Wahrscheinlichkeiten.
        """
        self.eval()
        with torch.no_grad():
            # Forward Pass
            logits = self.forward(input_ids.unsqueeze(0))  # [1, seq, vocab_size]

            # Nur das letzte Token interessiert uns
            last_logits = logits[0, -1, :]  # [vocab_size]

            # In Wahrscheinlichkeiten umwandeln
            probs = self.get_probabilities(last_logits)

            # Top-K Vorhersagen
            top_probs, top_indices = torch.topk(probs, top_k)

            return last_logits, probs, top_indices, top_probs


# =============================================================================
# TEIL 4: TRAINING
# =============================================================================

def train_model(model, dataloader, epochs: int = 50, lr: float = 0.01):
    """
    Trainiert das Modell.

    Verlustfunktion: Cross-Entropy Loss
    - Vergleicht vorhergesagte Wahrscheinlichkeiten mit dem echten nächsten Wort
    - Niedriger Loss = bessere Vorhersagen
    """

    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.CrossEntropyLoss()

    losses = []

    print(f"\n🏋️ Training gestartet ({epochs} Epochen)")
    print("=" * 50)

    for epoch in range(epochs):
        model.train()
        epoch_loss = 0

        for input_batch, target_batch in dataloader:
            # Forward Pass
            logits = model(input_batch)  # [batch, seq, vocab_size]

            # Loss berechnen
            # Reshape für CrossEntropyLoss: [batch*seq, vocab_size] vs [batch*seq]
            loss = criterion(
                logits.view(-1, model.vocab_size),
                target_batch.view(-1)
            )

            # Backward Pass
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            epoch_loss += loss.item()

        avg_loss = epoch_loss / len(dataloader)
        losses.append(avg_loss)

        if (epoch + 1) % 10 == 0:
            print(f"   Epoche {epoch+1:3d}/{epochs} | Loss: {avg_loss:.4f}")

    print("=" * 50)
    print(f"✅ Training abgeschlossen! Finaler Loss: {losses[-1]:.4f}")

    return losses


def save_model(model, tokenizer, save_dir: str = "models"):
    """
    Speichert das trainierte Modell und den Tokenizer.

    Erzeugt:
    - model.pt: PyTorch Modell-Weights
    - config.json: Modell-Konfiguration
    - tokenizer.json: Vokabular
    - MODEL_REPORT.md: Detaillierter Modell-Report
    """
    save_path = Path(save_dir)
    save_path.mkdir(parents=True, exist_ok=True)

    # Modell-Konfiguration
    config = {
        "vocab_size": model.vocab_size,
        "embedding_dim": model.embedding_dim,
        "hidden_dim": model.hidden_dim,
        "model_type": "SimpleLanguageModel"
    }

    # Config speichern
    config_path = save_path / "config.json"
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)
    print(f"💾 Config gespeichert: {config_path}")

    # Modell-Weights speichern
    model_path = save_path / "model.pt"
    torch.save(model.state_dict(), model_path)
    print(f"💾 Modell gespeichert: {model_path}")

    # Tokenizer speichern
    tokenizer_path = save_path / "tokenizer.json"
    tokenizer.save(str(tokenizer_path))

    # Modell-Report generieren
    generate_model_report(model, save_path)

    print(f"\n✅ Modell vollständig gespeichert in: {save_path.absolute()}")
    print(f"   Dateien: config.json, model.pt, tokenizer.json, MODEL_REPORT.md")

    return str(save_path)


def load_model(load_dir: str = "models"):
    """
    Lädt ein gespeichertes Modell und Tokenizer.

    Returns:
        model: Das geladene Modell (im eval-Modus)
        tokenizer: Der geladene Tokenizer
    """
    load_path = Path(load_dir)

    # Config laden
    config_path = load_path / "config.json"
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)
    print(f"📂 Config geladen: {config_path}")

    # Modell erstellen (mit gleicher Architektur)
    model = SimpleLanguageModel(
        vocab_size=config["vocab_size"],
        embedding_dim=config["embedding_dim"],
        hidden_dim=config["hidden_dim"]
    )

    # Weights laden
    model_path = load_path / "model.pt"
    model.load_state_dict(torch.load(model_path, weights_only=True))
    model.eval()
    print(f"📂 Modell geladen: {model_path}")

    # Tokenizer laden
    tokenizer_path = load_path / "tokenizer.json"
    tokenizer = Tokenizer.load(str(tokenizer_path))

    print(f"\n✅ Modell bereit für Inferenz!")

    return model, tokenizer


# =============================================================================
# TEIL 5: INFERENZ MIT LOGITS-VISUALISIERUNG
# =============================================================================

def visualize_logits(logits: torch.Tensor, probs: torch.Tensor,
                     tokenizer: Tokenizer, input_text: str, top_k_display: int = 10,
                     top_k_sampling: int = 5, top_p_sampling: float = 0.9):
    """
    Visualisiert die Logits und Wahrscheinlichkeiten für die nächste Wort-Vorhersage.

    Dies zeigt den "Entscheidungsbaum" des Modells:
    - Welche Wörter sind wahrscheinlich?
    - Wie sicher ist das Modell?
    - Welche Wörter würden bei Top-K/Top-P Sampling gewählt werden?

    Args:
        logits: Rohe Logits vom Modell
        probs: Wahrscheinlichkeiten (nach Softmax)
        tokenizer: Tokenizer für Wort-Dekodierung
        input_text: Eingabetext (für Anzeige)
        top_k_display: Wie viele Wörter anzeigen
        top_k_sampling: Top-K Sampling Parameter (z.B. 5 = nur Top 5 wählbar)
        top_p_sampling: Top-P/Nucleus Sampling Parameter (z.B. 0.9 = 90% kumulative Wahrsch.)
    """

    print(f"\n🔍 LOGITS-ANALYSE für: '{input_text}'")
    print("=" * 90)

    # Top-K Wörter nach Wahrscheinlichkeit
    top_probs, top_indices = torch.topk(probs, top_k_display)

    # Kumulative Wahrscheinlichkeit berechnen
    cumulative_probs = torch.cumsum(top_probs, dim=0)

    print(f"\n📊 Top {top_k_display} Vorhersagen (Top-K={top_k_sampling}, Top-P={top_p_sampling}):")
    print("-" * 90)
    print(f"{'Rang':<5} {'Wort':<12} {'Logit':>8} {'Wahrsch.':>10} {'Kumulativ':>10} {'Top-K':>6} {'Top-P':>6}  {'':}")
    print("-" * 90)

    for i, (idx, prob, cum_prob) in enumerate(zip(top_indices, top_probs, cumulative_probs)):
        word = tokenizer.idx_to_word[idx.item()]
        logit_value = logits[idx].item()
        prob_percent = prob.item() * 100
        cum_percent = cum_prob.item() * 100

        # Top-K Check: Ist dieses Wort in den Top-K?
        in_top_k = "✓" if (i + 1) <= top_k_sampling else "✗"

        # Top-P Check: Ist kumulative Wahrscheinlichkeit noch unter Schwelle?
        # (Wort ist dabei, wenn vorherige kumulative Prob < top_p ODER es das erste ist)
        prev_cum = cumulative_probs[i-1].item() if i > 0 else 0.0
        in_top_p = "✓" if prev_cum < top_p_sampling else "✗"

        # Balken (proportional zur Wahrscheinlichkeit)
        bar = "█" * int(prob_percent / 2)

        print(f"{i+1:<5} {word:<12} {logit_value:>8.2f} {prob_percent:>9.2f}% {cum_percent:>9.2f}% {in_top_k:>6} {in_top_p:>6}  {bar}")

    print("-" * 90)

    # Statistiken
    print(f"\n📈 Statistiken:")
    print(f"   - Summe aller Wahrscheinlichkeiten: {probs.sum().item():.4f} (sollte ≈1.0 sein)")
    print(f"   - Höchster Logit: {logits.max().item():.2f}")
    print(f"   - Niedrigster Logit: {logits.min().item():.2f}")
    print(f"   - Entropie: {-(probs * torch.log(probs + 1e-10)).sum().item():.2f}")
    print(f"     (Niedrige Entropie = Modell ist sich sicher)")

    # Sampling-Erklärung
    top_k_count = min(top_k_sampling, top_k_display)
    top_p_count = sum(1 for i, cp in enumerate(cumulative_probs) if (cumulative_probs[i-1].item() if i > 0 else 0) < top_p_sampling)

    print(f"\n🎲 Sampling-Info:")
    print(f"   - Top-K={top_k_sampling}: {top_k_count} Wörter wählbar")
    print(f"   - Top-P={top_p_sampling}: {top_p_count} Wörter wählbar (bis {top_p_sampling*100:.0f}% kumulativ)")

    return top_indices, top_probs


def generate_text(model, tokenizer: Tokenizer, start_text: str,
                  max_length: int = 20, temperature: float = 1.0,
                  show_logits: bool = True):
    """
    Generiert Text mit dem trainierten Modell.

    Args:
        temperature: Steuert die "Kreativität"
            - temperature < 1: Konservativer (wählt wahrscheinlichere Wörter)
            - temperature > 1: Kreativer (mehr Zufall)
    """

    print(f"\n✨ TEXT-GENERIERUNG")
    print(f"   Start: '{start_text}'")
    print(f"   Temperature: {temperature}")
    print("=" * 60)

    model.eval()

    # Start-Tokens
    tokens = tokenizer.encode(start_text)
    generated = tokens.copy()

    for step in range(max_length):
        # Letzte Tokens als Input
        input_tensor = torch.tensor(tokens[-5:] if len(tokens) > 5 else tokens)

        with torch.no_grad():
            logits, probs, top_indices, top_probs = model.predict_next_word(
                input_tensor, tokenizer
            )

        # Temperature anwenden
        scaled_logits = logits / temperature
        scaled_probs = F.softmax(scaled_logits, dim=-1)

        # Nächstes Wort samplen
        next_token = torch.multinomial(scaled_probs, 1).item()

        # Zum generierten Text hinzufügen
        generated.append(next_token)
        tokens.append(next_token)

        # Optional: Logits zeigen
        if show_logits and step < 3:
            visualize_logits(logits, probs, tokenizer,
                           tokenizer.decode(tokens[-5:]), top_k_display=5)

        # Abbrechen bei EOS
        if next_token == tokenizer.word_to_idx.get(tokenizer.eos_token):
            break

    generated_text = tokenizer.decode(generated)
    print(f"\n🎯 Generierter Text: '{generated_text}'")

    return generated_text


# =============================================================================
# TEIL 6: HAUPTPROGRAMM
# =============================================================================

def main():
    print("=" * 60)
    print("🎓 SPRACHMODELL-TRAINING - Didaktisches Beispiel")
    print("=" * 60)

    # Beispiel-Trainingsdaten (einfache deutsche Sätze)
    training_texts = [
        "die katze sitzt auf dem tisch",
        "der hund läuft im garten",
        "die katze schläft auf dem sofa",
        "der hund spielt im park",
        "die sonne scheint am himmel",
        "der vogel fliegt über den baum",
        "die katze jagt die maus",
        "der hund frisst seinen knochen",
        "das kind spielt im garten",
        "die blume blüht im frühling",
        "der regen fällt vom himmel",
        "die katze trinkt ihre milch",
        "der hund wedelt mit dem schwanz",
        "das buch liegt auf dem tisch",
        "die tasse steht neben dem teller",
        "der mann liest die zeitung",
        "die frau kocht das essen",
        "das auto fährt auf der straße",
        "der zug kommt am bahnhof an",
        "die kinder spielen auf dem spielplatz",
    ]

    # 1. Tokenizer erstellen
    print("\n" + "=" * 60)
    print("SCHRITT 1: TOKENISIERUNG")
    print("=" * 60)

    tokenizer = Tokenizer()
    tokenizer.build_vocab(training_texts)
    tokenizer.show_vocabulary()

    # Beispiel: Encoding/Decoding demonstrieren
    test_sentence = "die katze sitzt"
    encoded = tokenizer.encode(test_sentence)
    decoded = tokenizer.decode(encoded)
    print(f"\n🔄 Encoding-Beispiel:")
    print(f"   Original:  '{test_sentence}'")
    print(f"   Encoded:   {encoded}")
    print(f"   Decoded:   '{decoded}'")

    # 2. Dataset erstellen
    print("\n" + "=" * 60)
    print("SCHRITT 2: DATASET ERSTELLEN")
    print("=" * 60)

    dataset = TextDataset(training_texts, tokenizer, seq_length=4)
    dataloader = DataLoader(dataset, batch_size=4, shuffle=True)

    # Beispiel zeigen
    sample_input, sample_target = dataset[0]
    print(f"\n📋 Beispiel aus dem Dataset:")
    print(f"   Input:  {sample_input.tolist()} -> '{tokenizer.decode(sample_input.tolist())}'")
    print(f"   Target: {sample_target.tolist()} -> '{tokenizer.decode(sample_target.tolist())}'")
    print(f"   (Das Modell lernt: Nach '{tokenizer.decode(sample_input.tolist())}' kommt '{tokenizer.idx_to_word[sample_target[-1].item()]}')")

    # 3. Modell erstellen
    print("\n" + "=" * 60)
    print("SCHRITT 3: MODELL ERSTELLEN")
    print("=" * 60)

    model = SimpleLanguageModel(
        vocab_size=tokenizer.vocab_size,
        embedding_dim=32,
        hidden_dim=64
    )

    # Parameter zählen
    total_params = sum(p.numel() for p in model.parameters())
    print(f"   - Gesamte Parameter: {total_params:,}")

    # 4. Training
    print("\n" + "=" * 60)
    print("SCHRITT 4: TRAINING")
    print("=" * 60)

    losses = train_model(model, dataloader, epochs=100, lr=0.01)

    # 5. Inferenz mit Logits-Visualisierung
    print("\n" + "=" * 60)
    print("SCHRITT 5: INFERENZ & LOGITS-ANALYSE")
    print("=" * 60)

    # Test-Eingaben
    test_inputs = [
        "die katze",
        "der hund",
        "die sonne",
    ]

    for test_input in test_inputs:
        input_ids = torch.tensor(tokenizer.encode(test_input))
        logits, probs, top_indices, top_probs = model.predict_next_word(
            input_ids, tokenizer
        )
        visualize_logits(logits, probs, tokenizer, test_input, top_k_display=8)

    # 6. Text generieren
    print("\n" + "=" * 60)
    print("SCHRITT 6: TEXT-GENERIERUNG")
    print("=" * 60)

    # Mit verschiedenen Temperaturen
    for temp in [0.5, 1.0, 1.5]:
        generate_text(model, tokenizer, "die katze",
                     max_length=6, temperature=temp, show_logits=False)

    # Detaillierte Generierung mit Logits
    generate_text(model, tokenizer, "der hund",
                 max_length=5, temperature=1.0, show_logits=True)

    # 7. Loss-Kurve plotten (optional)
    print("\n" + "=" * 60)
    print("SCHRITT 7: TRAINING-VERLAUF")
    print("=" * 60)

    try:
        plt.figure(figsize=(10, 4))
        plt.plot(losses)
        plt.xlabel("Epoche")
        plt.ylabel("Loss")
        plt.title("Training Loss über Zeit")
        plt.grid(True)
        plt.savefig("training_loss.png")
        print("📈 Loss-Kurve gespeichert als 'training_loss.png'")
    except Exception as e:
        print(f"⚠️ Konnte Plot nicht erstellen: {e}")

    # 8. Modell speichern
    print("\n" + "=" * 60)
    print("SCHRITT 8: MODELL SPEICHERN")
    print("=" * 60)

    # Speicherort im gleichen Verzeichnis wie das Script
    script_dir = Path(__file__).parent
    model_dir = script_dir / "models" / "lstm_model"
    save_model(model, tokenizer, str(model_dir))

    print("\n" + "=" * 60)
    print("✅ DEMO ABGESCHLOSSEN!")
    print("=" * 60)
    print(f"""
    Was du gelernt hast:

    1. TOKENISIERUNG: Text wird in Zahlen umgewandelt
       "die katze" -> [4, 5]

    2. EMBEDDING: Zahlen werden zu Vektoren
       [4, 5] -> [[0.1, 0.3, ...], [0.2, 0.5, ...]]

    3. LSTM: Lernt Sequenzmuster
       "die katze" beeinflusst die Vorhersage

    4. LOGITS: Unnormalisierte Scores für jedes Wort
       Höhere Logits = wahrscheinlicheres Wort

    5. SOFTMAX: Wandelt Logits in Wahrscheinlichkeiten
       Summe aller Wahrscheinlichkeiten = 1.0

    6. SAMPLING: Wählt das nächste Wort
       Temperature steuert die "Kreativität"

    📁 Gespeichertes Modell: {model_dir}
       - model.pt (Weights)
       - config.json (Architektur)
       - tokenizer.json (Vokabular)

    🚀 Inferenz starten mit:
       python inference.py
    """)

    return model, tokenizer


if __name__ == "__main__":
    model, tokenizer = main()
