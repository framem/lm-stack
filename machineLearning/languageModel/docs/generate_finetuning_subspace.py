"""
Generate a side-by-side visualization for LORA_EXPLAINED.md Section 2.

Left panel:  Full Fine-Tuning — all parameters updated, but only a small
             subset changes significantly (red).
Right panel: LoRA — base weights frozen (blue), small trainable adapter
             nodes (green) added alongside the significantly changed nodes.

Usage:
    python generate_finetuning_subspace.py
    -> produces finetuning_subspace.png in the same directory
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.lines import Line2D

np.random.seed(42)

# ── Network layout ────────────────────────────────────────────────────
layer_sizes = [6, 10, 12, 10, 6]
layer_labels = ["Input", "Hidden 1", "Hidden 2", "Hidden 3", "Output"]

x_positions = np.linspace(0.5, 5.5, len(layer_sizes))
node_positions = []

for i, size in enumerate(layer_sizes):
    x = x_positions[i]
    ys = np.linspace(-size / 2 * 0.4, size / 2 * 0.4, size)
    node_positions.append([(x, y) for y in ys])

# ── Decide which nodes "change significantly" during fine-tuning ──────
changed_nodes = set()
for layer_idx in range(1, len(layer_sizes) - 1):  # hidden layers only
    size = layer_sizes[layer_idx]
    n_changed = max(1, int(size * 0.15))
    indices = np.random.choice(size, n_changed, replace=False)
    for idx in indices:
        changed_nodes.add((layer_idx, idx))

# ── Propagate changed signal forward ──────────────────────────────────
affected_nodes = set(changed_nodes)
for i in range(1, len(layer_sizes)):
    prev_has_affected = any((i - 1, j) in affected_nodes
                           for j in range(layer_sizes[i - 1]))
    if prev_has_affected:
        for k in range(layer_sizes[i]):
            affected_nodes.add((i, k))

# ── Colors ────────────────────────────────────────────────────────────
c_frozen = "#2196F3"          # blue
c_changed = "#FF5722"         # red — significantly changed (Full FT)
c_lora_adapter = "#4CAF50"    # green — trainable LoRA adapter
c_frozen_locked = "#90CAF9"   # light blue — frozen in LoRA (dimmed)

c_edge_normal = "#64B5F6"
c_edge_direct = "#FF8A65"
c_edge_propagated = "#FFAB91"
c_edge_frozen = "#B0BEC5"     # gray-blue — frozen edges in LoRA
c_edge_adapter = "#81C784"    # green — adapter edges in LoRA


# ── Helper: draw network ─────────────────────────────────────────────
def draw_network_full_ft(ax):
    """Draw the Full Fine-Tuning panel."""
    # Edges
    for i in range(len(layer_sizes) - 1):
        for j, (x1, y1) in enumerate(node_positions[i]):
            for k, (x2, y2) in enumerate(node_positions[i + 1]):
                src_directly_changed = (i, j) in changed_nodes
                src_affected = (i, j) in affected_nodes
                if src_directly_changed:
                    ax.plot([x1, x2], [y1, y2], color=c_edge_direct,
                            linewidth=0.9, alpha=0.45, zorder=2)
                elif src_affected:
                    ax.plot([x1, x2], [y1, y2], color=c_edge_propagated,
                            linewidth=0.6, alpha=0.30, zorder=2)
                else:
                    ax.plot([x1, x2], [y1, y2], color=c_edge_normal,
                            linewidth=0.4, alpha=0.30, zorder=1)

    # Nodes
    for i, layer in enumerate(node_positions):
        for j, (x, y) in enumerate(layer):
            is_changed = (i, j) in changed_nodes
            color = c_changed if is_changed else c_frozen
            size = 220 if is_changed else 160
            edge_color = "#D84315" if is_changed else "#1565C0"
            ax.scatter(x, y, s=size, c=color, edgecolors=edge_color,
                       linewidths=1.5, zorder=3, alpha=0.9)

    # Layer labels
    for i, label in enumerate(layer_labels):
        x = x_positions[i]
        top_y = max(y for _, y in node_positions[i])
        ax.text(x, top_y + 0.45, label, ha="center", va="bottom",
                fontsize=9, fontweight="bold", color="#333333")

    # Stats
    total = sum(layer_sizes)
    n = len(changed_nodes)
    pct = n / total * 100
    ax.text(0.98, 0.02,
            f"{n} of {total} nodes changed\n"
            f"significantly ({pct:.0f}%)",
            transform=ax.transAxes, ha="right", va="bottom",
            fontsize=9, fontstyle="italic", color="#555555",
            bbox=dict(boxstyle="round,pad=0.3", facecolor="white",
                      edgecolor="#CCCCCC", alpha=0.9))

    ax.set_title(
        "Full Fine-Tuning\n"
        "All parameters updated, few change significantly",
        fontsize=12, fontweight="bold", pad=30,
    )


def draw_network_lora(ax):
    """Draw the LoRA panel."""
    # Adapter node offset (small shift to the right, same vertical level)
    adapter_offset_x = 0.30
    adapter_offset_y = 0.0

    # Edges — all frozen (gray-blue)
    for i in range(len(layer_sizes) - 1):
        for j, (x1, y1) in enumerate(node_positions[i]):
            for k, (x2, y2) in enumerate(node_positions[i + 1]):
                ax.plot([x1, x2], [y1, y2], color=c_edge_frozen,
                        linewidth=0.4, alpha=0.25, zorder=1)

    # Adapter incoming edges: from previous layer nodes TO adapter node
    # (the adapter receives the same input as the frozen node)
    for (layer_idx, node_idx) in changed_nodes:
        ox, oy = node_positions[layer_idx][node_idx]
        ax_pos = ox + adapter_offset_x
        ay_pos = oy + adapter_offset_y
        if layer_idx > 0:
            for j, (x1, y1) in enumerate(node_positions[layer_idx - 1]):
                ax.plot([x1, ax_pos], [y1, ay_pos], color=c_edge_adapter,
                        linewidth=0.5, alpha=0.25, zorder=2)

    # Adapter outgoing edges: from adapter node to all nodes in next layer
    for (layer_idx, node_idx) in changed_nodes:
        ox, oy = node_positions[layer_idx][node_idx]
        ax_pos = ox + adapter_offset_x
        ay_pos = oy + adapter_offset_y
        if layer_idx < len(layer_sizes) - 1:
            for k, (x2, y2) in enumerate(node_positions[layer_idx + 1]):
                ax.plot([ax_pos, x2], [ay_pos, y2], color=c_edge_adapter,
                        linewidth=0.8, alpha=0.4, zorder=2)

    # "+" symbol between adapter and original node to show additive combination
    for (layer_idx, node_idx) in changed_nodes:
        ox, oy = node_positions[layer_idx][node_idx]
        mid_x = ox + adapter_offset_x / 2
        ax.text(mid_x, oy, "+", ha="center", va="center", fontsize=12,
                color="#2E7D32", fontweight="bold", zorder=6)

    # Frozen nodes (all original nodes are frozen = dimmed blue)
    for i, layer in enumerate(node_positions):
        for j, (x, y) in enumerate(layer):
            ax.scatter(x, y, s=160, c=c_frozen_locked, edgecolors="#1565C0",
                       linewidths=1.2, zorder=3, alpha=0.6)

    # Adapter nodes (green diamonds, directly below the corresponding node)
    for (layer_idx, node_idx) in changed_nodes:
        ox, oy = node_positions[layer_idx][node_idx]
        ax.scatter(ox + adapter_offset_x, oy + adapter_offset_y,
                   s=180, c=c_lora_adapter, edgecolors="#2E7D32",
                   linewidths=1.5, zorder=5, alpha=0.95, marker="D")

    # Layer labels
    for i, label in enumerate(layer_labels):
        x = x_positions[i]
        top_y = max(y for _, y in node_positions[i])
        ax.text(x, top_y + 0.45, label, ha="center", va="bottom",
                fontsize=9, fontweight="bold", color="#333333")

    # Stats
    n_adapter = len(changed_nodes)
    total = sum(layer_sizes)
    ax.text(0.98, 0.02,
            f"{n_adapter} adapter nodes added\n"
            f"{total} base nodes frozen",
            transform=ax.transAxes, ha="right", va="bottom",
            fontsize=9, fontstyle="italic", color="#555555",
            bbox=dict(boxstyle="round,pad=0.3", facecolor="white",
                      edgecolor="#CCCCCC", alpha=0.9))

    ax.set_title(
        "LoRA\n"
        "Base weights frozen, small adapters added",
        fontsize=12, fontweight="bold", pad=30,
    )


# ── Create side-by-side figure ────────────────────────────────────────
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(20, 8))

draw_network_full_ft(ax1)
draw_network_lora(ax2)

for a in (ax1, ax2):
    a.set_xlim(-0.1, 6.1)
    a.axis("off")

# Arrow between panels
fig.text(0.50, 0.52, "→", fontsize=40, ha="center", va="center",
         fontweight="bold", color="#666666",
         transform=fig.transFigure)
fig.text(0.50, 0.46, "observation\nbecomes\nstrategy", fontsize=10,
         ha="center", va="top", color="#888888", fontstyle="italic",
         transform=fig.transFigure)

# Shared legend
handles = [
    # Full FT nodes
    mpatches.Patch(color=c_frozen, label="Minimally changed node (Full FT)"),
    mpatches.Patch(color=c_changed, label="Significantly changed node (Full FT)"),
    # LoRA nodes
    mpatches.Patch(color=c_frozen_locked, label="Frozen base node (LoRA)"),
    mpatches.Patch(color=c_lora_adapter, label="Trainable adapter node (LoRA)"),
    # Edges
    Line2D([0], [0], color=c_edge_direct, linewidth=2, alpha=0.7,
           label="Changed edge (Full FT)"),
    Line2D([0], [0], color=c_edge_propagated, linewidth=2, alpha=0.5,
           linestyle="--", label="Propagated change (Full FT)"),
    Line2D([0], [0], color=c_edge_frozen, linewidth=2, alpha=0.5,
           label="Frozen edge (LoRA)"),
    Line2D([0], [0], color=c_edge_adapter, linewidth=2, alpha=0.7,
           label="Adapter edge (LoRA)"),
]
fig.legend(handles=handles, loc="lower center", ncol=4, fontsize=10,
           frameon=True, fancybox=True, shadow=False, borderpad=0.8,
           bbox_to_anchor=(0.5, -0.06))

fig.suptitle(
    "From observation to strategy: why LoRA works",
    fontsize=16, fontweight="bold", y=1.01,
)

fig.tight_layout(rect=[0, 0, 1, 0.98])
fig.savefig(
    "machineLearning/languageModel/docs/finetuning_subspace.png",
    dpi=150, bbox_inches="tight",
)
print("Saved: machineLearning/languageModel/docs/finetuning_subspace.png")
