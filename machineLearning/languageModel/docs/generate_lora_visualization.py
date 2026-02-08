"""
Generate a visualization for LORA_EXPLAINED.md Section 2.2.

Shows a 2D example: pretrained weights define one linear mapping,
full fine-tuning produces another, and LoRA approximates the difference
between them via a low-rank update (rank 1 in 2D).

Usage:
    python generate_lora_visualization.py
    -> produces lora_intuition.png in the same directory
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

# ── Setup ──────────────────────────────────────────────────────────────
np.random.seed(42)

# Pretrained weight matrix (2×2)
W_pre = np.array([[2.0, 0.5],
                   [0.3, 1.5]])

# "Full fine-tuning" target weight matrix
W_ft = np.array([[2.3, 0.4],
                  [0.1, 1.8]])

# The true weight change
delta_W = W_ft - W_pre  # = [[0.3, -0.1], [-0.2, 0.3]]

# LoRA approximation: rank-1 factorization of delta_W
# Compute best rank-1 approximation via SVD
U, S, Vt = np.linalg.svd(delta_W)
B_lora = (U[:, 0:1] * S[0])  # shape (2,1)
A_lora = Vt[0:1, :]           # shape (1,2)
delta_W_lora = B_lora @ A_lora

W_lora = W_pre + delta_W_lora

# Input vectors (unit circle)
theta = np.linspace(0, 2 * np.pi, 200)
X = np.stack([np.cos(theta), np.sin(theta)])  # shape (2, 200)

# Outputs
Y_pre  = W_pre @ X
Y_ft   = W_ft  @ X
Y_lora = W_lora @ X

# ── Plot ───────────────────────────────────────────────────────────────
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

# Colors
c_input = "#AAAAAA"
c_pre   = "#2196F3"
c_ft    = "#FF5722"
c_lora  = "#4CAF50"

titles = [
    "Pretrained weights $W$\n(frozen)",
    "Full Fine-Tuning\n$W + \\Delta W$",
    "LoRA\n$W + BA \\approx W + \\Delta W$",
]
outputs = [Y_pre, Y_ft, Y_lora]
colors  = [c_pre, c_ft, c_lora]

for ax, title, Y, c in zip(axes, titles, outputs, colors):
    # Input circle (reference)
    ax.plot(X[0], X[1], color=c_input, linewidth=1, linestyle="--", alpha=0.5)
    # Pretrained output (always shown as reference)
    ax.plot(Y_pre[0], Y_pre[1], color=c_pre, linewidth=1.5, alpha=0.3)
    # Current output
    ax.plot(Y[0], Y[1], color=c, linewidth=2.5)

    ax.set_title(title, fontsize=13)
    ax.set_xlim(-3.2, 3.2)
    ax.set_ylim(-3.2, 3.2)
    ax.set_aspect("equal")
    ax.grid(True, alpha=0.3)
    ax.axhline(0, color="black", linewidth=0.5)
    ax.axvline(0, color="black", linewidth=0.5)

# Add difference arrows in the third panel to show the LoRA correction
ax3 = axes[2]
n_arrows = 12
indices = np.linspace(0, len(theta) - 1, n_arrows, endpoint=False, dtype=int)
for i in indices:
    ax3.annotate(
        "", xy=(Y_lora[0, i], Y_lora[1, i]),
        xytext=(Y_pre[0, i], Y_pre[1, i]),
        arrowprops=dict(arrowstyle="->", color=c_lora, lw=1.2, alpha=0.6),
    )

# Legend
handles = [
    mpatches.Patch(color=c_input, label="Input (unit circle)"),
    mpatches.Patch(color=c_pre,   label="Pretrained $Wx$"),
    mpatches.Patch(color=c_ft,    label="Fine-tuned $(W{+}\\Delta W)x$"),
    mpatches.Patch(color=c_lora,  label="LoRA $(W{+}BA)x$"),
]
fig.legend(handles=handles, loc="lower center", ncol=4, fontsize=11,
           frameon=True, bbox_to_anchor=(0.5, -0.12))

fig.suptitle(
    "LoRA approximates the fine-tuning update without modifying the original weights",
    fontsize=14, fontweight="bold", y=1.02,
)
plt.tight_layout()
plt.savefig(
    "machineLearning/languageModel/docs/lora_intuition.png",
    dpi=150, bbox_inches="tight",
)
print("Saved: machineLearning/languageModel/docs/lora_intuition.png")
