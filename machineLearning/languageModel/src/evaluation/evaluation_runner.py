"""
Evaluation Runner: LLM-as-a-Judge orchestration
=================================================

Workflow:
1. Test LLM connection
2. Discover models (Transformer + LSTM)
3. Check cache — skip models whose weights haven't changed
4. Load only uncached models, generate + evaluate
5. Update cache, print results, generate Markdown report

Cache: dist/evaluation_results/cache.json
       Keyed by model name + model.pt modification timestamp.

Usage:
    python src/main.py   # Option 9
"""

from pathlib import Path

from evaluation.judge_config import (
    DEFAULT_TEST_PROMPTS,
    GENERATION_TEMPERATURE,
    GENERATION_MAX_LENGTH,
    GeneratedOutput,
    ModelEvaluationResult,
)
from evaluation.llm_client import test_connection, get_model_name
from evaluation.judge import evaluate_single_output
from evaluation.evaluation_report import generate_evaluation_report
from evaluation.evaluation_cache import (
    load_cache,
    save_cache,
    get_cached_result,
    update_cache,
)
from inference.inference_finetuned import (
    discover_models,
    load_model_by_type,
    generate_text,
)
from training.data import TRAINING_DATA, TRAINING_DATA_M, TRAINING_DATA_L


# =============================================================================
# CONSOLE OUTPUT
# =============================================================================

def print_results_table(results: list[ModelEvaluationResult]):
    """Print evaluation results as a formatted table to the console."""
    ranked = sorted(results, key=lambda r: r.avg_gesamt, reverse=True)

    print("\n" + "=" * 80)
    print("BEWERTUNGSERGEBNISSE (LLM-as-a-Judge)")
    print("=" * 80)

    print(f"\n   {'Rang':<6} {'Modell':<28} {'Gesamt':>8} {'Gram.':>8} {'Koh.':>8} {'Rel.':>8}")
    print("   " + "-" * 72)

    for i, r in enumerate(ranked, 1):
        print(
            f"   {i:<6} {r.label:<28} {r.avg_gesamt:>8.2f} "
            f"{r.avg_grammatik:>8.2f} {r.avg_kohaerenz:>8.2f} {r.avg_relevanz:>8.2f}"
        )

    print()

    # Per-output details
    for r in ranked:
        print(f"\n   --- {r.label} ---")
        for o in r.outputs:
            match_tag = "[IN DATEN]" if o.in_training_data else "[NEU]"
            if o.score:
                print(
                    f"   Prompt: '{o.prompt}' -> '{o.generated_text}' "
                    f"{match_tag} "
                    f"[G:{o.score.grammatik_score} K:{o.score.kohaerenz_score} "
                    f"R:{o.score.relevanz_score} = {o.score.gesamt_score:.2f}]"
                )
                print(f"     Begruendung: {o.score.begruendung}")
            else:
                print(
                    f"   Prompt: '{o.prompt}' -> '{o.generated_text}' "
                    f"{match_tag} [Bewertung fehlgeschlagen]"
                )


# =============================================================================
# MAIN WORKFLOW
# =============================================================================

def _load_training_set(dataset: str) -> set[str]:
    """Load training data as a set of normalized sentences for lookup."""
    datasets = {"s": TRAINING_DATA, "m": TRAINING_DATA_M, "l": TRAINING_DATA_L}
    texts = datasets.get(dataset, TRAINING_DATA)
    return {t.lower().strip() for t in texts}


def main(dataset: str = "l"):
    """Run the full LLM-as-a-Judge evaluation pipeline.

    Args:
        dataset: Training dataset to check against ('s', 'm', 'l').
    """
    script_dir = Path(__file__).parent
    base_dir = script_dir.parent.parent / "dist"
    cache_dir = base_dir / "evaluation_results"

    training_set = _load_training_set(dataset)
    dataset_labels = {"s": "S (22)", "m": "M (200)", "l": "L (2000)"}

    print("=" * 70)
    print("LLM-AS-A-JUDGE: Modellqualitaet bewerten")
    print("=" * 70)
    print(f"\n   Trainingsdaten-Abgleich: {dataset_labels.get(dataset, dataset)} Saetze")

    # 1. Discover models (before LLM connection — fast)
    available = discover_models(base_dir)

    lstm_dir = base_dir / "lstm_model"
    if (lstm_dir / "model.pt").exists():
        available["lstm"] = {
            "path": lstm_dir,
            "type": "lstm",
            "label": "LSTM (Basis-Training)",
        }

    if not available:
        print("\n   [X] Keine Modelle gefunden!")
        print(f"   Erwartet in: {base_dir}")
        print("   Bitte erst trainieren (Option 1 oder 2).")
        return

    print(f"\n   Gefundene Modelle ({len(available)}):")
    for name, info in available.items():
        print(f"   - {name:<20} {info['label']}")

    # 2. Check cache — determine which models need evaluation
    cache = load_cache(cache_dir)
    cached_results = {}
    models_to_evaluate = {}

    for name, info in available.items():
        cached = get_cached_result(cache, name, info["path"])
        if cached:
            cached_results[name] = cached
            print(f"   [{name}] Cache-Treffer (unverändert)")
        else:
            models_to_evaluate[name] = info

    if not models_to_evaluate:
        print("\n   Alle Modelle im Cache — keine Neubewertung nötig.")
        results = list(cached_results.values())
        print_results_table(results)
        print(f"\n   Generiere Report...")
        generate_evaluation_report(results, cache_dir)
        print("\n" + "=" * 70)
        print("Bewertung abgeschlossen! (komplett aus Cache)")
        print("=" * 70)
        return

    # 3. Test LLM connection (only if we actually need to evaluate)
    print(f"\n   Judge-Modell: {get_model_name()}")
    print(f"   {len(models_to_evaluate)} Modell(e) neu bewerten, "
          f"{len(cached_results)} aus Cache...")
    print("   Prüfe LLM-Verbindung...")
    if not test_connection():
        print("\n   [X] Kein LLM-Provider erreichbar!")
        print("   Bitte Ollama oder LM Studio starten und ein Modell laden.")
        print("   Umgebungsvariablen:")
        print("     LLM_PROVIDER_URL  (default: http://localhost:1234/v1)")
        print("     LLM_MODEL         (default: qwen3:8b)")
        return
    print("   [OK] LLM-Verbindung erfolgreich.")

    # 4. Load + evaluate only uncached models
    prompts = DEFAULT_TEST_PROMPTS
    print(f"\n   Temperature: {GENERATION_TEMPERATURE}, Max. Länge: {GENERATION_MAX_LENGTH}")

    new_results = {}

    for model_key, info in models_to_evaluate.items():
        # Load model
        try:
            print(f"\n   [{model_key}] Lade {info['label']}...")
            if info["type"] == "lstm":
                from training.training_lstm import load_model as load_lstm
                model, tokenizer = load_lstm(str(info["path"]))
            else:
                model, tokenizer = load_model_by_type(info, base_dir)
        except Exception as e:
            print(f"   [{model_key}] Fehler beim Laden: {e}")
            continue

        # Evaluate
        model_result = ModelEvaluationResult(model_name=model_key, label=info["label"])

        for prompt in prompts:
            generated = generate_text(
                model, tokenizer, prompt,
                max_length=GENERATION_MAX_LENGTH,
                temperature=GENERATION_TEMPERATURE,
            )

            print(f"\n   [{info['label']}] '{prompt}' -> '{generated}'")
            print(f"   Bewerte...")
            score = evaluate_single_output(prompt, generated)

            in_data = generated.lower().strip() in training_set

            output = GeneratedOutput(
                model_name=model_key,
                prompt=prompt,
                generated_text=generated,
                score=score,
                in_training_data=in_data,
            )
            model_result.outputs.append(output)

            if score:
                print(
                    f"   -> G:{score.grammatik_score} K:{score.kohaerenz_score} "
                    f"R:{score.relevanz_score} = {score.gesamt_score:.2f}"
                )
            else:
                print("   -> Bewertung fehlgeschlagen")

        new_results[model_key] = model_result
        update_cache(cache, model_key, info["path"], model_result)

    # 5. Save cache
    save_cache(cache_dir, cache)
    print(f"\n   Cache aktualisiert ({len(new_results)} Modell(e) neu gespeichert).")

    # 6. Combine cached + new results, display + report
    results = list(cached_results.values()) + list(new_results.values())
    print_results_table(results)

    print(f"\n   Generiere Report...")
    generate_evaluation_report(results, cache_dir)

    print("\n" + "=" * 70)
    print("Bewertung abgeschlossen!")
    print("=" * 70)


if __name__ == "__main__":
    main()
