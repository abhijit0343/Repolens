"""Gemini LLM and Embeddings setup for RepoLens.

Uses langchain-google-genai as the sole LLM & embeddings provider.
Includes tagged_llm helper for granular LangSmith observability per agent.
"""
from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from backend.app.config import settings


def get_llm(temperature: float = 0.2) -> ChatGoogleGenerativeAI:
    """Instantiate the primary Gemini chat model."""
    return ChatGoogleGenerativeAI(
        model=settings.llm_model,
        google_api_key=settings.gemini_api_key,
        temperature=temperature,
        convert_system_message_to_human=False,
    )


def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    """Instantiate the Google Generative AI embeddings model."""
    return GoogleGenerativeAIEmbeddings(
        model=settings.embedding_model,
        google_api_key=settings.gemini_api_key,
    )


def get_tagged_llm(agent_name: str, temperature: float = 0.2):
    """Return an LLM instance tagged for individual agent tracing in LangSmith."""
    base_llm = get_llm(temperature=temperature)
    return base_llm.with_config(
        run_name=f"agent_{agent_name}",
        tags=[agent_name, "repolens", settings.llm_model],
        metadata={"agent": agent_name, "project": "repolens"},
    )
