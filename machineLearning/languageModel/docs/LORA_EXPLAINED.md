# LoRA - Low-Rank Adaptation

> Wie man riesige Sprachmodelle mit minimalen Ressourcen fine-tunen kann.

## Das Problem

Du hast ein vortrainiertes Modell (z.B. LLaMA-70B mit 70 Milliarden Parametern) und willst ihm
neues Wissen beibringen. **Full Fine-Tuning** bedeutet: Alle 70B Parameter updaten.

- Speicherbedarf: **>140 GB GPU RAM** (nur fuer die Gewichte, ohne Gradienten)
- Mit Gradienten + Optimizer: **~420 GB** (3x Modellgroesse fuer Adam)
- Training: Tage bis Wochen auf teurer Hardware

LoRA loest dieses Problem.

---

## Die Kernidee

Statt die originalen Gewichte `W` direkt zu veraendern, fuegen wir **zwei kleine Matrizen** `A` und `B` hinzu:

```
Original:      y = W * x
Mit LoRA:      y = W * x  +  B * A * x
                   ^^^^^     ^^^^^^^^^^^
                   eingefroren   trainierbar (klein!)
```

### Warum funktioniert das?

Forschung ([Hu et al., 2021](https://arxiv.org/abs/2106.09685)) hat gezeigt:

> Die Gewichtsaenderungen beim Fine-Tuning haben einen **niedrigen Rang** (low rank).
> Das heisst: Die meisten Aenderungen lassen sich durch wenige Dimensionen beschreiben.

Intuitiv: Wenn man ein Modell von "Allgemeinwissen" auf "Kochwissen" fine-tuned,
aendert sich nicht ALLES im Modell. Die Aenderung ist eine relativ "einfache"
Transformation, die in einem niedrig-dimensionalen Unterraum liegt.

---

## Beispiel mit konkreten Zahlen

### Unser MiniGPT (embed_dim=64)

Eine Attention-Projektion hat die Gewichtsmatrix `W` mit Shape `[64, 64]`:

```
Original W:     [64 x 64] = 4.096 Parameter

LoRA mit rank=4:
  A (runter):   [4 x 64]  = 256 Parameter     "Komprimiere den Input"
  B (hoch):     [64 x 4]  = 256 Parameter     "Expandiere zurueck"
  LoRA gesamt:             = 512 Parameter     = 12.5% von W
```

### Im Vergleich: LLaMA-70B

```
Eine Attention-Projektion:  [8192 x 8192] = 67.108.864 Parameter

LoRA mit rank=16:
  A:   [16 x 8192]  = 131.072 Parameter
  B:   [8192 x 16]  = 131.072 Parameter
  LoRA gesamt:       = 262.144 Parameter       = 0.4% von W!
```

Bei LLaMA-70B mit LoRA auf allen Attention-Projektionen:
- **Originale Parameter:** 70.000.000.000 (70B) -> eingefroren
- **LoRA-Parameter:** ~160.000.000 (160M) -> trainierbar
- **Verhaeltnis:** ~0.2% der Parameter werden trainiert

---

## Schritt fuer Schritt: Was passiert mathematisch?

### 1. Initialisierung

```python
# A: Zufaellig initialisiert (kleine Werte)
self.lora_A = torch.randn(rank, in_features) * 0.01

# B: Mit Nullen initialisiert!
self.lora_B = torch.zeros(out_features, rank)
```

**Warum B = 0?** Damit ist der LoRA-Beitrag am Anfang exakt 0:
```
B * A * x = 0 * A * x = 0
```
Das Modell verhaelt sich also zunaechst **identisch zum Original**.
Das Training startet von einem funktionierenden Zustand aus.

### 2. Forward Pass

```python
def forward(self, x):
    # Schritt 1: Originale Berechnung (eingefroren, kein Gradient)
    original_out = self.original(x)           # y = W * x

    # Schritt 2: LoRA-Beitrag
    compressed = x @ self.lora_A.T            # [batch, seq, rank]      - Komprimieren
    expanded = compressed @ self.lora_B.T     # [batch, seq, out_dim]   - Expandieren
    lora_out = expanded * self.scaling        # Skalieren mit alpha/rank

    # Schritt 3: Addieren
    return original_out + lora_out            # y = W*x + B*A*x * (alpha/rank)
```

### 3. Backward Pass (Training)

Beim Backpropagation werden **nur A und B** aktualisiert:
- `W` ist eingefroren (`requires_grad = False`) -> kein Gradient, kein Update
- `A` und `B` sind trainierbar -> Gradienten fliessen, Optimizer updated

### 4. Nach dem Training: Merging (optional)

```python
# LoRA-Gewichte in die Originalgewichte "einbacken"
W_neu = W_original + (B @ A) * scaling
```

Danach ist das Modell ein ganz normales Modell ohne LoRA-Overhead.

---

## Hyperparameter

### Rank (`r`)

Der wichtigste Hyperparameter. Bestimmt die Groesse des Unterraums:

| Rank | Parameter pro Layer | Ausdrueckbarkeit | Typischer Einsatz |
|------|-------------------|-------------------|-------------------|
| 1    | Minimal           | Sehr eingeschraenkt | Experimente |
| 4    | Klein             | Fuer einfache Tasks | Unser MiniGPT |
| 8    | Mittel            | Standard            | Die meisten Anwendungen |
| 16   | Groesser          | Hohe Flexibilitaet  | Komplexe Tasks |
| 64   | Gross             | Fast wie Full FT    | Selten noetig |

**Faustregel:** Starte mit rank=8, erhoehe nur wenn die Performance nicht reicht.

### Alpha (`alpha`)

Skalierungsfaktor fuer den LoRA-Beitrag:

```
scaling = alpha / rank
```

- `alpha = rank`: Skalierung = 1.0 (Standard)
- `alpha > rank`: LoRA-Beitrag wird verstaerkt
- `alpha < rank`: LoRA-Beitrag wird gedaempft

**Faustregel:** Setze `alpha = rank` oder `alpha = 2 * rank`.

### Lernrate

LoRA vertraegt **hoehere Lernraten** als Full Fine-Tuning:

```
Full Fine-Tuning:  lr = 1e-5 bis 5e-5
LoRA:              lr = 1e-4 bis 3e-4   (oft 5-10x hoeher)
```

Warum? Die LoRA-Matrizen sind klein und aendern das Modell nur subtil.
Groessere Schritte sind sicher, weil die Originalgewichte eingefroren sind.

---

## Wo wird LoRA angewendet?

Typischerweise auf die **Attention-Projektionen**:

```
Transformer Block
├── Self-Attention
│   ├── Q_proj  <-- LoRA        "Was suche ich?"
│   ├── K_proj  <-- LoRA        "Was biete ich?"
│   ├── V_proj  <-- LoRA        "Welche Information habe ich?"
│   └── O_proj  <-- LoRA        "Finale Projektion"
├── LayerNorm                    (kein LoRA, zu klein)
├── Feed-Forward
│   ├── Linear1                  (manchmal LoRA)
│   └── Linear2                  (manchmal LoRA)
└── LayerNorm                    (kein LoRA)
```

In der Praxis zeigt sich:
- **Q und V** sind am wichtigsten (groesster Effekt)
- **K und O** bringen zusaetzlichen Gewinn
- **Feed-Forward** optional, hilft bei manchen Tasks

---

## LoRA vs. andere Methoden

| Methode | Trainierbare Params | Speicherbedarf | Originalmodell | Mehrere Tasks |
|---------|-------------------|----------------|----------------|---------------|
| Full Fine-Tuning | 100% | Sehr hoch | Veraendert | Nein (1 Kopie pro Task) |
| Layer Freezing | 30-50% | Hoch | Teilweise veraendert | Nein |
| **LoRA** | **0.1-5%** | **Niedrig** | **Unveraendert** | **Ja (Adapter tauschen)** |
| QLoRA | 0.1-5% | Sehr niedrig | Unveraendert (4-bit) | Ja |
| Prefix Tuning | <0.1% | Minimal | Unveraendert | Ja |
| Prompt Tuning | <0.01% | Minimal | Unveraendert | Ja |

---

## Praxis: LoRA-Adapter speichern und laden

### Variante 1: Nur den Adapter speichern

```
Basismodell (einmal heruntergeladen):     140 GB
LoRA-Adapter "Kochwissen":                 50 MB
LoRA-Adapter "Medizin":                    50 MB
LoRA-Adapter "Jura":                       50 MB
```

Auf Plattformen wie Hugging Face gibt es tausende LoRA-Adapter fuer
populaere Basismodelle. Man laedt das Basismodell einmal und kann dann
beliebig viele Adapter draufsetzen.

### Variante 2: Adapter mergen

```python
W_neu = W_original + (B @ A) * scaling
```

Ergebnis: Ein normales Modell ohne LoRA-Overhead bei Inferenz.
Nachteil: Der Adapter ist fest "eingebacken" und nicht mehr austauschbar.

### Unser Projekt speichert beides

```
dist/finetuning_results/
├── lora_adapter/              # Nur die kleinen LoRA-Matrizen
│   ├── lora_weights.pt        #   -> Die A- und B-Matrizen
│   ├── embedding_weights.pt   #   -> Neue Wort-Embeddings
│   ├── lora_config.json       #   -> Konfiguration (rank, alpha, ...)
│   └── tokenizer.json         #   -> Erweitertes Vokabular
└── lora_merged/               # LoRA in Originalgewichte eingebacken
    ├── config.json            #   -> Normales MiniGPT-Config
    ├── model.pt               #   -> Komplettes Modell (ohne LoRA-Logik)
    └── tokenizer.json         #   -> Erweitertes Vokabular
```

---

## Weiterführende Konzepte

### QLoRA (Quantized LoRA)

Kombiniert LoRA mit **4-bit Quantisierung** des Basismodells:
- Basismodell wird auf 4-bit komprimiert (statt 16/32-bit)
- LoRA-Adapter bleiben in voller Praezision (16-bit)
- Ermoeglicht Fine-Tuning von 70B-Modellen auf einer einzigen GPU (24 GB)

### DoRA (Weight-Decomposed Low-Rank Adaptation)

Zerlegt die Gewichtsmatrix in **Richtung** und **Magnitude**:
```
W = m * (W_original + B * A) / ||W_original + B * A||
```
Trainiert beides separat. Oft bessere Ergebnisse als Standard-LoRA.

### LoRA+

Verwendet **unterschiedliche Lernraten** fuer A und B:
- Matrix A: Hoehere Lernrate
- Matrix B: Niedrigere Lernrate

Einfache Aenderung, oft bessere Konvergenz.

---

## Quellen

- [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) - Das Original-Paper (Hu et al., 2021)
- [QLoRA: Efficient Finetuning of Quantized LLMs](https://arxiv.org/abs/2305.14314) - QLoRA Paper (Dettmers et al., 2023)
- [DoRA: Weight-Decomposed Low-Rank Adaptation](https://arxiv.org/abs/2402.09353) - DoRA Paper (Liu et al., 2024)
