"""
Lernziele:
- LLM-Antworten automatisch mit einem zweiten LLM bewerten (LLM-as-Judge)
- Scores aus der Judge-Antwort parsen und validieren
- Bewertungen als Scores in Langfuse-Traces loggen

Voraussetzungen: .env mit LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST
                 LM Studio läuft auf http://localhost:1234/v1 mit Qwen3
"""

import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv
from langfuse import Langfuse
from openai import OpenAI
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_PATH)

console = Console()


def create_langfuse_client() -> Langfuse:
    """Create and verify a Langfuse client."""
    langfuse = Langfuse()

    if not langfuse.auth_check():
        console.print(
            "[red]Fehler: Langfuse-Authentifizierung fehlgeschlagen.[/red]\n"
            "Prüfe deine .env Datei (siehe .env.example)."
        )
        sys.exit(1)

    return langfuse


def create_lm_studio_client() -> OpenAI:
    """Create an OpenAI client pointing to LM Studio."""
    base_url = os.getenv("LM_STUDIO_BASE_URL", "http://localhost:1234/v1")
    return OpenAI(base_url=base_url, api_key="lm-studio")


def call_llm(client: OpenAI, model: str, messages: list[dict]) -> str:
    """Send a chat completion request to LM Studio."""
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7,
            max_tokens=512,
        )
        return response.choices[0].message.content
    except Exception as e:
        console.print(
            f"[red]Fehler bei der Verbindung zu LM Studio: {e}[/red]\n"
            "Stelle sicher, dass LM Studio läuft und ein Modell geladen ist."
        )
        sys.exit(1)


def parse_score(judge_response: str) -> float | None:
    """Extract a numeric score (1-10) from the judge response."""
    # Look for a number between 1 and 10
    numbers = re.findall(r"\b(10|[1-9])\b", judge_response)
    if numbers:
        return float(numbers[0])
    return None


def main() -> None:
    langfuse = create_langfuse_client()
    client = create_lm_studio_client()
    model = os.getenv("LM_STUDIO_MODEL", "qwen3")

    question = "Erkläre den Unterschied zwischen Supervised und Unsupervised Learning."

    console.print(Panel(question, title="Frage", border_style="blue"))

    # -- Root trace --
    trace = langfuse.start_span(
        name="llm-as-judge",
        input={"question": question},
        metadata={"evaluation_method": "llm-as-judge"},
    )

    # -- Step 1: Generate an answer --
    gen_span = trace.start_generation(
        name="answer-generation",
        model=model,
        input=[{"role": "user", "content": question}],
    )

    answer = call_llm(client, model, [{"role": "user", "content": question}])
    gen_span.update(output=answer)
    gen_span.end()

    console.print(Panel(answer, title="Antwort", border_style="green"))

    # -- Step 2: Judge the answer with a second LLM call --
    judge_prompt = (
        "Du bist ein strenger Qualitätsprüfer für KI-Antworten.\n\n"
        f"Frage: {question}\n\n"
        f"Antwort: {answer}\n\n"
        "Bewerte die Qualität der Antwort auf einer Skala von 1 bis 10.\n"
        "Kriterien: Korrektheit, Vollständigkeit, Verständlichkeit.\n"
        "Antworte NUR mit einer einzigen Zahl zwischen 1 und 10."
    )

    judge_gen = trace.start_generation(
        name="judge-evaluation",
        model=model,
        input=[{"role": "user", "content": judge_prompt}],
        metadata={"role": "judge"},
    )

    judge_response = call_llm(
        client, model, [{"role": "user", "content": judge_prompt}]
    )
    judge_gen.update(output=judge_response)
    judge_gen.end()

    # -- Step 3: Parse and log the score --
    score = parse_score(judge_response)

    if score is not None:
        normalized_score = score / 10.0
        trace.score_trace(
            name="quality",
            value=normalized_score,
            comment=f"LLM-as-Judge Rohwert: {score}/10",
        )

    trace.update(
        output={
            "answer": answer,
            "judge_response": judge_response,
            "score": score,
        }
    )
    trace.end()
    langfuse.flush()

    # -- Step 4: Display results --
    table = Table(title="Bewertungsergebnis")
    table.add_column("Metrik", style="bold")
    table.add_column("Wert")

    table.add_row("Judge-Antwort (roh)", judge_response.strip())
    table.add_row(
        "Erkannter Score",
        f"{score:.0f}/10" if score else "Nicht erkannt",
    )
    table.add_row(
        "Normalisierter Score",
        f"{score / 10:.1f}" if score else "N/A",
    )

    trace_url = langfuse.get_trace_url()
    if trace_url:
        table.add_row("Langfuse Trace", trace_url)

    console.print()
    console.print(table)

    langfuse.shutdown()


if __name__ == "__main__":
    main()
