"""Tests for repository and secret guardrails."""
import pytest
from backend.app.guardrails.repo import validate_github_url, is_safe_repo_path
from backend.app.guardrails.secrets import detect_secrets, redact_secrets


def test_validate_github_url_valid():
    ok, owner, repo = validate_github_url("https://github.com/fastapi/fastapi")
    assert ok is True
    assert owner == "fastapi"
    assert repo == "fastapi"

    ok, owner, repo = validate_github_url("https://github.com/owner-name/repo.git")
    assert ok is True
    assert owner == "owner-name"
    assert repo == "repo"


def test_validate_github_url_invalid():
    assert validate_github_url("http://github.com/owner/repo")[0] is False
    assert validate_github_url("https://gitlab.com/owner/repo")[0] is False
    assert validate_github_url("https://github.com/owner")[0] is False
    assert validate_github_url("")[0] is False
    assert validate_github_url("https://github.com/owner/repo/sub/dir")[0] is False


def test_is_safe_repo_path():
    assert is_safe_repo_path("src/main.py") is True
    assert is_safe_repo_path("app/utils/helpers.ts") is True
    assert is_safe_repo_path("../secret.txt") is False
    assert is_safe_repo_path(".git/config") is False
    assert is_safe_repo_path(".env") is False


def test_detect_and_redact_secrets():
    raw = (
        "Here is my AWS key: AKIA1234567890ABCDEF and GitHub token: "
        "ghp_123456789012345678901234567890123456 and google key AIzaSyD9876543210123456789012345678901"
    )
    findings = detect_secrets(raw)
    assert len(findings) >= 3

    redacted = redact_secrets(raw)
    assert "AKIA1234567890ABCDEF" not in redacted
    assert "ghp_123456789012345678901234567890123456" not in redacted
    assert "AIzaSyD9876543210123456789012345678901" not in redacted
    assert "[REDACTED_AWS_ACCESS_KEY]" in redacted
    assert "[REDACTED_GITHUB_TOKEN]" in redacted
