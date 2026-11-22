"""SQLite database layer for RepoLens repository indexing status and metadata."""
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional


def get_db_connection(db_path: str) -> sqlite3.Connection:
    """Create a connection with dict-like row factory and pragmas enabled."""
    p = Path(db_path)
    p.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def init_db(db_path: str) -> None:
    """Initialize the repositories table."""
    conn = get_db_connection(db_path)
    try:
        with conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS repos (
                    repo_id TEXT PRIMARY KEY,
                    url TEXT NOT NULL,
                    status TEXT NOT NULL,
                    current_step TEXT,
                    progress REAL DEFAULT 0.0,
                    error_message TEXT,
                    stats_json TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
    finally:
        conn.close()


def create_repo_record(
    db_path: str, repo_id: str, url: str, status: str = "pending"
) -> Dict[str, Any]:
    """Insert a new repository entry into the database."""
    now = datetime.now(timezone.utc).isoformat()
    conn = get_db_connection(db_path)
    try:
        with conn:
            conn.execute(
                """
                INSERT INTO repos (repo_id, url, status, current_step, progress, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (repo_id, url, status, "queued", 0.0, now, now),
            )
        return {
            "repo_id": repo_id,
            "url": url,
            "status": status,
            "current_step": "queued",
            "progress": 0.0,
            "created_at": now,
            "updated_at": now,
        }
    finally:
        conn.close()


def update_repo_status(
    db_path: str,
    repo_id: str,
    status: str,
    current_step: Optional[str] = None,
    progress: Optional[float] = None,
    error_message: Optional[str] = None,
    stats: Optional[Dict[str, Any]] = None,
) -> None:
    """Update progress, step, status, and stats for a repository."""
    now = datetime.now(timezone.utc).isoformat()
    conn = get_db_connection(db_path)
    try:
        stats_str = json.dumps(stats) if stats is not None else None
        with conn:
            conn.execute(
                """
                UPDATE repos
                SET status = ?,
                    current_step = COALESCE(?, current_step),
                    progress = COALESCE(?, progress),
                    error_message = COALESCE(?, error_message),
                    stats_json = COALESCE(?, stats_json),
                    updated_at = ?
                WHERE repo_id = ?
                """,
                (status, current_step, progress, error_message, stats_str, now, repo_id),
            )
    finally:
        conn.close()


def get_repo_record(db_path: str, repo_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve repository status record by id."""
    conn = get_db_connection(db_path)
    try:
        cursor = conn.execute("SELECT * FROM repos WHERE repo_id = ?", (repo_id,))
        row = cursor.fetchone()
        if not row:
            return None
        data = dict(row)
        if data.get("stats_json"):
            try:
                data["stats"] = json.loads(data["stats_json"])
            except Exception:
                data["stats"] = {}
        else:
            data["stats"] = {}
        return data
    finally:
        conn.close()
