# LoRA - Low-Rank Adaptation

> How to fine-tune massive language models with minimal resources.

## The Problem

You have a pretrained model (e.g. LLaMA-70B with 70 billion parameters) and want to teach it
new knowledge. **Full Fine-Tuning** means: updating all 70B parameters.

- Memory requirement: **>140 GB GPU RAM** (just for the weights, without gradients)
- With gradients + optimizer: **~420 GB** (3x model size for Adam)
- Training: days to weeks on expensive hardware

LoRA solves this problem.

---

## The Core Idea

Instead of modifying the original weights `W` directly, we add **two small matrices** `A` and `B`:

```
Original:      y = W * x
With LoRA:     y = W * x  +  B * A * x
                   ^^^^^     ^^^^^^^^^^^
                   frozen     trainable (small!)
```

### Why does this work?

Research ([Hu et al., 2021](https://arxiv.org/abs/2106.09685)) has shown:

> The weight changes during fine-tuning have a **low rank**.
> This means: most changes can be described by just a few dimensions.

Intuitively: when you fine-tune a model from "general knowledge" to "cooking knowledge",
not EVERYTHING in the model changes. The change is a relatively "simple"
transformation that lies in a low-dimensional subspace.

---

## Example with Concrete Numbers

### Our MiniGPT (embed_dim=64)

An attention projection has the weight matrix `W` with shape `[64, 64]`:

```
Original W:     [64 x 64] = 4,096 parameters

LoRA with rank=4:
  A (down):     [4 x 64]  = 256 parameters     "Compress the input"
  B (up):       [64 x 4]  = 256 parameters     "Expand back"
  LoRA total:              = 512 parameters     = 12.5% of W
```

### In Comparison: LLaMA-70B

```
One attention projection:  [8192 x 8192] = 67,108,864 parameters

LoRA with rank=16:
  A:   [16 x 8192]  = 131,072 parameters
  B:   [8192 x 16]  = 131,072 parameters
  LoRA total:        = 262,144 parameters       = 0.4% of W!
```

For LLaMA-70B with LoRA on all attention projections:
- **Original parameters:** 70,000,000,000 (70B) -> frozen
- **LoRA parameters:** ~160,000,000 (160M) -> trainable
- **Ratio:** ~0.2% of parameters are trained

---

## Step by Step: What Happens Mathematically?

### 1. Initialization

```python
# A: Randomly initialized (small values)
self.lora_A = torch.randn(rank, in_features) * 0.01

# B: Initialized with zeros!
self.lora_B = torch.zeros(out_features, rank)
```

**Why B = 0?** This makes the LoRA contribution exactly 0 at the start:
```
B * A * x = 0 * A * x = 0
```
The model therefore behaves **identically to the original** at first.
Training starts from a functioning state.

### 2. Forward Pass

```python
def forward(self, x):
    # Step 1: Original computation (frozen, no gradient)
    original_out = self.original(x)           # y = W * x

    # Step 2: LoRA contribution
    compressed = x @ self.lora_A.T            # [batch, seq, rank]      - Compress
    expanded = compressed @ self.lora_B.T     # [batch, seq, out_dim]   - Expand
    lora_out = expanded * self.scaling        # Scale with alpha/rank

    # Step 3: Add together
    return original_out + lora_out            # y = W*x + B*A*x * (alpha/rank)
```

### 3. Backward Pass (Training)

During backpropagation, **only A and B** are updated:
- `W` is frozen (`requires_grad = False`) -> no gradient, no update
- `A` and `B` are trainable -> gradients flow, optimizer updates

### 4. After Training: Merging (optional)

```python
# "Bake" LoRA weights into the original weights
W_new = W_original + (B @ A) * scaling
```

Afterward, the model is a completely normal model without LoRA overhead.

---

## Hyperparameters

### Rank (`r`)

The most important hyperparameter. Determines the size of the subspace:

| Rank | Parameters per Layer | Expressiveness | Typical Use |
|------|---------------------|----------------|-------------|
| 1    | Minimal             | Very limited   | Experiments |
| 4    | Small               | For simple tasks | Our MiniGPT |
| 8    | Medium              | Standard       | Most applications |
| 16   | Larger              | High flexibility | Complex tasks |
| 64   | Large               | Almost like Full FT | Rarely needed |

**Rule of thumb:** Start with rank=8, increase only if performance is insufficient.

### Alpha (`alpha`)

Scaling factor for the LoRA contribution:

```
scaling = alpha / rank
```

- `alpha = rank`: Scaling = 1.0 (default)
- `alpha > rank`: LoRA contribution is amplified
- `alpha < rank`: LoRA contribution is dampened

**Rule of thumb:** Set `alpha = rank` or `alpha = 2 * rank`.

### Learning Rate

LoRA tolerates **higher learning rates** than Full Fine-Tuning:

```
Full Fine-Tuning:  lr = 1e-5 to 5e-5
LoRA:              lr = 1e-4 to 3e-4   (often 5-10x higher)
```

Why? The LoRA matrices are small and only change the model subtly.
Larger steps are safe because the original weights are frozen.

---

## Where is LoRA Applied?

Typically to the **attention projections**:

```
Transformer Block
├── Self-Attention
│   ├── Q_proj  <-- LoRA        "What am I looking for?"
│   ├── K_proj  <-- LoRA        "What do I offer?"
│   ├── V_proj  <-- LoRA        "What information do I have?"
│   └── O_proj  <-- LoRA        "Final projection"
├── LayerNorm                    (no LoRA, too small)
├── Feed-Forward
│   ├── Linear1                  (sometimes LoRA)
│   └── Linear2                  (sometimes LoRA)
└── LayerNorm                    (no LoRA)
```

In practice:
- **Q and V** are the most important (largest effect)
- **K and O** provide additional gain
- **Feed-Forward** optional, helps with some tasks

---

## LoRA vs. Other Methods

| Method | Trainable Params | Memory Usage | Original Model | Multiple Tasks |
|--------|-----------------|--------------|----------------|----------------|
| Full Fine-Tuning | 100% | Very high | Modified | No (1 copy per task) |
| Layer Freezing | 30-50% | High | Partially modified | No |
| **LoRA** | **0.1-5%** | **Low** | **Unchanged** | **Yes (swap adapters)** |
| QLoRA | 0.1-5% | Very low | Unchanged (4-bit) | Yes |
| Prefix Tuning | <0.1% | Minimal | Unchanged | Yes |
| Prompt Tuning | <0.01% | Minimal | Unchanged | Yes |

---

## Practice: Saving and Loading LoRA Adapters

### Option 1: Save Only the Adapter

```
Base model (downloaded once):              140 GB
LoRA adapter "cooking knowledge":           50 MB
LoRA adapter "medicine":                    50 MB
LoRA adapter "law":                         50 MB
```

On platforms like Hugging Face there are thousands of LoRA adapters for
popular base models. You download the base model once and can then
apply any number of adapters on top.

### Option 2: Merge the Adapter

```python
W_new = W_original + (B @ A) * scaling
```

Result: A normal model without LoRA overhead at inference.
Downside: The adapter is permanently "baked in" and no longer swappable.

### Our Project Saves Both

```
dist/finetuning_results/
├── lora_adapter/              # Only the small LoRA matrices
│   ├── lora_weights.pt        #   -> The A and B matrices
│   ├── embedding_weights.pt   #   -> New word embeddings
│   ├── lora_config.json       #   -> Configuration (rank, alpha, ...)
│   └── tokenizer.json         #   -> Extended vocabulary
└── lora_merged/               # LoRA baked into original weights
    ├── config.json            #   -> Normal MiniGPT config
    ├── model.pt               #   -> Complete model (without LoRA logic)
    └── tokenizer.json         #   -> Extended vocabulary
```

---

## Further Concepts

### QLoRA (Quantized LoRA)

Combines LoRA with **4-bit quantization** of the base model:
- Base model is compressed to 4-bit (instead of 16/32-bit)
- LoRA adapters remain at full precision (16-bit)
- Enables fine-tuning of 70B models on a single GPU (24 GB)

### DoRA (Weight-Decomposed Low-Rank Adaptation)

Decomposes the weight matrix into **direction** and **magnitude**:
```
W = m * (W_original + B * A) / ||W_original + B * A||
```
Trains both separately. Often better results than standard LoRA.

### LoRA+

Uses **different learning rates** for A and B:
- Matrix A: Higher learning rate
- Matrix B: Lower learning rate

Simple change, often better convergence.

---

## References

- [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) - The original paper (Hu et al., 2021)
- [QLoRA: Efficient Finetuning of Quantized LLMs](https://arxiv.org/abs/2305.14314) - QLoRA Paper (Dettmers et al., 2023)
- [DoRA: Weight-Decomposed Low-Rank Adaptation](https://arxiv.org/abs/2402.09353) - DoRA Paper (Liu et al., 2024)
