"""File scanner for cloned repositories.

Applies safety filters: excludes node_modules, .git, venv, binary files,
and limits file count and file size according to application budgets.
"""
from pathlib import Path
from typing import Dict, List
from backend.app.config import settings

# Directories to skip
IGNORED_DIRS = {
    ".git",
    ".github",
    ".idea",
    ".vscode",
    "node_modules",
    "venv",
    ".venv",
    "env",
    "__pycache__",
    ".pytest_cache",
    "dist",
    "build",
    ".next",
    ".turbo",
    "coverage",
    ".cache",
}

# Binary and non-code file extensions to ignore
BINARY_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico", ".pdf",
    ".zip", ".tar", ".gz", ".tgz", ".bz2", ".7z", ".rar",
    ".exe", ".dll", ".so", ".dylib", ".bin", ".iso", ".wasm",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".mp3", ".mp4", ".wav", ".avi", ".mov",
    ".pyc", ".pyo", ".pyd", ".class", ".jar",
    ".sqlite", ".sqlite3", ".db", ".lock", ".lockb",
}

# Supported source languages
LANGUAGE_MAP = {
    ".py": "python",
    ".js": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".mts": "typescript",
    ".cts": "typescript",
}


def scan_repository(repo_dir: Path) -> List[Dict]:
    """Scan the repository directory and return metadata + text content of valid code files."""
    scanned_files = []
    max_size_bytes = settings.max_file_kb * 1024
    max_files = settings.max_files

    for path in repo_dir.rglob("*"):
        if len(scanned_files) >= max_files:
            break

        if not path.is_file():
            continue

        # Skip ignored directory trees
        if any(ignored in path.parts for ignored in IGNORED_DIRS):
            continue

        suffix = path.suffix.lower()
        if suffix in BINARY_EXTENSIONS:
            continue

        language = LANGUAGE_MAP.get(suffix)
        if not language:
            # Skip non-supported code files (e.g. arbitrary data/configs)
            continue

        # Check file size cap
        try:
            stat = path.stat()
            if stat.st_size > max_size_bytes:
                continue
        except OSError:
            continue

        # Read text content safely
        try:
            content = path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue

        rel_path = path.relative_to(repo_dir).as_posix()
        scanned_files.append({
            "path": rel_path,
            "abs_path": str(path),
            "language": language,
            "size_bytes": len(content),
            "content": content,
            "line_count": content.count("\n") + 1,
        })

    return scanned_files
