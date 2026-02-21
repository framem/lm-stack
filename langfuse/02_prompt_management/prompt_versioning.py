"""
Lernziele:
- Prompts in Langfuse erstellen und versionieren
- Prompts mit Labels (z.B. "production") abrufen
- Prompt-Variablen mit compile() einsetzen
- Versionierte Prompts für LLM-Calls verwenden

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


def main() -> None:
    langfuse = create_langfuse_client()
    client = create_lm_studio_client()
    model = os.getenv("LM_STUDIO_MODEL", "qwen3")

    # -- Step 1: Create a prompt template in Langfuse --
    prompt_name = "erklaer-konzept"
    prompt_template = (
        "Erkläre das Konzept '{{concept}}' für eine Zielgruppe: {{audience}}. "
        "Halte die Erklärung auf {{length}} Sätze begrenzt."
    )

    print("Erstelle Prompt-Template in Langfuse...")
    prompt = langfuse.create_prompt(
        name=prompt_name,
        prompt=prompt_template,
        labels=["production"],
        config={"temperature": 0.7, "max_tokens": 256},
    )
    print(f"  Name: {prompt_name}")
    print(f"  Template: {prompt_template}")
    print(f"  Labels: ['production']")

    # -- Step 2: Fetch the prompt from Langfuse by label --
    print("\nRufe Prompt von Langfuse ab (Label: 'production')...")
    fetched_prompt = langfuse.get_prompt(prompt_name, label="production")
    print(f"  Abgerufener Prompt: {fetched_prompt.prompt}")

    # -- Step 3: Compile the prompt with variables --
    compiled = fetched_prompt.compile(
        concept="Neuronale Netze",
        audience="Programmier-Anfänger",
        length="3",
    )
    print(f"\nKompilierter Prompt:\n  {compiled}\n")

    # -- Step 4: Use compiled prompt for LLM call with tracing --
    trace = langfuse.start_span(
        name="prompt-versioning-demo",
        input={"prompt_name": prompt_name, "compiled_prompt": compiled},
    )

    generation = trace.start_generation(
        name="qwen3-response",
        model=model,
        input=[{"role": "user", "content": compiled}],
        prompt=fetched_prompt,  # Links generation to the Langfuse prompt version
        model_parameters={"temperature": 0.7, "max_tokens": 256},
    )

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": compiled}],
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

    answer = response.choices[0].message.content
    usage = response.usage

    usage_details = {}
    if usage:
        usage_details = {
            "input": usage.prompt_tokens,
            "output": usage.completion_tokens,
            "total": usage.total_tokens,
        }

    generation.update(output=answer, usage_details=usage_details)
    generation.end()
    trace.update(output={"answer": answer})
    trace.end()
    langfuse.flush()

    print(f"Antwort:\n  {answer}\n")

    trace_url = langfuse.get_trace_url()
    if trace_url:
        print(f"Trace in Langfuse: {trace_url}")

    langfuse.shutdown()


if __name__ == "__main__":
    main()
