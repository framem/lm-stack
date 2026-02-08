"""
Generate a visualization for LORA_EXPLAINED.md Section 2.3.

Explains gradients intuitively using the "katze → tisch/sofa" example:
- A single weight parameter controls whether the model predicts "tisch" or "sofa"
- The loss function shows the error at each parameter value
- The gradient (slope) tells the optimizer which direction to move

Usage:
    python generate_gradient_example.py
    -> produces gradient_example.png in the same directory
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as FancyArrowPatch

# ── Setup ─────────────────────────────────────────────────────────────
fig, (ax1, ax2, ax3) = plt.subplots(1, 3, figsize=(20, 6))

# ── Panel 1: Loss landscape with gradient ─────────────────────────────
# A simplified 1D loss: parameter theta controls tisch vs sofa prediction
theta = np.linspace(-2, 4, 300)
# Loss is high at theta=0 (predicts "tisch"), low at theta=3 (predicts "sofa")
loss = 0.8 * (theta - 3) ** 2 + 0.2

# Current parameter position (before training)
theta_current = 0.5
loss_current = 0.8 * (theta_current - 3) ** 2 + 0.2

# Gradient at current position: derivative of loss = 2 * 0.8 * (theta - 3)
grad_current = 2 * 0.8 * (theta_current - 3)

# Tangent line for visualization
tangent_x = np.linspace(theta_current - 1.2, theta_current + 1.2, 50)
tangent_y = loss_current + grad_current * (tangent_x - theta_current)

ax1.plot(theta, loss, color="#2196F3", linewidth=2.5, label="Loss $\\mathcal{L}(\\theta)$")
ax1.plot(tangent_x, tangent_y, color="#FF5722", linewidth=2, linestyle="--",
         label=f"Gradient = {grad_current:.1f}")
ax1.scatter([theta_current], [loss_current], s=150, color="#FF5722",
            edgecolors="#D84315", linewidths=2, zorder=5)
ax1.scatter([3], [0.2], s=150, color="#4CAF50", edgecolors="#2E7D32",
            linewidths=2, zorder=5, marker="*")

# Arrow showing the direction the optimizer should move
ax1.annotate("", xy=(2.2, loss_current - 1.5), xytext=(theta_current, loss_current - 1.5),
             arrowprops=dict(arrowstyle="-|>", color="#4CAF50", lw=2.5))
ax1.text(1.35, loss_current - 1.9, "optimizer\nstep", ha="center", fontsize=10,
         color="#4CAF50", fontweight="bold")

# Labels
ax1.text(theta_current + 0.15, loss_current + 0.5, 'current\nposition',
         fontsize=10, color="#D84315", fontweight="bold")
ax1.text(3, 0.8, 'target\n(minimum)', fontsize=10, color="#2E7D32",
         ha="center", fontweight="bold")
ax1.text(theta_current - 0.9, loss_current + grad_current * (-0.9) + 0.4,
         f"slope = {grad_current:.1f}\n(gradient)", fontsize=10, color="#FF5722",
         fontweight="bold")

ax1.set_xlabel("Parameter $\\theta$ (weight value)", fontsize=12)
ax1.set_ylabel("Loss $\\mathcal{L}$ (error)", fontsize=12)
ax1.set_title("What is a gradient?", fontsize=13, fontweight="bold")
ax1.set_ylim(-0.5, 8)
ax1.legend(loc="upper right", fontsize=10)
ax1.grid(True, alpha=0.3)

# ── Panel 2: Concrete example with katze ──────────────────────────────
# Show 3 training steps: the parameter moves toward the optimum
steps_theta = [0.5, 1.5, 2.3, 2.8]
steps_loss = [0.8 * (t - 3) ** 2 + 0.2 for t in steps_theta]
step_labels = [
    '"tisch" (98%)',
    '"tisch" (61%)',
    '"sofa" (72%)',
    '"sofa" (96%)',
]
colors_steps = ["#FF5722", "#FF9800", "#8BC34A", "#4CAF50"]

ax2.plot(theta, loss, color="#2196F3", linewidth=2, alpha=0.4)

for i, (t, l, label, c) in enumerate(zip(steps_theta, steps_loss, step_labels, colors_steps)):
    ax2.scatter([t], [l], s=180, color=c, edgecolors="black", linewidths=1.2, zorder=5)
    # Connect steps with arrows
    if i < len(steps_theta) - 1:
        ax2.annotate("", xy=(steps_theta[i + 1], steps_loss[i + 1]),
                     xytext=(t, l),
                     arrowprops=dict(arrowstyle="-|>", color="#666666",
                                     lw=1.5, connectionstyle="arc3,rad=-0.2"))
    # Label
    offset_y = 0.6 if i % 2 == 0 else -0.8
    ax2.text(t, l + offset_y, f"Step {i}\n{label}", ha="center", fontsize=9,
             fontweight="bold", color=c,
             bbox=dict(boxstyle="round,pad=0.3", facecolor="white",
                       edgecolor=c, alpha=0.9))

ax2.set_xlabel("Parameter $\\theta$", fontsize=12)
ax2.set_ylabel("Loss $\\mathcal{L}$", fontsize=12)
ax2.set_title('"die katze sitzt auf dem → ?"\nGradient descent over 3 steps',
              fontsize=13, fontweight="bold")
ax2.set_ylim(-1.5, 8)
ax2.grid(True, alpha=0.3)

# ── Panel 3: Frozen vs trainable ──────────────────────────────────────
# Show two parameters: one frozen (no gradient), one trainable (has gradient)
bar_labels = ["$W$ (frozen)\nbase weight", "$A$ (trainable)\nLoRA matrix"]
bar_gradients = [0, -4.0]
bar_colors = ["#90CAF9", "#4CAF50"]
bar_edge = ["#1565C0", "#2E7D32"]

bars = ax3.bar(bar_labels, [abs(g) for g in bar_gradients], color=bar_colors,
               edgecolor=bar_edge, linewidth=2, width=0.5)

# Add text on bars
ax3.text(0, 0.15, "no gradient computed\nno optimizer state\nno memory cost",
         ha="center", va="bottom", fontsize=10, color="#1565C0", fontweight="bold")
ax3.text(1, abs(bar_gradients[1]) + 0.15,
         f"gradient = {bar_gradients[1]:.1f}\n→ optimizer updates $A$\n→ uses memory",
         ha="center", va="bottom", fontsize=10, color="#2E7D32", fontweight="bold")

# Crossed-out gradient symbol for frozen
ax3.text(0, 2.0, "∅", ha="center", va="center", fontsize=40,
         color="#D32F2F", fontweight="bold", alpha=0.6)

ax3.set_ylabel("|Gradient|", fontsize=12)
ax3.set_title("LoRA: frozen vs. trainable parameters",
              fontsize=13, fontweight="bold")
ax3.set_ylim(0, 6.5)
ax3.grid(True, alpha=0.3, axis="y")

# ── Global ────────────────────────────────────────────────────────────
fig.suptitle(
    "Gradients explained: how the model learns to predict \"sofa\" instead of \"tisch\"",
    fontsize=15, fontweight="bold", y=1.03,
)

fig.tight_layout()
fig.savefig(
    "machineLearning/languageModel/docs/gradient_example.png",
    dpi=150, bbox_inches="tight",
)
print("Saved: machineLearning/languageModel/docs/gradient_example.png")
