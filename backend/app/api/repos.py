"""Repository indexing API: triggers asynchronous cloning, scanning, parsing, GraphRAG."""
import asyncio
from typing import Any, Dict
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, HttpUrl
from backend.app.codegraph.builder import build_code_graph
from backend.app.codegraph.communities import detect_communities
from backend.app.codegraph.store import save_graph_json
from backend.app.codegraph.summarize import summarize_graph
from backend.app.config import settings
from backend.app.db.repos import (
    create_repo_record,
    get_repo_record,
    update_repo_status,
)
from backend.app.guardrails.repo import validate_github_url
from backend.app.ingest.clone import clone_repository, repo_id_from_url
from backend.app.ingest.scan import scan_repository
from backend.app.rag.embed import embed_code_graph

router = APIRouter(prefix="/repos", tags=["repos"])


class RepoIndexRequest(BaseModel):
    url: str


def run_indexing_pipeline(repo_id: str, url: str) -> None:
    """Synchronous pipeline executed in background task."""
    db_path = settings.sqlite_path
    try:
        # Step 1: Shallow Clone
        update_repo_status(db_path, repo_id, status="indexing", current_step="cloned", progress=0.2)
        repo_dir, _ = clone_repository(url, settings.repos_dir)

        # Step 2: Scan Code Files
        update_repo_status(db_path, repo_id, status="indexing", current_step="scanned", progress=0.4)
        scanned_files = scan_repository(repo_dir)
        if not scanned_files:
            update_repo_status(
                db_path,
                repo_id,
                status="failed",
                current_step="scanned",
                error_message="No supported code files found in repository.",
            )
            return

        # Step 3: Parse AST & Construct DiGraph
        update_repo_status(db_path, repo_id, status="indexing", current_step="parsed", progress=0.6)
        G = build_code_graph(scanned_files)

        # Step 4: Detect Communities & 3D Layout
        update_repo_status(db_path, repo_id, status="indexing", current_step="graphed", progress=0.8)
        clusters = detect_communities(G)
        communities = summarize_graph(G, clusters, max_llm_calls=12)
        save_graph_json(repo_id, G, communities)

        # Step 5: Embed in ChromaDB
        update_repo_status(db_path, repo_id, status="indexing", current_step="summarised", progress=0.95)
        embed_code_graph(repo_id, G)

        stats = {
            "files": len(scanned_files),
            "nodes": len(G.nodes),
            "edges": len(G.edges),
            "communities": len(communities),
        }
        update_repo_status(
            db_path,
            repo_id,
            status="completed",
            current_step="done",
            progress=1.0,
            stats=stats,
        )

    except Exception as exc:
        update_repo_status(
            db_path,
            repo_id,
            status="failed",
            error_message=str(exc)[:500],
        )


@router.post("", status_code=202)
def start_repository_indexing(
    req: RepoIndexRequest,
    background_tasks: BackgroundTasks,
) -> Dict[str, Any]:
    """Accept a GitHub URL and trigger background cloning, parsing, and GraphRAG indexing."""
    is_valid, owner, repo = validate_github_url(req.url)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid GitHub repository URL: {owner}",
        )

    repo_id = f"{owner}__{repo}".lower()
    db_path = settings.sqlite_path

    # Check if repository is currently being indexed
    existing = get_repo_record(db_path, repo_id)
    if existing and existing.get("status") == "indexing":
        return {
            "repo_id": repo_id,
            "status": "indexing",
            "message": "Repository is already undergoing indexing.",
        }

    # Initialize record
    create_repo_record(db_path, repo_id, req.url, status="queued")

    # Queue background task
    background_tasks.add_task(run_indexing_pipeline, repo_id, req.url)

    return {
        "repo_id": repo_id,
        "status": "queued",
        "current_step": "queued",
        "progress": 0.0,
    }


@router.get("/{repo_id}/status")
def get_indexing_status(repo_id: str) -> Dict[str, Any]:
    """Query real-time indexing status and statistics for a repository."""
    rec = get_repo_record(settings.sqlite_path, repo_id)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Repository '{repo_id}' not found.")
    return rec
