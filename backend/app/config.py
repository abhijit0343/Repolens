"""Configuration management for RepoLens using pydantic-settings.

Validates essential API keys (GEMINI_API_KEY, TAVILY_API_KEY) and provides
typed settings across backend services.
"""
import os
import sys
from pathlib import Path
from typing import List
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # LLM & Embedding Settings
    gemini_api_key: str = Field(..., alias="GEMINI_API_KEY")
    llm_model: str = Field("gemini-2.5-flash", alias="LLM_MODEL")
    embedding_model: str = Field("models/gemini-embedding-001", alias="EMBEDDING_MODEL")

    # Search & External API Keys
    tavily_api_key: str = Field(..., alias="TAVILY_API_KEY")
    github_token: str = Field("", alias="GITHUB_TOKEN")

    # Security & Guardrails
    allowed_domains: str = Field(
        "github.com,stackoverflow.com,docs.python.org,developer.mozilla.org",
        alias="ALLOWED_DOMAINS",
    )

    # LangSmith Observability
    langsmith_tracing: bool = Field(True, alias="LANGSMITH_TRACING")
    langsmith_api_key: str = Field("", alias="LANGSMITH_API_KEY")
    langsmith_project: str = Field("repolens", alias="LANGSMITH_PROJECT")
    langsmith_endpoint: str = Field(
        "https://api.smith.langchain.com", alias="LANGSMITH_ENDPOINT"
    )

    # Data Storage Paths
    data_dir: str = Field("./data", alias="DATA_DIR")
    sqlite_path: str = Field("./data/repolens.db", alias="SQLITE_PATH")

    # Limits & Budgets
    max_files: int = Field(2000, alias="MAX_FILES")
    max_file_kb: int = Field(200, alias="MAX_FILE_KB")
    max_agent_steps: int = Field(12, alias="MAX_AGENT_STEPS")
    max_searches: int = Field(5, alias="MAX_SEARCHES")
    max_tokens_per_session: int = Field(20000, alias="MAX_TOKENS_PER_SESSION")
    request_timeout_s: int = Field(60, alias="REQUEST_TIMEOUT_S")

    # Server & Networking
    cors_origins: str = Field("http://localhost:5173", alias="CORS_ORIGINS")
    port: int = Field(8000, alias="PORT")

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("gemini_api_key")
    @classmethod
    def validate_gemini_key(cls, v: str) -> str:
        cleaned = v.strip() if v else ""
        if not cleaned:
            raise ValueError(
                "CRITICAL: GEMINI_API_KEY is missing or empty in backend/.env. "
                "RepoLens requires a valid Google Gemini API key to operate."
            )
        return cleaned

    @field_validator("tavily_api_key")
    @classmethod
    def validate_tavily_key(cls, v: str) -> str:
        cleaned = v.strip() if v else ""
        if not cleaned:
            raise ValueError(
                "CRITICAL: TAVILY_API_KEY is missing or empty in backend/.env. "
                "RepoLens requires a valid Tavily API key for web documentation retrieval."
            )
        return cleaned

    @property
    def allowed_domains_list(self) -> List[str]:
        return [d.strip() for d in self.allowed_domains.split(",") if d.strip()]

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def repos_dir(self) -> Path:
        p = Path(self.data_dir) / "repos"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def chroma_dir(self) -> Path:
        p = Path(self.data_dir) / "chroma"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def graphs_dir(self) -> Path:
        p = Path(self.data_dir) / "graphs"
        p.mkdir(parents=True, exist_ok=True)
        return p


try:
    settings = Settings()
    if settings.langsmith_tracing and settings.langsmith_api_key:
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_API_KEY"] = settings.langsmith_api_key
        os.environ["LANGCHAIN_PROJECT"] = settings.langsmith_project
        os.environ["LANGCHAIN_ENDPOINT"] = settings.langsmith_endpoint
except Exception as exc:
    # Allow import errors during setup/tests to show descriptive diagnostics
    print(f"[CONFIG ERROR] {exc}", file=sys.stderr)
    raise exc
