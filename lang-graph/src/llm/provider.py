import os

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama

load_dotenv()


def get_llm():
    """Get configured LLM based on environment variables."""
    provider = os.getenv("LLM_PROVIDER", "lmstudio")
    model = os.getenv("LLM_MODEL", "qwen3:8b")
    base_url = os.getenv("LLM_PROVIDER_URL")

    match provider:
        case "lmstudio":
            return ChatOpenAI(
                model=model,
                base_url=base_url or "http://localhost:1234/v1",
                api_key="not-needed",
            )
        case "ollama":
            return ChatOllama(
                model=model,
                base_url=base_url or "http://localhost:11434",
            )
        case "gateway":
            return ChatOpenAI(
                model=model,
                api_key=os.getenv("AI_GATEWAY_API_KEY"),
                base_url=base_url,
            )
        case _:
            raise ValueError(f"Unknown LLM provider: {provider}")
