"""Unit tests for backend health check."""
from backend.app.main import health_check


def test_health_check_endpoint():
    res = health_check()
    assert res["status"] == "healthy"
    assert res["service"] == "RepoLens Backend"
    assert "llm_model" in res
