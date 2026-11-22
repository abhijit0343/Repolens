"""Safe file reading tool with path traversal protection and line range extraction."""
from pathlib import Path
from typing import Optional
from langchain_core.tools import tool
from backend.app.config import settings
from backend.app.guardrails.repo import is_safe_repo_path


@tool
def read_file(
    repo_id: str,
    file_path: str,
    start_line: Optional[int] = None,
    end_line: Optional[int] = None,
) -> str:
    """Read full or targeted line ranges of a file within the indexed repository.

    Args:
        repo_id: The repository identifier.
        file_path: Relative path to the file inside the repository.
        start_line: Optional 1-indexed starting line number.
        end_line: Optional 1-indexed ending line number.
    """
    if not is_safe_repo_path(file_path):
        return f"ERROR: Access denied. Unsafe or forbidden file path: '{file_path}'"

    repo_dir = settings.repos_dir / repo_id
    target = (repo_dir / file_path).resolve()

    # Enforce path containment within repository directory
    try:
        target.relative_to(repo_dir.resolve())
    except ValueError:
        return f"ERROR: Path traversal blocked. File must reside inside repository {repo_id}."

    if not target.exists() or not target.is_file():
        return f"ERROR: File not found at path '{file_path}'."

    try:
        lines = target.read_text(encoding="utf-8", errors="replace").splitlines()
    except Exception as exc:
        return f"ERROR reading file '{file_path}': {exc}"

    total_lines = len(lines)
    s = max(1, start_line or 1)
    e = min(total_lines, end_line or total_lines)

    if s > total_lines:
        return f"File '{file_path}' has {total_lines} lines; start_line {s} is out of range."

    formatted = []
    formatted.append(f"--- File: {file_path} (Lines {s}-{e} of {total_lines}) ---")
    for idx in range(s, e + 1):
        formatted.append(f"{idx:4d} | {lines[idx - 1]}")

    return "\n".join(formatted)
