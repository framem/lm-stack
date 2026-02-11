"""
LLM client for Ollama / LM Studio
===================================

Thin wrapper around the OpenAI library. Both Ollama and LM Studio
expose an OpenAI-compatible API, so this client works with either.

Environment variables:
    LLM_PROVIDER_URL  - API base URL (default: http://localhost:1234/v1)
    LLM_MODEL         - Model name  (default: qwen3:8b)
"""

import os
import re
import json

from openai import OpenAI


# =============================================================================
# CLIENT CONFIGURATION
# =============================================================================

def get_llm_client() -> OpenAI:
    """Create an OpenAI client pointing at the local LLM provider."""
    base_url = os.environ.get("LLM_PROVIDER_URL", "http://localhost:1234/v1")
    return OpenAI(base_url=base_url, api_key="not-needed")


def get_model_name() -> str:
    """Read the model name from the environment variable."""
    return os.environ.get("LLM_MODEL", "qwen3:8b")


# =============================================================================
# LLM CALL
# =============================================================================

def call_judge_llm(system_prompt: str, user_prompt: str) -> dict:
    """
    Call the judge LLM and return the JSON response as a dict.

    Uses response_format=json_object for structured output.
    Falls back to regex-based JSON extraction on parse errors.
    """
    client = get_llm_client()
    model = get_model_name()

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.1,
    )

    content = response.choices[0].message.content.strip()

    # Primary: direct JSON parsing
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    # Fallback: extract JSON block via regex
    match = re.search(r"\{[\s\S]*\}", content)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not extract valid JSON from LLM response:\n{content}")


def test_connection() -> bool:
    """Check whether the LLM provider is reachable."""
    try:
        client = get_llm_client()
        model = get_model_name()
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Antworte nur mit: ok"}],
            max_tokens=5,
        )
        return bool(response.choices[0].message.content)
    except Exception as e:
        print(f"   [X] LLM connection failed: {e}")
        return False
