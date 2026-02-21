"""
Lernziele:
- Eine einfache RAG-Pipeline (Retrieval-Augmented Generation) aufbauen
- Keyword-basiertes Retrieval ohne Vektor-Datenbank implementieren
- Jeden Pipeline-Schritt einzeln in Langfuse tracen (Retrieval, Augmentation, Generation)
- Nested Spans für mehrstufige Pipelines nutzen

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

# Knowledge base: short text collection about AI
DOCUMENTS = [
    "Künstliche Intelligenz (KI) ist ein Teilgebiet der Informatik, das sich mit der "
    "Automatisierung intelligenten Verhaltens befasst.",
    "Machine Learning ist eine Methode der KI, bei der Algorithmen aus Daten lernen, "
    "anstatt explizit programmiert zu werden.",
    "Deep Learning nutzt künstliche neuronale Netze mit vielen Schichten, um komplexe "
    "Muster in großen Datenmengen zu erkennen.",
    "Natural Language Processing (NLP) ermöglicht es Computern, menschliche Sprache "
    "zu verstehen, zu interpretieren und zu generieren.",
    "Reinforcement Learning ist ein Lernparadigma, bei dem ein Agent durch Versuch "
    "und Irrtum in einer Umgebung optimale Strategien erlernt.",
]


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


def retrieve(query: str, documents: list[str], top_k: int = 2) -> list[str]:
    """Simple keyword-based retrieval: score documents by keyword overlap."""
    query_words = set(query.lower().split())

    scored = []
    for doc in documents:
        doc_words = set(doc.lower().split())
        overlap = len(query_words & doc_words)
        scored.append((overlap, doc))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [doc for score, doc in scored[:top_k] if score > 0]


def augment_prompt(query: str, chunks: list[str]) -> str:
    """Build an augmented prompt from the query and retrieved chunks."""
    context = "\n\n".join(f"- {chunk}" for chunk in chunks)
    return (
        "Beantworte die folgende Frage basierend auf dem gegebenen Kontext.\n"
        "Nutze nur Informationen aus dem Kontext. "
        "Wenn der Kontext die Frage nicht beantwortet, sage das ehrlich.\n\n"
        f"Kontext:\n{context}\n\n"
        f"Frage: {query}"
    )


def main() -> None:
    langfuse = create_langfuse_client()
    client = create_lm_studio_client()
    model = os.getenv("LM_STUDIO_MODEL", "qwen3")

    query = "Was ist Machine Learning und wie unterscheidet es sich von Deep Learning?"
    print(f"Frage: {query}\n")

    # -- Root trace for the RAG pipeline --
    trace = langfuse.start_span(
        name="rag-pipeline",
        input={"query": query, "num_documents": len(DOCUMENTS)},
    )

    # -- Step 1: Retrieval --
    retrieval_span = trace.start_span(
        name="retrieval",
        input={"query": query, "top_k": 2},
    )

    chunks = retrieve(query, DOCUMENTS, top_k=2)

    retrieval_span.update(
        output={"chunks": chunks, "num_found": len(chunks)},
    )
    retrieval_span.end()

    print(f"Gefundene Chunks ({len(chunks)}):")
    for i, chunk in enumerate(chunks, 1):
        print(f"  {i}. {chunk[:80]}...")
    print()

    # -- Step 2: Augmentation --
    augmentation_span = trace.start_span(
        name="augmentation",
        input={"query": query, "chunks": chunks},
    )

    augmented_prompt = augment_prompt(query, chunks)

    augmentation_span.update(output={"augmented_prompt": augmented_prompt})
    augmentation_span.end()

    print(f"Augmentierter Prompt:\n{augmented_prompt}\n")

    # -- Step 3: Generation --
    messages = [{"role": "user", "content": augmented_prompt}]
    generation = trace.start_generation(
        name="llm-call",
        model=model,
        input=messages,
        model_parameters={"temperature": 0.3, "max_tokens": 512},
    )

    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.3,
            max_tokens=512,
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

    # -- End trace --
    trace.update(
        output={
            "answer": answer,
            "chunks_used": len(chunks),
        }
    )
    trace.end()
    langfuse.flush()

    print(f"Antwort:\n{answer}\n")

    if usage_details:
        print(
            f"Token-Verbrauch: {usage_details.get('input', '?')} input, "
            f"{usage_details.get('output', '?')} output"
        )

    trace_url = langfuse.get_trace_url()
    if trace_url:
        print(f"\nTrace in Langfuse: {trace_url}")

    langfuse.shutdown()


if __name__ == "__main__":
    main()
