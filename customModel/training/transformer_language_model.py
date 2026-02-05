"""
Transformer-basiertes Sprachmodell - Fortgeschrittenes Beispiel
================================================================

Dieses Script zeigt die Architektur moderner Sprachmodelle wie GPT:
- Self-Attention Mechanismus
- Positional Encoding
- Multi-Head Attention
- Visualisierung der Attention Weights

Autor: Lernprojekt
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
import numpy as np
import math
import json
import matplotlib.pyplot as plt
from pathlib import Path

torch.manual_seed(42)


# =============================================================================
# TEIL 1: POSITIONAL ENCODING
# =============================================================================

class PositionalEncoding(nn.Module):
    """
    Positional Encoding - Gibt dem Modell Positionsinformation.

    Da Transformer keine eingebaute Sequenz-Ordnung haben (im Gegensatz zu LSTM),
    müssen wir die Position jedes Tokens explizit kodieren.

    Verwendet Sinus/Cosinus-Funktionen verschiedener Frequenzen.
    """

    def __init__(self, d_model: int, max_len: int = 100):
        super().__init__()

        # Matrix für alle Positionen vorab berechnen
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len).unsqueeze(1).float()
        div_term = torch.exp(
            torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model)
        )

        pe[:, 0::2] = torch.sin(position * div_term)  # Gerade Indizes: Sinus
        pe[:, 1::2] = torch.cos(position * div_term)  # Ungerade Indizes: Cosinus

        # Als Buffer registrieren (nicht trainierbar)
        self.register_buffer('pe', pe.unsqueeze(0))

    def forward(self, x):
        """Addiert Positional Encoding zu den Embeddings."""
        return x + self.pe[:, :x.size(1)]


# =============================================================================
# TEIL 2: ATTENTION MECHANISMUS (Das Herzstück!)
# =============================================================================

class SelfAttention(nn.Module):
    """
    Self-Attention - Der Kern von Transformer-Modellen.

    Attention beantwortet: "Welche anderen Wörter sind relevant für dieses Wort?"

    Beispiel:
        "Die Katze, die auf dem Sofa schläft, ist müde"
        Für "ist": Attention fokussiert auf "Katze" (das Subjekt)

    Formel: Attention(Q, K, V) = softmax(QK^T / √d_k) * V
    """

    def __init__(self, embed_dim: int, num_heads: int = 4):
        super().__init__()

        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads

        assert embed_dim % num_heads == 0, "embed_dim muss durch num_heads teilbar sein"

        # Lineare Projektionen für Q, K, V
        self.q_proj = nn.Linear(embed_dim, embed_dim)  # Query: "Was suche ich?"
        self.k_proj = nn.Linear(embed_dim, embed_dim)  # Key: "Was biete ich?"
        self.v_proj = nn.Linear(embed_dim, embed_dim)  # Value: "Welche Information habe ich?"
        self.out_proj = nn.Linear(embed_dim, embed_dim)

        # Speichert Attention Weights für Visualisierung
        self.attention_weights = None

    def forward(self, x, mask=None):
        """
        Args:
            x: [batch_size, seq_len, embed_dim]
            mask: Optional, verhindert Attention auf zukünftige Tokens

        Returns:
            output: [batch_size, seq_len, embed_dim]
        """
        batch_size, seq_len, _ = x.shape

        # Query, Key, Value berechnen
        Q = self.q_proj(x)  # [batch, seq, embed]
        K = self.k_proj(x)
        V = self.v_proj(x)

        # Reshape für Multi-Head Attention
        # [batch, seq, embed] -> [batch, heads, seq, head_dim]
        Q = Q.view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)
        K = K.view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)
        V = V.view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)

        # Attention Scores berechnen: QK^T / √d_k
        # [batch, heads, seq, head_dim] @ [batch, heads, head_dim, seq]
        # -> [batch, heads, seq, seq]
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.head_dim)

        # Causal Mask anwenden (für autoregressive Generierung)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, float('-inf'))

        # Softmax -> Attention Weights
        attention_weights = F.softmax(scores, dim=-1)
        self.attention_weights = attention_weights.detach()  # Für Visualisierung speichern

        # Attention auf Values anwenden
        # [batch, heads, seq, seq] @ [batch, heads, seq, head_dim]
        # -> [batch, heads, seq, head_dim]
        attended = torch.matmul(attention_weights, V)

        # Heads wieder zusammenführen
        # [batch, heads, seq, head_dim] -> [batch, seq, embed]
        attended = attended.transpose(1, 2).contiguous().view(batch_size, seq_len, self.embed_dim)

        # Finale Projektion
        output = self.out_proj(attended)

        return output


# =============================================================================
# TEIL 3: TRANSFORMER BLOCK
# =============================================================================

class TransformerBlock(nn.Module):
    """
    Ein Transformer-Block besteht aus:
    1. Self-Attention + Residual Connection + LayerNorm
    2. Feed-Forward Network + Residual Connection + LayerNorm
    """

    def __init__(self, embed_dim: int, num_heads: int = 4, ff_dim: int = 256, dropout: float = 0.1):
        super().__init__()

        self.attention = SelfAttention(embed_dim, num_heads)
        self.norm1 = nn.LayerNorm(embed_dim)
        self.norm2 = nn.LayerNorm(embed_dim)

        # Feed-Forward Network
        self.ff = nn.Sequential(
            nn.Linear(embed_dim, ff_dim),
            nn.GELU(),  # Aktivierungsfunktion (wie GPT)
            nn.Linear(ff_dim, embed_dim),
            nn.Dropout(dropout)
        )

        self.dropout = nn.Dropout(dropout)

    def forward(self, x, mask=None):
        # Self-Attention + Residual
        attended = self.attention(x, mask)
        x = self.norm1(x + self.dropout(attended))

        # Feed-Forward + Residual
        ff_out = self.ff(x)
        x = self.norm2(x + ff_out)

        return x


# =============================================================================
# TEIL 4: GPT-ARTIGES SPRACHMODELL
# =============================================================================

class MiniGPT(nn.Module):
    """
    Ein vereinfachtes GPT-Modell.

    Architektur:
    1. Token Embedding + Positional Encoding
    2. N x Transformer Blocks
    3. Output Layer -> Logits

    Dieses Modell ist "autoregressive": Es generiert ein Token nach dem anderen,
    wobei jedes neue Token nur von vorherigen Tokens abhängt.
    """

    def __init__(self, vocab_size: int, embed_dim: int = 64,
                 num_heads: int = 4, num_layers: int = 2, max_len: int = 50):
        super().__init__()

        self.vocab_size = vocab_size
        self.embed_dim = embed_dim

        # Embeddings
        self.token_embedding = nn.Embedding(vocab_size, embed_dim)
        self.pos_encoding = PositionalEncoding(embed_dim, max_len)

        # Transformer Blocks
        self.blocks = nn.ModuleList([
            TransformerBlock(embed_dim, num_heads)
            for _ in range(num_layers)
        ])

        # Output Layer
        self.ln_final = nn.LayerNorm(embed_dim)
        self.lm_head = nn.Linear(embed_dim, vocab_size, bias=False)

        # Causal Mask (verhindert "in die Zukunft schauen")
        self.register_buffer(
            "causal_mask",
            torch.tril(torch.ones(max_len, max_len)).unsqueeze(0).unsqueeze(0)
        )

        print(f"🤖 MiniGPT erstellt:")
        print(f"   - Vokabular: {vocab_size} Tokens")
        print(f"   - Embedding: {embed_dim}D")
        print(f"   - Attention Heads: {num_heads}")
        print(f"   - Transformer Layers: {num_layers}")

    def forward(self, x):
        """
        Forward Pass.

        Args:
            x: Token IDs [batch_size, seq_len]

        Returns:
            logits: [batch_size, seq_len, vocab_size]
        """
        batch_size, seq_len = x.shape

        # Token Embedding + Positional Encoding
        x = self.token_embedding(x)
        x = self.pos_encoding(x)

        # Causal Mask für diese Sequenzlänge
        mask = self.causal_mask[:, :, :seq_len, :seq_len]

        # Durch alle Transformer Blocks
        for block in self.blocks:
            x = block(x, mask)

        # Finale Normalisierung und Projektion auf Vokabular
        x = self.ln_final(x)
        logits = self.lm_head(x)

        return logits

    def get_attention_weights(self):
        """Gibt die Attention Weights aller Layers zurück."""
        return [block.attention.attention_weights for block in self.blocks]


# =============================================================================
# TEIL 5: ATTENTION VISUALISIERUNG
# =============================================================================

def visualize_attention(model, tokenizer, text: str):
    """
    Visualisiert, worauf das Modell "achtet" bei der Verarbeitung.
    """
    tokens = tokenizer.encode(text)
    input_tensor = torch.tensor(tokens).unsqueeze(0)

    # Forward Pass
    with torch.no_grad():
        _ = model(input_tensor)

    # Attention Weights holen
    attention_weights = model.get_attention_weights()

    print(f"\n🔎 ATTENTION-ANALYSE für: '{text}'")
    print("=" * 60)

    words = text.lower().split()

    for layer_idx, layer_weights in enumerate(attention_weights):
        print(f"\n📊 Layer {layer_idx + 1} Attention Weights:")

        # Mittelwert über alle Heads
        avg_weights = layer_weights[0].mean(dim=0)  # [seq, seq]

        # Tabelle drucken
        print(f"\n{'':>12}", end="")
        for w in words:
            print(f"{w[:8]:>10}", end="")
        print()

        for i, src_word in enumerate(words):
            print(f"{src_word[:10]:>12}", end="")
            for j in range(len(words)):
                weight = avg_weights[i, j].item()
                if weight > 0.1:
                    print(f"{weight:>10.2f}", end="")
                else:
                    print(f"{'·':>10}", end="")
            print()

        # Versuche zu plotten
        try:
            fig, ax = plt.subplots(figsize=(8, 6))
            im = ax.imshow(avg_weights.numpy(), cmap='Blues')
            ax.set_xticks(range(len(words)))
            ax.set_yticks(range(len(words)))
            ax.set_xticklabels(words, rotation=45, ha='right')
            ax.set_yticklabels(words)
            ax.set_xlabel("Key (worauf wird geachtet)")
            ax.set_ylabel("Query (wer schaut)")
            ax.set_title(f"Attention Weights - Layer {layer_idx + 1}")
            plt.colorbar(im)
            plt.tight_layout()
            plt.savefig(f"attention_layer_{layer_idx + 1}.png")
            print(f"   💾 Gespeichert: attention_layer_{layer_idx + 1}.png")
        except Exception as e:
            print(f"   ⚠️ Plot nicht möglich: {e}")


# =============================================================================
# TEIL 6: LOGITS IM DETAIL
# =============================================================================

def analyze_logits_detailed(model, tokenizer, text: str, top_k: int = 10):
    """
    Detaillierte Analyse der Logits und wie sie entstehen.
    """
    tokens = tokenizer.encode(text)
    input_tensor = torch.tensor(tokens).unsqueeze(0)

    print(f"\n🔬 DETAILLIERTE LOGITS-ANALYSE")
    print(f"   Input: '{text}'")
    print("=" * 70)

    with torch.no_grad():
        # Schritt für Schritt durch das Modell
        x = model.token_embedding(input_tensor)
        print(f"\n1️⃣ Nach Embedding:")
        print(f"   Shape: {x.shape}")
        print(f"   Wertebereich: [{x.min():.3f}, {x.max():.3f}]")

        x = model.pos_encoding(x)
        print(f"\n2️⃣ Nach Positional Encoding:")
        print(f"   Shape: {x.shape}")

        # Durch Transformer Blocks
        seq_len = input_tensor.shape[1]
        mask = model.causal_mask[:, :, :seq_len, :seq_len]

        for i, block in enumerate(model.blocks):
            x = block(x, mask)
            print(f"\n3️⃣.{i+1} Nach Transformer Block {i+1}:")
            print(f"   Shape: {x.shape}")
            print(f"   Wertebereich: [{x.min():.3f}, {x.max():.3f}]")

        x = model.ln_final(x)
        print(f"\n4️⃣ Nach Layer Norm:")
        print(f"   Shape: {x.shape}")

        logits = model.lm_head(x)
        print(f"\n5️⃣ LOGITS (finale Ausgabe):")
        print(f"   Shape: {logits.shape}")
        print(f"   = [batch_size, seq_len, vocab_size]")

        # Letzte Position analysieren (Vorhersage für nächstes Wort)
        last_logits = logits[0, -1, :]  # [vocab_size]

        print(f"\n📊 Logits für Position {len(tokens)} (nächstes Wort nach '{text.split()[-1]}'):")
        print(f"   Anzahl Logits: {last_logits.shape[0]} (einer pro Wort im Vokabular)")
        print(f"   Min: {last_logits.min():.3f}")
        print(f"   Max: {last_logits.max():.3f}")
        print(f"   Mean: {last_logits.mean():.3f}")
        print(f"   Std: {last_logits.std():.3f}")

        # Softmax anwenden
        probs = F.softmax(last_logits, dim=-1)

        print(f"\n📈 Nach Softmax (Wahrscheinlichkeiten):")
        print(f"   Summe: {probs.sum():.6f} (sollte 1.0 sein)")

        # Top-K
        top_probs, top_indices = torch.topk(probs, top_k)
        top_logits = last_logits[top_indices]

        print(f"\n🏆 Top {top_k} Vorhersagen:")
        print("-" * 70)
        print(f"{'Rang':<6} {'Wort':<15} {'Logit':<12} {'exp(Logit)':<15} {'Wahrsch.':<12}")
        print("-" * 70)

        for i, (idx, prob, logit) in enumerate(zip(top_indices, top_probs, top_logits)):
            word = tokenizer.idx_to_word.get(idx.item(), "<UNK>")
            exp_logit = torch.exp(logit).item()
            print(f"{i+1:<6} {word:<15} {logit.item():>8.3f}    {exp_logit:>12.3f}    {prob.item()*100:>8.2f}%")

        print("-" * 70)

        # Erklärung
        print(f"""
    💡 ERKLÄRUNG:

    1. LOGITS sind die rohen Ausgaben des Modells (vor Softmax)
       - Können beliebige reelle Zahlen sein (-∞ bis +∞)
       - Höhere Werte = wahrscheinlicheres Wort

    2. SOFTMAX transformiert Logits zu Wahrscheinlichkeiten:
       P(Wort_i) = exp(Logit_i) / Σ exp(Logit_j)

       Beispiel:
       - Logit für "{tokenizer.idx_to_word.get(top_indices[0].item(), '?')}": {top_logits[0].item():.3f}
       - exp({top_logits[0].item():.3f}) = {torch.exp(top_logits[0]).item():.3f}
       - Dividiert durch Summe aller exp(Logits) = {top_probs[0].item()*100:.2f}%

    3. Der ENTSCHEIDUNGSBAUM:
       - Das Modell berechnet für JEDES Wort einen Score (Logit)
       - Softmax normalisiert diese zu einer Wahrscheinlichkeitsverteilung
       - Beim Sampling wird ein Wort gemäß dieser Verteilung gewählt
        """)


# =============================================================================
# TEIL 7: HAUPTPROGRAMM
# =============================================================================

# Einfacher Tokenizer (wiederverwendet von simple_language_model.py)
class SimpleTokenizer:
    def __init__(self):
        self.word_to_idx = {}
        self.idx_to_word = {}
        self.vocab_size = 0

    def build_vocab(self, texts):
        words = set()
        for text in texts:
            words.update(text.lower().split())

        special = ["<PAD>", "<UNK>", "<BOS>", "<EOS>"]
        for i, tok in enumerate(special):
            self.word_to_idx[tok] = i
            self.idx_to_word[i] = tok

        for i, word in enumerate(sorted(words), start=len(special)):
            self.word_to_idx[word] = i
            self.idx_to_word[i] = word

        self.vocab_size = len(self.word_to_idx)

    def encode(self, text):
        return [self.word_to_idx.get(w, 1) for w in text.lower().split()]

    def decode(self, ids):
        return " ".join([self.idx_to_word.get(i, "<UNK>") for i in ids])

    def save(self, path: str):
        """Speichert den Tokenizer als JSON."""
        data = {
            "word_to_idx": self.word_to_idx,
            "idx_to_word": {str(k): v for k, v in self.idx_to_word.items()},
            "vocab_size": self.vocab_size
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    @classmethod
    def load(cls, path: str) -> "SimpleTokenizer":
        """Lädt einen Tokenizer aus JSON."""
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        tokenizer = cls()
        tokenizer.word_to_idx = data["word_to_idx"]
        tokenizer.idx_to_word = {int(k): v for k, v in data["idx_to_word"].items()}
        tokenizer.vocab_size = data["vocab_size"]
        return tokenizer


def save_transformer_model(model, tokenizer, save_dir: str = "models/transformer_model"):
    """Speichert das Transformer-Modell."""
    save_path = Path(save_dir)
    save_path.mkdir(parents=True, exist_ok=True)

    # Config
    config = {
        "model_type": "MiniGPT",
        "vocab_size": model.vocab_size,
        "embed_dim": model.embed_dim,
        "num_heads": len(model.blocks[0].attention.q_proj.weight) // model.embed_dim if model.blocks else 4,
        "num_layers": len(model.blocks),
        "max_len": 50
    }

    with open(save_path / "config.json", "w") as f:
        json.dump(config, f, indent=2)
    print(f"💾 Config gespeichert: {save_path / 'config.json'}")

    # Modell
    torch.save(model.state_dict(), save_path / "model.pt")
    print(f"💾 Modell gespeichert: {save_path / 'model.pt'}")

    # Tokenizer
    tokenizer.save(str(save_path / "tokenizer.json"))
    print(f"💾 Tokenizer gespeichert: {save_path / 'tokenizer.json'}")

    print(f"\n✅ Transformer-Modell gespeichert in: {save_path.absolute()}")
    return str(save_path)


def load_transformer_model(load_dir: str = "models/transformer_model"):
    """Lädt ein gespeichertes Transformer-Modell."""
    load_path = Path(load_dir)

    # Config laden
    with open(load_path / "config.json", "r") as f:
        config = json.load(f)

    # Modell erstellen
    model = MiniGPT(
        vocab_size=config["vocab_size"],
        embed_dim=config["embed_dim"],
        num_heads=config.get("num_heads", 4),
        num_layers=config.get("num_layers", 2),
        max_len=config.get("max_len", 50)
    )

    # Weights laden
    model.load_state_dict(torch.load(load_path / "model.pt", weights_only=True))
    model.eval()

    # Tokenizer laden
    tokenizer = SimpleTokenizer.load(str(load_path / "tokenizer.json"))

    print(f"✅ Transformer-Modell geladen aus: {load_path}")
    return model, tokenizer


class TextDataset(Dataset):
    def __init__(self, texts, tokenizer, seq_len=5):
        self.data = []
        for text in texts:
            tokens = tokenizer.encode(text)
            for i in range(len(tokens) - seq_len):
                self.data.append((tokens[i:i+seq_len], tokens[i+1:i+seq_len+1]))

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        inp, tgt = self.data[idx]
        return torch.tensor(inp), torch.tensor(tgt)


def main():
    print("=" * 70)
    print("🚀 TRANSFORMER SPRACHMODELL - Fortgeschrittenes Beispiel")
    print("=" * 70)

    # Trainingsdaten
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
        "der mann liest seine zeitung",
        "die frau kocht das essen",
        "das auto fährt auf der straße",
        "der zug kommt am bahnhof an",
        "die kinder spielen auf dem spielplatz",
    ]

    # Tokenizer
    tokenizer = SimpleTokenizer()
    tokenizer.build_vocab(training_texts)
    print(f"\n📚 Vokabular: {tokenizer.vocab_size} Wörter")

    # Dataset
    dataset = TextDataset(training_texts, tokenizer, seq_len=4)
    dataloader = DataLoader(dataset, batch_size=8, shuffle=True)
    print(f"📊 Dataset: {len(dataset)} Trainingsbeispiele")

    # Modell
    model = MiniGPT(
        vocab_size=tokenizer.vocab_size,
        embed_dim=64,
        num_heads=4,
        num_layers=2
    )

    # Training
    print("\n" + "=" * 70)
    print("🏋️ TRAINING")
    print("=" * 70)

    optimizer = torch.optim.Adam(model.parameters(), lr=0.005)
    criterion = nn.CrossEntropyLoss()

    for epoch in range(100):
        model.train()
        total_loss = 0

        for inp, tgt in dataloader:
            logits = model(inp)
            loss = criterion(logits.view(-1, tokenizer.vocab_size), tgt.view(-1))

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        if (epoch + 1) % 20 == 0:
            print(f"   Epoche {epoch+1:3d}/100 | Loss: {total_loss/len(dataloader):.4f}")

    print("✅ Training abgeschlossen!")

    # Analyse
    print("\n" + "=" * 70)
    print("🔬 ANALYSE")
    print("=" * 70)

    # Detaillierte Logits-Analyse
    analyze_logits_detailed(model, tokenizer, "die katze sitzt", top_k=8)

    # Attention visualisieren
    visualize_attention(model, tokenizer, "die katze sitzt auf")

    # Generierung
    print("\n" + "=" * 70)
    print("✨ TEXT-GENERIERUNG")
    print("=" * 70)

    def generate(model, tokenizer, start_text, max_new=5, temp=1.0):
        model.eval()
        tokens = tokenizer.encode(start_text)

        for _ in range(max_new):
            with torch.no_grad():
                inp = torch.tensor(tokens[-10:]).unsqueeze(0)
                logits = model(inp)
                last_logits = logits[0, -1] / temp
                probs = F.softmax(last_logits, dim=-1)
                next_token = torch.multinomial(probs, 1).item()
                tokens.append(next_token)

        return tokenizer.decode(tokens)

    print("\nGenerierte Texte:")
    for start in ["die katze", "der hund", "das kind"]:
        result = generate(model, tokenizer, start, max_new=4, temp=0.8)
        print(f"   '{start}' -> '{result}'")

    # Modell speichern
    print("\n" + "=" * 70)
    print("💾 MODELL SPEICHERN")
    print("=" * 70)

    script_dir = Path(__file__).parent
    model_dir = script_dir / "models" / "transformer_model"
    save_transformer_model(model, tokenizer, str(model_dir))

    print("\n" + "=" * 70)
    print("✅ DEMO ABGESCHLOSSEN!")
    print("=" * 70)
    print(f"""
    📁 Gespeichertes Modell: {model_dir}
       - model.pt (Weights)
       - config.json (Architektur)
       - tokenizer.json (Vokabular)

    🚀 Inferenz starten mit:
       python inference_transformer.py
    """)

    return model, tokenizer


if __name__ == "__main__":
    model, tokenizer = main()
