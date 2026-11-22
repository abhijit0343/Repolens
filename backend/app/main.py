"""FastAPI entry point for RepoLens backend."""
import sys
from pathlib import Path

# Ensure project root is in sys.path so "backend.app..." imports resolve from any CWD
_root = str(Path(__file__).resolve().parent.parent.parent)
_backend = str(Path(__file__).resolve().parent.parent)
if _root not in sys.path:
    sys.path.insert(0, _root)
if _backend not in sys.path:
    sys.path.insert(0, _backend)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.db.repos import init_db
from backend.app.api.repos import router as repos_router
from backend.app.api.graph import router as graph_router
from backend.app.api.ask import router as ask_router


# Initialize database on startup
init_db(settings.sqlite_path)

app = FastAPI(
    title="RepoLens API",
    description="Deep agent codebase exploration with GraphRAG and cited answers",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(repos_router)
app.include_router(graph_router)
app.include_router(ask_router)


@app.get("/health", tags=["system"])
def health_check():
    """Health check endpoint to verify backend operational status."""
    return {
        "status": "healthy",
        "service": "RepoLens Backend",
        "llm_model": settings.llm_model,
        "embedding_model": settings.embedding_model,
        "langsmith_tracing": settings.langsmith_tracing,
    }
