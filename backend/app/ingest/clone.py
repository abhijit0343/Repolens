"""Repository shallow cloning with security guardrails and optional token support.

Clones repos using plain git shallow clone (--depth 1). If GITHUB_TOKEN is present,
it is passed securely through git environment variables (GIT_CONFIG_COUNT/KEY/VALUE),
never embedded in the URL or written to repo configs or logs.
Git hooks and submodules are explicitly disabled.
"""
import os
import shutil
import subprocess
from pathlib import Path
from typing import Tuple
from backend.app.config import settings
from backend.app.guardrails.repo import validate_github_url


def repo_id_from_url(url: str) -> str:
    """Generate a clean filesystem-safe repo_id from a GitHub URL."""
    valid, owner, repo = validate_github_url(url)
    if not valid:
        raise ValueError(f"Invalid repository URL: {url}")
    return f"{owner}__{repo}".lower()


def clone_repository(url: str, target_dir: Path) -> Tuple[Path, str]:
    """Shallow-clone a GitHub repository into target_dir.

    Returns:
        (repo_path, repo_id)
    """
    valid, owner, repo = validate_github_url(url)
    if not valid:
        raise ValueError(f"Invalid repository URL: {owner}")

    repo_id = f"{owner}__{repo}".lower()
    dest = target_dir / repo_id

    # If already cloned and contains .git, remove it or reuse
    if dest.exists():
        try:
            shutil.rmtree(dest)
        except Exception:
            pass

    dest.mkdir(parents=True, exist_ok=True)
    clean_url = f"https://github.com/{owner}/{repo}.git"

    # Base git clone command with shallow depth, no submodules, hooks disabled
    cmd = [
        "git",
        "clone",
        "--depth",
        "1",
        "--recurse-submodules=no",
        "-c",
        "core.hooksPath=/dev/null",
        clean_url,
        str(dest),
    ]

    env = os.environ.copy()
    # Configure token securely via environment if provided
    token = settings.github_token.strip()
    if token:
        env["GIT_CONFIG_COUNT"] = "1"
        env["GIT_CONFIG_KEY_0"] = "http.extraHeader"
        env["GIT_CONFIG_VALUE_0"] = f"Authorization: Bearer {token}"

    # Execute clone
    result = subprocess.run(
        cmd,
        env=env,
        capture_output=True,
        text=True,
        timeout=settings.request_timeout_s * 2,
    )

    if result.returncode != 0:
        # Never leak token in error messages
        err = result.stderr.replace(token, "[REDACTED]") if token else result.stderr
        raise RuntimeError(f"Git clone failed: {err.strip()}")

    # Additional hardening: purge .git/hooks directory if created
    hooks_dir = dest / ".git" / "hooks"
    if hooks_dir.exists():
        shutil.rmtree(hooks_dir, ignore_errors=True)

    return dest, repo_id
