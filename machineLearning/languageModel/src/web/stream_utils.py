"""Stdout capture and loss parsing utilities for live training updates"""

import io
import re
import queue

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


# Regex for epoch/loss lines from training output
# Matches:  "   Epoche   1/ 50 | Loss: 2.3456"
# Matches:  "   [Full FT] Epoche   1/ 50 | Loss: 2.3456"
EPOCH_PATTERN = re.compile(
    r"(?:\[([^\]]+)\]\s*)?Epoche\s+(\d+)\s*/\s*(\d+)\s*\|\s*Loss:\s*([\d.]+)"
)


class StreamCapture(io.TextIOBase):
    """Captures stdout output and routes each line to a queue."""

    def __init__(self):
        self.queue = queue.Queue()
        self._buffer = ""

    def write(self, text):
        self._buffer += text
        while "\n" in self._buffer:
            line, self._buffer = self._buffer.split("\n", 1)
            self.queue.put(line)
        return len(text)

    def flush(self):
        if self._buffer:
            self.queue.put(self._buffer)
            self._buffer = ""


def parse_epoch_line(line):
    """Parse an epoch/loss training output line.

    Returns:
        dict with keys (label, epoch, total_epochs, loss) or None.
    """
    match = EPOCH_PATTERN.search(line)
    if not match:
        return None
    return {
        "label": match.group(1) or "",
        "epoch": int(match.group(2)),
        "total_epochs": int(match.group(3)),
        "loss": float(match.group(4)),
    }


def build_loss_figure(losses_dict):
    """Build a matplotlib figure showing loss curves.

    Args:
        losses_dict: {label: [(epoch, loss), ...]}

    Returns:
        matplotlib.Figure
    """
    plt.close("all")
    fig, ax = plt.subplots(figsize=(8, 4))

    for label, data in losses_dict.items():
        if data:
            epochs, losses = zip(*data)
            ax.plot(
                epochs, losses,
                label=label or "Training", linewidth=2,
            )

    ax.set_xlabel("Epoche")
    ax.set_ylabel("Loss")
    ax.set_title("Trainingsverlauf")
    if len(losses_dict) > 1 or any(k for k in losses_dict):
        ax.legend()
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    return fig
