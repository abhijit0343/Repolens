"""Unit tests for impact blast radius analysis."""
import networkx as nx
from backend.app.codegraph.impact import analyze_impact
from backend.app.codegraph.store import save_graph_json


def test_analyze_impact_blast_radius():
    repo_id = "test_impact_suite"
    G = nx.DiGraph()

    # Create dependency chain: A -> B -> C (A calls B, B calls C)
    G.add_node("func:a", id="func:a", label="funcA", type="Function", path="a.py", start_line=1, end_line=5, summary="A")
    G.add_node("func:b", id="func:b", label="funcB", type="Function", path="b.py", start_line=1, end_line=5, summary="B")
    G.add_node("func:c", id="func:c", label="funcC", type="Function", path="c.py", start_line=1, end_line=5, summary="C")

    G.add_edge("func:a", "func:b", relation="calls")
    G.add_edge("func:b", "func:c", relation="calls")

    save_graph_json(repo_id, G, [{"id": 0, "name": "Core", "summary": "Core cluster"}])

    # If funcB changes:
    # Upstream: funcA calls funcB (breaks funcA at distance 1)
    # Downstream: funcB calls funcC (depends on funcC at distance 1)
    res = analyze_impact(repo_id, "funcB")
    assert "error" not in res or not res["error"]
    assert len(res["upstream"]) == 1
    assert res["upstream"][0]["label"] == "funcA"
    assert res["upstream"][0]["distance"] == 1

    assert len(res["downstream"]) == 1
    assert res["downstream"][0]["label"] == "funcC"
    assert res["downstream"][0]["distance"] == 1


def test_analyze_impact_symbol_not_found():
    res = analyze_impact("nonexistent_repo", "missing_func")
    assert "error" in res
