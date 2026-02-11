"""Training and Fine-Tuning tabs with live stdout streaming"""

import threading
import time
import contextlib
import traceback

import gradio as gr

from .stream_utils import StreamCapture, parse_epoch_line, build_loss_figure


_training_lock = threading.Lock()


def _run_in_thread(fn, capture, result_holder):
    """Run fn with stdout redirected to capture, store exception if any."""
    try:
        with contextlib.redirect_stdout(capture):
            fn()
    except Exception:
        result_holder["error"] = traceback.format_exc()
    finally:
        capture.flush()
        result_holder["done"] = True


def run_training(model_type, dataset, epochs):
    """Generator: run training, yield (log, plot, status) updates."""
    if not _training_lock.acquire(blocking=False):
        yield "Ein Training laeuft bereits!", None, "Gesperrt"
        return

    try:
        capture = StreamCapture()
        result = {"done": False, "error": None}

        dataset_map = {
            "S (22 Saetze)": "s",
            "M (200 Saetze)": "m",
            "L (2000 Saetze)": "l",
        }
        ds = dataset_map.get(dataset, "s")

        if model_type == "LSTM":
            from training.training_lstm import main as train_fn
        else:
            from training.training_transformer import main as train_fn

        ep = int(epochs)
        fn = lambda: train_fn(dataset=ds, epochs=ep)

        thread = threading.Thread(
            target=_run_in_thread, args=(fn, capture, result), daemon=True,
        )
        thread.start()

        log_lines = []
        losses = {}
        label = model_type

        while not result["done"] or not capture.queue.empty():
            updated = False
            while not capture.queue.empty():
                line = capture.queue.get_nowait()
                log_lines.append(line)
                updated = True

                parsed = parse_epoch_line(line)
                if parsed:
                    lbl = parsed["label"] or label
                    losses.setdefault(lbl, []).append((parsed["epoch"], parsed["loss"]))
                    status = (
                        f"Epoche {parsed['epoch']}/{parsed['total_epochs']} "
                        f"| Loss: {parsed['loss']:.4f}"
                    )
                    fig = build_loss_figure(losses)
                    yield "\n".join(log_lines[-500:]), fig, status

            if not updated:
                time.sleep(0.3)

        if result["error"]:
            log_lines.append(f"\nFEHLER:\n{result['error']}")
        else:
            log_lines.append("\nTraining abgeschlossen!")

        fig = build_loss_figure(losses) if any(losses.values()) else None
        yield (
            "\n".join(log_lines[-500:]),
            fig,
            "Fertig" if not result["error"] else "Fehler",
        )

    finally:
        _training_lock.release()


def run_finetuning(method, epochs):
    """Generator: run fine-tuning, yield (log, plot, status) updates."""
    if not _training_lock.acquire(blocking=False):
        yield "Ein Training laeuft bereits!", None, "Gesperrt"
        return

    try:
        capture = StreamCapture()
        result = {"done": False, "error": None}

        if "Neues Wissen" in method:
            from training.finetuning_transformer import main as ft_fn
        else:
            from training.finetuning_fact_correction import main as ft_fn

        ep = int(epochs)
        fn = lambda: ft_fn(epochs=ep)

        thread = threading.Thread(
            target=_run_in_thread, args=(fn, capture, result), daemon=True,
        )
        thread.start()

        log_lines = []
        losses = {}

        while not result["done"] or not capture.queue.empty():
            updated = False
            while not capture.queue.empty():
                line = capture.queue.get_nowait()
                log_lines.append(line)
                updated = True

                parsed = parse_epoch_line(line)
                if parsed:
                    lbl = parsed["label"] or "Training"
                    losses.setdefault(lbl, []).append((parsed["epoch"], parsed["loss"]))
                    status = (
                        f"[{lbl}] Epoche {parsed['epoch']}/{parsed['total_epochs']} "
                        f"| Loss: {parsed['loss']:.4f}"
                    )
                    fig = build_loss_figure(losses)
                    yield "\n".join(log_lines[-500:]), fig, status

            if not updated:
                time.sleep(0.3)

        if result["error"]:
            log_lines.append(f"\nFEHLER:\n{result['error']}")
        else:
            log_lines.append("\nFine-Tuning abgeschlossen!")

        fig = build_loss_figure(losses) if any(losses.values()) else None
        yield (
            "\n".join(log_lines[-500:]),
            fig,
            "Fertig" if not result["error"] else "Fehler",
        )

    finally:
        _training_lock.release()


def build_training_tab():
    """Build the Training tab UI components."""
    with gr.Tab("Training"):
        gr.Markdown("### Modell trainieren")

        with gr.Row():
            model_type = gr.Dropdown(
                choices=["LSTM", "Transformer"],
                value="LSTM",
                label="Modelltyp",
            )
            dataset = gr.Dropdown(
                choices=["S (22 Saetze)", "M (200 Saetze)", "L (2000 Saetze)"],
                value="S (22 Saetze)",
                label="Datensatz",
            )
            epochs = gr.Slider(
                10, 500, value=100, step=10, label="Epochen",
            )

        train_btn = gr.Button("Training starten", variant="primary")
        status = gr.Textbox(label="Status", interactive=False)

        with gr.Row():
            log = gr.Textbox(
                label="Trainingslog", lines=15,
                interactive=False, autoscroll=True,
            )
            plot = gr.Plot(label="Loss-Kurve")

        train_btn.click(
            fn=run_training,
            inputs=[model_type, dataset, epochs],
            outputs=[log, plot, status],
        )

        gr.Markdown(
            "**Cross-Entropy Loss** &nbsp; $\\text{Loss} = -\\ln(P_{\\text{richtig}})$ "
            "&nbsp;|&nbsp; Baseline (zufaelliges Raten): "
            "$\\text{Loss}_{\\text{zufall}} = \\ln(\\text{vocab\\_size})$ "
            "&nbsp;|&nbsp; Alles unter der Baseline = Modell hat gelernt"
        )


def build_finetuning_tab():
    """Build the Fine-Tuning tab UI components."""
    with gr.Tab("Fine-Tuning"):
        gr.Markdown("### Modell fine-tunen")

        with gr.Row():
            method = gr.Dropdown(
                choices=[
                    "Neues Wissen (Full FT + Layer Freezing + LoRA)",
                    "Faktenkorrektur (LoRA V-only vs. alle)",
                ],
                value="Neues Wissen (Full FT + Layer Freezing + LoRA)",
                label="Methode",
                scale=3,
            )
            epochs = gr.Slider(
                10, 500, value=50, step=10, label="Epochen",
                scale=1,
            )

        ft_btn = gr.Button("Fine-Tuning starten", variant="primary")
        status = gr.Textbox(label="Status", interactive=False)

        with gr.Row():
            log = gr.Textbox(
                label="Trainingslog", lines=15,
                interactive=False, autoscroll=True,
            )
            plot = gr.Plot(label="Loss-Kurven")

        ft_btn.click(
            fn=run_finetuning,
            inputs=[method, epochs],
            outputs=[log, plot, status],
        )
