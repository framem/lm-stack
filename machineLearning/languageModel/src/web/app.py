"""Gradio application assembly — combines all tabs into one interface"""

import torch
import gradio as gr

from .training_tab import build_training_tab, build_finetuning_tab
from .inference_tab import build_inference_tab, refresh_models
from .evaluation_tab import build_evaluation_tab


def _device_info():
    """Return a short device description for the header."""
    if torch.cuda.is_available():
        name = torch.cuda.get_device_name(0)
        return f"GPU ({name})"
    return "CPU"


def create_app():
    """Create and configure the Gradio application with all tabs."""
    with gr.Blocks(title="Sprachmodell-Werkstatt") as app:
        gr.Markdown("# Sprachmodell-Werkstatt")
        gr.Markdown(
            f"Trainieren, Fine-Tunen, Testen und Bewerten von Sprachmodellen "
            f"&nbsp;|&nbsp; **Device: {_device_info()}**"
        )

        build_training_tab()
        build_finetuning_tab()
        model_dropdown = build_inference_tab()
        build_evaluation_tab()

        # Auto-populate model list when the page loads
        app.load(fn=refresh_models, outputs=[model_dropdown])

    return app
