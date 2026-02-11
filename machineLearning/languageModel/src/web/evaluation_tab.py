"""Evaluation tab: LLM-as-a-Judge with live progress updates"""

from pathlib import Path

import gradio as gr
import pandas as pd


def _get_base_dir():
    """Return the dist/ directory for model storage."""
    return Path(__file__).parent.parent.parent / "dist"


def run_evaluation(dataset_choice):
    """Generator: run LLM-as-a-Judge evaluation, yield (log, results_df).

    Reimplements the evaluation_runner workflow as a generator so that
    intermediate progress (which model/prompt is being evaluated) can be
    streamed to the Gradio UI.
    """
    dataset_map = {
        "S (22 Saetze)": "s",
        "M (200 Saetze)": "m",
        "L (2000 Saetze)": "l",
    }
    ds = dataset_map.get(dataset_choice, "s")

    base_dir = _get_base_dir()
    cache_dir = base_dir / "evaluation_results"

    log_lines = []
    results = []

    def log(msg):
        log_lines.append(msg)

    def make_df():
        if not results:
            return pd.DataFrame()
        ranked = sorted(results, key=lambda r: r.avg_gesamt, reverse=True)
        rows = []
        for i, r in enumerate(ranked, 1):
            rows.append({
                "Rang": i,
                "Modell": r.label,
                "Gesamt": f"{r.avg_gesamt:.2f}",
                "Grammatik": f"{r.avg_grammatik:.2f}",
                "Kohaerenz": f"{r.avg_kohaerenz:.2f}",
                "Relevanz": f"{r.avg_relevanz:.2f}",
            })
        return pd.DataFrame(rows)

    # ---- 1. Discover models ----
    log("Suche verfuegbare Modelle...")
    yield "\n".join(log_lines), make_df()

    from inference.inference_finetuned import (
        discover_models, load_model_by_type, generate_text,
    )

    available = discover_models(base_dir)

    lstm_dir = base_dir / "lstm_model"
    if (lstm_dir / "model.pt").exists():
        available["lstm"] = {
            "path": lstm_dir,
            "type": "lstm",
            "label": "LSTM (Basis-Training)",
        }

    if not available:
        log("Keine Modelle gefunden! Bitte erst trainieren.")
        yield "\n".join(log_lines), make_df()
        return

    log(f"{len(available)} Modell(e) gefunden:")
    for name, info in available.items():
        log(f"  - {name}: {info['label']}")
    yield "\n".join(log_lines), make_df()

    # ---- 2. Check cache ----
    from evaluation.evaluation_cache import (
        load_cache, save_cache, get_cached_result, update_cache,
    )

    cache = load_cache(cache_dir)
    cached_results = {}
    models_to_evaluate = {}

    for name, info in available.items():
        cached = get_cached_result(cache, name, info["path"])
        if cached:
            cached_results[name] = cached
            results.append(cached)
            log(f"  [{name}] Cache-Treffer")
        else:
            models_to_evaluate[name] = info

    yield "\n".join(log_lines), make_df()

    if not models_to_evaluate:
        log("\nAlle Modelle im Cache \u2014 keine Neubewertung noetig.")
        yield "\n".join(log_lines), make_df()
        return

    # ---- 3. Test LLM connection ----
    from evaluation.llm_client import test_connection, get_model_name

    log(f"\nJudge-Modell: {get_model_name()}")
    log(
        f"{len(models_to_evaluate)} Modell(e) neu bewerten, "
        f"{len(cached_results)} aus Cache..."
    )
    log("Pruefe LLM-Verbindung...")
    yield "\n".join(log_lines), make_df()

    if not test_connection():
        log("LLM-Verbindung fehlgeschlagen!")
        log("Bitte Ollama oder LM Studio starten und ein Modell laden.")
        yield "\n".join(log_lines), make_df()
        return

    log("LLM-Verbindung OK.")
    yield "\n".join(log_lines), make_df()

    # ---- 4. Evaluate uncached models ----
    from evaluation.judge_config import (
        DEFAULT_TEST_PROMPTS,
        GENERATION_TEMPERATURE,
        GENERATION_MAX_LENGTH,
        GeneratedOutput,
        ModelEvaluationResult,
    )
    from evaluation.judge import evaluate_single_output
    from training.data import TRAINING_DATA, TRAINING_DATA_M, TRAINING_DATA_L

    datasets_map = {
        "s": TRAINING_DATA, "m": TRAINING_DATA_M, "l": TRAINING_DATA_L,
    }
    training_set = {t.lower().strip() for t in datasets_map.get(ds, TRAINING_DATA)}

    for model_key, info in models_to_evaluate.items():
        try:
            log(f"\n[{model_key}] Lade {info['label']}...")
            yield "\n".join(log_lines), make_df()

            if info["type"] == "lstm":
                from training.training_lstm import load_model as load_lstm
                model, tokenizer = load_lstm(str(info["path"]))
            else:
                model, tokenizer = load_model_by_type(info, base_dir)
        except Exception as e:
            log(f"[{model_key}] Fehler beim Laden: {e}")
            yield "\n".join(log_lines), make_df()
            continue

        model_result = ModelEvaluationResult(
            model_name=model_key, label=info["label"],
        )

        for prompt_text in DEFAULT_TEST_PROMPTS:
            generated = generate_text(
                model, tokenizer, prompt_text,
                max_length=GENERATION_MAX_LENGTH,
                temperature=GENERATION_TEMPERATURE,
            )

            log(f"  [{info['label']}] '{prompt_text}' -> '{generated}'")
            log("  Bewerte...")
            yield "\n".join(log_lines), make_df()

            score = evaluate_single_output(prompt_text, generated)
            in_data = generated.lower().strip() in training_set

            output = GeneratedOutput(
                model_name=model_key,
                prompt=prompt_text,
                generated_text=generated,
                score=score,
                in_training_data=in_data,
            )
            model_result.outputs.append(output)

            if score:
                log(
                    f"  -> G:{score.grammatik_score} K:{score.kohaerenz_score} "
                    f"R:{score.relevanz_score} = {score.gesamt_score:.2f}"
                )
            else:
                log("  -> Bewertung fehlgeschlagen")
            yield "\n".join(log_lines), make_df()

        results.append(model_result)
        update_cache(cache, model_key, info["path"], model_result)
        yield "\n".join(log_lines), make_df()

    # ---- 5. Save cache + generate report ----
    save_cache(cache_dir, cache)

    try:
        from evaluation.evaluation_report import generate_evaluation_report
        generate_evaluation_report(results, cache_dir)
    except Exception:
        pass

    log("\nBewertung abgeschlossen!")
    yield "\n".join(log_lines), make_df()


def build_evaluation_tab():
    """Build the Evaluation tab UI components."""
    with gr.Tab("Bewertung"):
        gr.Markdown("### Modellqualitaet bewerten (LLM-as-a-Judge)")
        gr.Markdown(
            "Bewertet alle trainierten Modelle mit einem grossen LLM "
            "(Grammatik, Kohaerenz, Relevanz). "
            "Benoetigt laufendes Ollama oder LM Studio."
        )

        dataset = gr.Dropdown(
            choices=["S (22 Saetze)", "M (200 Saetze)", "L (2000 Saetze)"],
            value="L (2000 Saetze)",
            label="Trainingsdaten-Abgleich",
        )

        eval_btn = gr.Button("Bewertung starten", variant="primary")

        log = gr.Textbox(
            label="Status-Log", lines=12,
            interactive=False, autoscroll=True,
        )
        results_table = gr.Dataframe(label="Rangliste")

        eval_btn.click(
            fn=run_evaluation,
            inputs=[dataset],
            outputs=[log, results_table],
        )
