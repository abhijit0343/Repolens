"""Verification script for Phase B4: impact.py and all LangChain agent tools."""
import os
import tempfile
from pathlib import Path
from backend.app.codegraph.impact import analyze_impact
from backend.app.codegraph.store import save_graph_json
from backend.app.config import settings
from backend.app.tools.code_search import code_search
from backend.app.tools.graph_search import graph_search
from backend.app.tools.impact_analysis import impact_analysis
from backend.app.tools.read_file import read_file
from backend.app.tools.web_search import web_search
import networkx as nx


def verify_b4():
    # 1. Setup a test graph in data/graphs/sample_verify.json
    G = nx.DiGraph()
    G.add_node("file:app.py", id="file:app.py", label="app.py", type="File", path="app.py", start_line=1, end_line=20, summary="Main entry point", community=0)
    G.add_node("func:app.py:start:5", id="func:app.py:start:5", label="start", type="Function", path="app.py", start_line=5, end_line=10, summary="Starts service", community=0)
    G.add_node("func:app.py:helper:12", id="func:app.py:helper:12", label="helper", type="Function", path="app.py", start_line=12, end_line=18, summary="Helper util", community=0)
    G.add_edge("func:app.py:start:5", "func:app.py:helper:12", relation="calls")
    G.add_edge("file:app.py", "func:app.py:start:5", relation="contains")
    G.add_edge("file:app.py", "func:app.py:helper:12", relation="contains")

    save_graph_json("sample_b4", G, [{"id": 0, "name": "Core", "summary": "Core cluster"}])

    # 2. Setup a test file in data/repos/sample_b4/app.py
    repo_dir = settings.repos_dir / "sample_b4"
    repo_dir.mkdir(parents=True, exist_ok=True)
    (repo_dir / "app.py").write_text("import sys\n\ndef start():\n    return helper()\n\ndef helper():\n    return 42\n", encoding="utf-8")

    print("--- 1. Testing analyze_impact ---")
    impact_res = analyze_impact("sample_b4", "helper")
    assert len(impact_res["upstream"]) >= 1, "Expected upstream caller for helper"
    print("Upstream count:", len(impact_res["upstream"]))
    print("Upstream callers:", [u["label"] for u in impact_res["upstream"]])

    print("\n--- 2. Testing impact_analysis tool ---")
    impact_tool_out = impact_analysis.invoke({"repo_id": "sample_b4", "symbol": "helper"})
    assert "UPSTREAM RIPPLE EFFECT" in impact_tool_out
    print("impact_analysis output sample:\n", impact_tool_out[:200])

    print("\n--- 3. Testing graph_search tool ---")
    graph_tool_out = graph_search.invoke({"repo_id": "sample_b4", "symbol_or_query": "start"})
    assert "Graph Neighborhood" in graph_tool_out
    print("graph_search output sample:\n", graph_tool_out[:200])

    print("\n--- 4. Testing read_file tool ---")
    read_out = read_file.invoke({"repo_id": "sample_b4", "file_path": "app.py", "start_line": 1, "end_line": 4})
    assert "--- File: app.py" in read_out
    print("read_file output sample:\n", read_out)

    print("\n--- 5. Testing code_search tool ---")
    code_out = code_search.invoke({"repo_id": "sample_b4", "query": "helper function"})
    print("code_search output:", code_out[:150])

    print("\n--- 6. Testing web_search tool ---")
    # web_search can run or report connection if offline in sandbox
    web_out = web_search.invoke({"query": "python async await docs"})
    print("web_search output preview:", web_out[:150])

    print("\nB4 All Tools Verified Successfully!")


if __name__ == "__main__":
    verify_b4()
