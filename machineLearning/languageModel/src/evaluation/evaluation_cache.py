"""
Evaluation result cache.

Stores evaluation results as JSON keyed by model name and model file
modification timestamp. A cache hit avoids expensive LLM judge calls.

Cache file: dist/evaluation_results/cache.json
"""

import json
from pathlib import Path

from evaluation.judge_config import (
    EvaluationScore,
    GeneratedOutput,
    ModelEvaluationResult,
)

CACHE_FILENAME = "cache.json"


# =============================================================================
# MODEL FINGERPRINTING
# =============================================================================

def get_model_mtime(model_path: Path) -> float:
    """Return the modification timestamp of the primary model weight file."""
    for name in ("model.pt", "lora_weights.pt"):
        weight_file = model_path / name
        if weight_file.exists():
            return weight_file.stat().st_mtime
    return 0.0


# =============================================================================
# SERIALIZATION
# =============================================================================

def _score_to_dict(score: EvaluationScore) -> dict:
    return {
        "grammatik_score": score.grammatik_score,
        "kohaerenz_score": score.kohaerenz_score,
        "relevanz_score": score.relevanz_score,
        "begruendung": score.begruendung,
        "gesamt_score": score.gesamt_score,
    }


def _output_to_dict(output: GeneratedOutput) -> dict:
    return {
        "model_name": output.model_name,
        "prompt": output.prompt,
        "generated_text": output.generated_text,
        "score": _score_to_dict(output.score) if output.score else None,
    }


def _result_to_dict(result: ModelEvaluationResult, mtime: float) -> dict:
    return {
        "model_name": result.model_name,
        "label": result.label,
        "mtime": mtime,
        "outputs": [_output_to_dict(o) for o in result.outputs],
    }


def _dict_to_result(data: dict) -> ModelEvaluationResult:
    outputs = []
    for o in data["outputs"]:
        score = EvaluationScore.from_dict(o["score"]) if o.get("score") else None
        outputs.append(GeneratedOutput(
            model_name=o["model_name"],
            prompt=o["prompt"],
            generated_text=o["generated_text"],
            score=score,
        ))
    return ModelEvaluationResult(
        model_name=data["model_name"],
        label=data["label"],
        outputs=outputs,
    )


# =============================================================================
# CACHE I/O
# =============================================================================

def load_cache(cache_dir: Path) -> dict:
    """Load the cache file. Returns dict keyed by model_name."""
    cache_path = cache_dir / CACHE_FILENAME
    if not cache_path.exists():
        return {}
    try:
        with open(cache_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def save_cache(cache_dir: Path, cache: dict):
    """Write the cache dict to disk."""
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_path = cache_dir / CACHE_FILENAME
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)


def get_cached_result(
    cache: dict, model_key: str, model_path: Path
) -> ModelEvaluationResult | None:
    """Return cached result if the model hasn't changed, else None."""
    entry = cache.get(model_key)
    if not entry:
        return None

    current_mtime = get_model_mtime(model_path)
    if current_mtime != entry.get("mtime", 0):
        return None

    return _dict_to_result(entry)


def update_cache(
    cache: dict, model_key: str, model_path: Path, result: ModelEvaluationResult
):
    """Store a result in the cache dict (call save_cache afterwards)."""
    mtime = get_model_mtime(model_path)
    cache[model_key] = _result_to_dict(result, mtime)
