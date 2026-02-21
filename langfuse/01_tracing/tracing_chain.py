"""
Lernziele:
- Eine mehrstufige Verarbeitungskette (Chain) mit Langfuse tracen
- Nested Spans (Parent-Child-Beziehungen) verstehen und anwenden
- Input/Output jedes Verarbeitungsschritts separat loggen

Voraussetzungen: .env mit LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST
                 LM Studio läuft auf http://localhost:1234/v1 mit Qwen3
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from langfuse import Langfuse
from openai import OpenAI

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_PATH)


def create_langfuse_client() -> Langfuse:
    """Create and verify a Langfuse client."""
    langfuse = Langfuse()

    if not langfuse.auth_check():
        print(
            "Fehler: Langfuse-Authentifizierung fehlgeschlagen.\n"
            "Prüfe deine .env Datei (siehe .env.example).",
            file=sys.stderr,
        )
        sys.exit(1)

    return langfuse


def create_lm_studio_client() -> OpenAI:
    """Create an OpenAI client pointing to LM Studio."""
    base_url = os.getenv("LM_STUDIO_BASE_URL", "http://localhost:1234/v1")
    return OpenAI(base_url=base_url, api_key="lm-studio")


def preprocess(text: str) -> str:
    """Normalize input: strip whitespace and lowercase."""
    return text.strip().lower()


def postprocess(text: str) -> str:
    """Extract the first line of the LLM response."""
    first_line = text.strip().split("\n")[0]
    return first_line


def main() -> None:
    langfuse = create_langfuse_client()
    client = create_lm_studio_client()
    model = os.getenv("LM_STUDIO_MODEL", "qwen3")

    raw_input = "  Was sind die DREI wichtigsten Programmiersprachen?  "
    print(f"Rohe Eingabe: '{raw_input}'\n")

    # -- Root trace for the entire chain --
    trace = langfuse.start_span(
        name="processing-chain",
        input={"raw_input": raw_input},
        metadata={"steps": ["input-processing", "llm-call", "output-processing"]},
    )

    # -- Step 1: Input processing (child span) --
    input_span = trace.start_span(name="input-processing", input={"raw": raw_input})
    processed_input = preprocess(raw_input)
    input_span.update(output={"processed": processed_input})
    input_span.end()
    print(f"Nach Vorverarbeitung: '{processed_input}'")

    # -- Step 2: LLM call (generation inside trace) --
    messages = [{"role": "user", "content": processed_input}]
    generation = trace.start_generation(
        name="llm-call",
        model=model,
        input=messages,
        model_parameters={"temperature": 0.7, "max_tokens": 256},
    )

    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
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
            "Stelle sicher, dass LM Studio läuft.",
            file=sys.stderr,
        )
        sys.exit(1)

    llm_output = response.choices[0].message.content
    usage = response.usage

    usage_details = {}
    if usage:
        usage_details = {
            "input": usage.prompt_tokens,
            "output": usage.completion_tokens,
            "total": usage.total_tokens,
        }

    generation.update(output=llm_output, usage_details=usage_details)
    generation.end()
    print(f"\nLLM-Antwort (vollständig):\n{llm_output}\n")

    # -- Step 3: Output processing (child span) --
    output_span = trace.start_span(
        name="output-processing", input={"full_response": llm_output}
    )
    final_output = postprocess(llm_output)
    output_span.update(output={"first_line": final_output})
    output_span.end()

    # -- End trace --
    trace.update(output={"final_output": final_output})
    trace.end()
    langfuse.flush()

    print(f"Ergebnis (erste Zeile): '{final_output}'")

    trace_url = langfuse.get_trace_url()
    if trace_url:
        print(f"\nTrace in Langfuse: {trace_url}")

    langfuse.shutdown()


if __name__ == "__main__":
    main()
