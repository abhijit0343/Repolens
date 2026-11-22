"""FastAPI entry point for RepoLens backend."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.db.repos import init_db
from backend.app.api.repos import router as repos_router
from backend.app.api.graph import router as graph_router
from backend.app.api.ask import router as ask_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context: initialize database and clean storage."""
    init_db(settings.sqlite_path)
    yield


app = FastAPI(
    title="RepoLens API",
    description="Deep agent codebase exploration with GraphRAG and cited answers",
    version="1.0.0",
    lifespan=lifespan,
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
async def health_check():
    """Health check endpoint to verify backend operational status."""
    return {
        "status": "healthy",
        "service": "RepoLens Backend",
        "llm_model": settings.llm_model,
        "embedding_model": settings.embedding_model,
        "langsmith_tracing": settings.langsmith_tracing,
    }
