"""Gradio application assembly — combines all tabs into one interface"""

import gradio as gr

from .training_tab import build_training_tab, build_finetuning_tab
from .inference_tab import build_inference_tab, refresh_models
from .evaluation_tab import build_evaluation_tab


def create_app():
    """Create and configure the Gradio application with all tabs."""
    with gr.Blocks(title="Sprachmodell-Werkstatt") as app:
        gr.Markdown("# Sprachmodell-Werkstatt")
        gr.Markdown(
            "Trainieren, Fine-Tunen, Testen und Bewerten von Sprachmodellen"
        )

        build_training_tab()
        build_finetuning_tab()
        model_dropdown = build_inference_tab()
        build_evaluation_tab()

        # Auto-populate model list when the page loads
        app.load(fn=refresh_models, outputs=[model_dropdown])

    return app
