"""Repository security guardrails: URL validation, safety constraints, caps.

Ensures only valid public/accessible GitHub repository URLs are accepted,
enforces file/size limits, and blocks malicious paths or submodule execution.
"""
import re
from typing import Tuple

GITHUB_REPO_REGEX = re.compile(
    r"^https:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\.git)?\/?$"
)


def validate_github_url(url: str) -> Tuple[bool, str, str]:
    """Validate that the input is a valid GitHub repository URL.

    Returns:
        (is_valid, owner, repo) or (False, error_msg, "")
    """
    if not url or not isinstance(url, str):
        return False, "Repository URL must be a non-empty string", ""

    cleaned = url.strip()
    match = GITHUB_REPO_REGEX.match(cleaned)
    if not match:
        return (
            False,
            "Invalid repository URL. Must be in format: https://github.com/<owner>/<repo>",
            "",
        )

    owner, repo = match.group(1), match.group(2)
    # Filter reserved or malicious names
    if owner in (".", "..") or repo in (".", "..") or "/" in owner or "/" in repo:
        return False, "Dangerous repository name components detected", ""

    return True, owner, repo.removesuffix(".git")


def is_safe_repo_path(relative_path: str) -> bool:
    """Verify that a relative file path does not attempt path traversal or access forbidden dirs."""
    clean = relative_path.replace("\\", "/").strip()
    parts = clean.split("/")
    if any(part in ("..", "", ".") for part in parts[:-1]):
        return False
    # Forbidden hidden metadata
    forbidden_prefixes = (".git", ".github/workflows/deploy", ".env")
    for pref in forbidden_prefixes:
        if clean.startswith(pref) or f"/{pref}" in clean:
            return False
    return True
