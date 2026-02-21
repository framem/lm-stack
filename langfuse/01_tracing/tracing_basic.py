"""
Lernziele:
- Langfuse initialisieren und mit Credentials verbinden
- Einen einfachen LLM-Call als Trace + Generation loggen
- Input, Output, Modell und Token-Usage in Langfuse sichtbar machen

Voraussetzungen: .env mit LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST
                 LM Studio läuft auf http://localhost:1234/v1 mit Qwen3
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from langfuse import Langfuse
from openai import OpenAI

# Load .env from project root
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_PATH)


def create_langfuse_client() -> Langfuse:
    """Create and verify a Langfuse client from environment variables."""
    langfuse = Langfuse()

    if not langfuse.auth_check():
        print(
            "Fehler: Langfuse-Authentifizierung fehlgeschlagen.\n"
            "Bitte prüfe LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY und "
            "LANGFUSE_HOST in deiner .env Datei.",
            file=sys.stderr,
        )
        if not ENV_PATH.exists():
            print(
                f"Hinweis: Keine .env gefunden unter {ENV_PATH}\n"
                "Kopiere .env.example nach .env und trage deine Credentials ein.",
                file=sys.stderr,
            )
        sys.exit(1)

    return langfuse


def create_lm_studio_client() -> OpenAI:
    """Create an OpenAI client pointing to LM Studio."""
    base_url = os.getenv("LM_STUDIO_BASE_URL", "http://localhost:1234/v1")
    return OpenAI(base_url=base_url, api_key="lm-studio")


def main() -> None:
    langfuse = create_langfuse_client()
    client = create_lm_studio_client()
    model = os.getenv("LM_STUDIO_MODEL", "qwen3")

    question = "Was ist maschinelles Lernen? Erkläre es in 2-3 Sätzen."
    print(f"Frage: {question}\n")

    # -- Step 1: Start a trace (top-level span) --
    trace = langfuse.start_span(name="simple-question", input={"question": question})

    # -- Step 2: Start a generation inside the trace --
    generation = trace.start_generation(
        name="qwen3-response",
        model=model,
        input=[{"role": "user", "content": question}],
        model_parameters={"temperature": 0.7, "max_tokens": 256},
    )

    # -- Step 3: Call LM Studio --
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": question}],
            temperature=0.7,
            max_tokens=256,
        )
    except Exception as e:
        generation.update(output=f"Fehler: {e}", level="ERROR")
        generation.end()
        trace.end()
        langfuse.flush()
        print(
            f"Fehler bei der Verbindung zu LM Studio: {e}\n"
            "Stelle sicher, dass LM Studio läuft und ein Modell geladen ist.",
            file=sys.stderr,
        )
        sys.exit(1)

    answer = response.choices[0].message.content
    usage = response.usage

    # -- Step 4: Update generation with output and usage --
    usage_details = {}
    if usage:
        usage_details = {
            "input": usage.prompt_tokens,
            "output": usage.completion_tokens,
            "total": usage.total_tokens,
        }

    generation.update(output=answer, usage_details=usage_details)
    generation.end()

    # -- Step 5: End trace and flush --
    trace.update(output={"answer": answer})
    trace.end()
    langfuse.flush()

    # -- Step 6: Print results --
    print(f"Antwort: {answer}\n")
    if usage_details:
        print(
            f"Token-Verbrauch: {usage_details.get('input', '?')} input, "
            f"{usage_details.get('output', '?')} output, "
            f"{usage_details.get('total', '?')} total"
        )

    trace_url = langfuse.get_trace_url()
    if trace_url:
        print(f"\nTrace in Langfuse: {trace_url}")

    langfuse.shutdown()


if __name__ == "__main__":
    main()
