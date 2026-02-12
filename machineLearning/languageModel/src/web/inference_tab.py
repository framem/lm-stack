"""Inference tab: model selection, text generation, and comparison"""

from pathlib import Path

import gradio as gr
import pandas as pd

from inference import get_device


# Lazy-loaded model cache
_model_cache = {}


def _get_base_dir():
    """Return the dist/ directory for model storage."""
    return Path(__file__).parent.parent.parent / "dist"


def load_all_available_models():
    """Discover all available models across all types.

    Returns:
        dict of {name: {path, type, label, ...}}
    """
    base_dir = _get_base_dir()
    models = {}

    # Transformer + fine-tuned variants
    from inference.inference_finetuned import discover_models
    models.update(discover_models(base_dir))

    # LSTM
    lstm_dir = base_dir / "lstm_model"
    if (lstm_dir / "model.pt").exists():
        models["lstm"] = {
            "path": lstm_dir,
            "type": "lstm",
            "label": "LSTM (Basis-Training)",
        }

    # Fact correction adapters
    fc_dir = base_dir / "finetuning_results" / "fact_correction"
    if fc_dir.exists():
        for variant in ["v_only", "all"]:
            adapter_dir = fc_dir / variant / "lora_adapter"
            if (adapter_dir / "lora_weights.pt").exists():
                models[f"fc_{variant}"] = {
                    "path": adapter_dir,
                    "type": "fact_correction",
                    "target": variant,
                    "label": f"Faktenkorrektur ({variant})",
                }

    return models


def refresh_models():
    """Re-discover models and update dropdown choices."""
    models = load_all_available_models()
    choices = [f"{name} \u2014 {info['label']}" for name, info in models.items()]
    return gr.update(choices=choices, value=choices[0] if choices else None)


def _load_model(name, info):
    """Load a model into memory (with caching)."""
    if name in _model_cache:
        return _model_cache[name]

    base_dir = _get_base_dir()

    if info["type"] == "lstm":
        from training.training_lstm import load_model as load_lstm
        model, tokenizer = load_lstm(str(info["path"]))
    elif info["type"] == "fact_correction":
        from inference.inference_fact_correction import load_fact_correction_adapter
        base_model_dir = str(base_dir / "transformer_model")
        model, tokenizer = load_fact_correction_adapter(
            base_model_dir, str(info["path"]),
            target=info.get("target", "v_only"),
        )
    else:
        from inference.inference_finetuned import load_model_by_type
        model, tokenizer = load_model_by_type(info, base_dir)

    device = get_device()
    model = model.to(device)
    _model_cache[name] = (model, tokenizer)
    return model, tokenizer


def _generate(info, model, tokenizer, prompt, temperature, max_length, top_k, top_p):
    """Generate text using the appropriate function for the model type."""
    if info["type"] == "lstm":
        from inference.inference_lstm import generate_text_interactive
        return generate_text_interactive(
            model, tokenizer, prompt,
            max_length=int(max_length), temperature=temperature,
            top_p=top_p, top_k=int(top_k),
        )
    else:
        from inference.inference_finetuned import generate_text
        return generate_text(
            model, tokenizer, prompt,
            max_length=int(max_length), temperature=temperature,
            top_p=top_p,
        )


def generate_single(model_selection, prompt, temperature, max_length, top_k, top_p):
    """Generate text with a single selected model."""
    if not model_selection:
        return "Kein Modell ausgewaehlt."
    if not prompt.strip():
        return "Bitte einen Prompt eingeben."

    name = model_selection.split(" \u2014 ")[0]
    models = load_all_available_models()

    if name not in models:
        return f"Modell '{name}' nicht gefunden."

    info = models[name]
    model, tokenizer = _load_model(name, info)
    return _generate(
        info, model, tokenizer, prompt.strip(),
        temperature, max_length, top_k, top_p,
    )


def compare_all_models(prompt, temperature, max_length, top_k, top_p):
    """Generate text with all models and return a comparison DataFrame."""
    if not prompt.strip():
        return pd.DataFrame({"Fehler": ["Bitte einen Prompt eingeben."]})

    models = load_all_available_models()
    if not models:
        return pd.DataFrame({"Fehler": ["Keine Modelle gefunden."]})

    rows = []
    for name, info in models.items():
        try:
            model, tokenizer = _load_model(name, info)
            result = _generate(
                info, model, tokenizer, prompt.strip(),
                temperature, max_length, top_k, top_p,
            )
            rows.append({"Modell": info["label"], "Generierter Text": result})
        except Exception as e:
            rows.append({"Modell": info["label"], "Generierter Text": f"Fehler: {e}"})

    return pd.DataFrame(rows)


def build_inference_tab():
    """Build the Inference tab UI components.

    Returns:
        model_selection Dropdown (for wiring load event in app.py).
    """
    with gr.Tab("Inferenz"):
        gr.Markdown("### Text generieren")

        with gr.Row():
            model_selection = gr.Dropdown(
                label="Modell", choices=[], interactive=True,
                scale=4,
            )
            refresh_btn = gr.Button(
                "Neu laden", size="sm", scale=1, min_width=80,
            )

        prompt = gr.Textbox(
            label="Prompt", placeholder="z.B. 'die katze'", lines=1,
        )

        with gr.Row():
            temperature = gr.Slider(
                0.1, 2.0, value=0.8, step=0.1, label="Temperature",
            )
            max_length = gr.Slider(
                1, 30, value=10, step=1, label="Max. Laenge",
            )
            top_k = gr.Slider(1, 50, value=5, step=1, label="Top-K")
            top_p = gr.Slider(0.1, 1.0, value=0.9, step=0.05, label="Top-P")

        with gr.Row():
            gen_btn = gr.Button("Text generieren", variant="primary")
            compare_btn = gr.Button("Alle Modelle vergleichen")

        output_text = gr.Textbox(label="Ergebnis", lines=3, interactive=False)
        comparison_table = gr.Dataframe(label="Modellvergleich")

        refresh_btn.click(fn=refresh_models, outputs=[model_selection])

        gen_btn.click(
            fn=generate_single,
            inputs=[model_selection, prompt, temperature, max_length, top_k, top_p],
            outputs=[output_text],
        )

        compare_btn.click(
            fn=compare_all_models,
            inputs=[prompt, temperature, max_length, top_k, top_p],
            outputs=[comparison_table],
        )

    return model_selection
