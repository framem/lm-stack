"""
Configuration and data classes for LLM-as-a-Judge
==================================================

Defines evaluation criteria, scores and test prompts
for automated quality assessment of MiniGPT outputs.
"""

from dataclasses import dataclass, field
from typing import Optional


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class EvaluationScore:
    """Evaluation result for a single generated text."""
    grammatik_score: int  # 1-5
    kohaerenz_score: int  # 1-5
    relevanz_score: int   # 1-5
    begruendung: str
    gesamt_score: float   # Average of the three scores

    @staticmethod
    def from_dict(data: dict) -> "EvaluationScore":
        grammatik = int(data.get("grammatik_score", 1))
        kohaerenz = int(data.get("kohaerenz_score", 1))
        relevanz = int(data.get("relevanz_score", 1))
        begruendung = str(data.get("begruendung", ""))
        gesamt = round((grammatik + kohaerenz + relevanz) / 3, 2)
        return EvaluationScore(
            grammatik_score=grammatik,
            kohaerenz_score=kohaerenz,
            relevanz_score=relevanz,
            begruendung=begruendung,
            gesamt_score=gesamt,
        )


@dataclass
class GeneratedOutput:
    """A generated text with an optional evaluation score."""
    model_name: str
    prompt: str
    generated_text: str
    score: Optional[EvaluationScore] = None
    in_training_data: bool = False


@dataclass
class ModelEvaluationResult:
    """Aggregated evaluation result for one model across all prompts."""
    model_name: str
    label: str
    outputs: list = field(default_factory=list)  # List of GeneratedOutput

    @property
    def avg_grammatik(self) -> float:
        scored = [o.score.grammatik_score for o in self.outputs if o.score]
        return round(sum(scored) / len(scored), 2) if scored else 0.0

    @property
    def avg_kohaerenz(self) -> float:
        scored = [o.score.kohaerenz_score for o in self.outputs if o.score]
        return round(sum(scored) / len(scored), 2) if scored else 0.0

    @property
    def avg_relevanz(self) -> float:
        scored = [o.score.relevanz_score for o in self.outputs if o.score]
        return round(sum(scored) / len(scored), 2) if scored else 0.0

    @property
    def avg_gesamt(self) -> float:
        scored = [o.score.gesamt_score for o in self.outputs if o.score]
        return round(sum(scored) / len(scored), 2) if scored else 0.0


# =============================================================================
# CONSTANTS
# =============================================================================

DEFAULT_TEST_PROMPTS = [
    "die katze",
    "der hund",
    "das kind spielt",
    "die sonne scheint",
    "der mann liest",
]

GENERATION_TEMPERATURE = 0.5
GENERATION_MAX_LENGTH = 12
JUDGE_TEMPERATURE = 0.1
