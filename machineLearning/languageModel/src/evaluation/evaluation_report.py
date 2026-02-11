"""
Evaluation Report Generator
============================

Generates a Markdown report with LLM-as-a-Judge evaluation results
for all MiniGPT models.

Saves to dist/evaluation_results/EVALUATION_REPORT.md
"""

from pathlib import Path
from evaluation.judge_config import ModelEvaluationResult


def generate_evaluation_report(results: list[ModelEvaluationResult], save_dir: Path) -> str:
    """
    Build a Markdown report and write it to disk.

    Args:
        results: List of ModelEvaluationResult (one entry per model).
        save_dir: Target directory (e.g. dist/evaluation_results/).

    Returns:
        The report as a string.
    """
    save_dir = Path(save_dir)
    save_dir.mkdir(parents=True, exist_ok=True)

    # Sort by overall score (descending)
    ranked = sorted(results, key=lambda r: r.avg_gesamt, reverse=True)

    report = _build_header()
    report += _build_ranking_table(ranked)
    report += _build_criteria_table(ranked)
    report += _build_detail_section(ranked)
    report += _build_footer()

    report_path = save_dir / "EVALUATION_REPORT.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"   Report gespeichert: {report_path}")
    return report


# =============================================================================
# REPORT BUILDING BLOCKS
# =============================================================================

def _build_header() -> str:
    return """# LLM-as-a-Judge: Evaluierungsbericht

## Methode

Ein großes LLM (Judge) bewertet die Outputs der kleinen MiniGPT-Modelle
auf drei Kriterien (je 1-5):

| Kriterium | Beschreibung |
|-----------|--------------|
| **Grammatik** | Korrektheit der Satzstruktur |
| **Kohärenz** | Logischer Zusammenhang der Wörter |
| **Relevanz** | Bezug zum Eingabe-Prompt |

"""


def _build_ranking_table(ranked: list[ModelEvaluationResult]) -> str:
    lines = ["## Ranking (nach Gesamtscore)\n"]
    lines.append("| Rang | Modell | Gesamt | Grammatik | Kohärenz | Relevanz |")
    lines.append("|------|--------|--------|-----------|----------|----------|")

    for i, r in enumerate(ranked, 1):
        lines.append(
            f"| {i} | **{r.label}** | **{r.avg_gesamt:.2f}** "
            f"| {r.avg_grammatik:.2f} | {r.avg_kohaerenz:.2f} | {r.avg_relevanz:.2f} |"
        )

    lines.append("")
    return "\n".join(lines) + "\n"


def _build_criteria_table(ranked: list[ModelEvaluationResult]) -> str:
    lines = ["## Detailvergleich pro Kriterium\n"]

    for criterion, accessor in [
        ("Grammatik", "avg_grammatik"),
        ("Kohärenz", "avg_kohaerenz"),
        ("Relevanz", "avg_relevanz"),
    ]:
        lines.append(f"### {criterion}\n")
        lines.append("| Modell | Score |")
        lines.append("|--------|-------|")
        for r in ranked:
            val = getattr(r, accessor)
            lines.append(f"| {r.label} | {val:.2f} |")
        lines.append("")

    return "\n".join(lines) + "\n"


def _build_detail_section(ranked: list[ModelEvaluationResult]) -> str:
    lines = ["## Einzelergebnisse\n"]

    for r in ranked:
        lines.append(f"### {r.label}\n")

        lines.append(
            "| Prompt | Generierter Text | In Daten? | Gram. | Koh. | Rel. | Gesamt | Begründung |"
        )
        lines.append(
            "|--------|-----------------|-----------|-------|------|------|--------|------------|"
        )

        for o in r.outputs:
            match_icon = "Ja" if o.in_training_data else "Nein"
            if o.score:
                lines.append(
                    f"| {o.prompt} | {o.generated_text} | {match_icon} "
                    f"| {o.score.grammatik_score} | {o.score.kohaerenz_score} "
                    f"| {o.score.relevanz_score} | {o.score.gesamt_score:.2f} "
                    f"| {o.score.begruendung} |"
                )
            else:
                lines.append(
                    f"| {o.prompt} | {o.generated_text} | {match_icon} "
                    f"| - | - | - | - | Bewertung fehlgeschlagen |"
                )

        lines.append("")

    return "\n".join(lines) + "\n"


def _build_footer() -> str:
    return """---

*Generiert mit LLM-as-a-Judge. Die Bewertungen sind subjektiv und abhängig
vom verwendeten Judge-Modell. Für robustere Ergebnisse sollten mehrere
Judge-Modelle oder menschliche Evaluierung hinzugezogen werden.*
"""


