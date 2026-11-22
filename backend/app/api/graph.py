"""Graph API: returns 3D layout data, node inspector details, and impact blast radiuses."""
from typing import Any, Dict
from fastapi import APIRouter, HTTPException, Query
from backend.app.codegraph.impact import analyze_impact, graph_from_json
from backend.app.codegraph.store import load_graph_json

router = APIRouter(prefix="/repos", tags=["graph"])


@router.get("/{repo_id}/graph")
def get_repository_graph(repo_id: str) -> Dict[str, Any]:
    """Retrieve full 3D graph JSON containing nodes, edges, communities, and stats."""
    try:
        return load_graph_json(repo_id)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Graph data for repository '{repo_id}' has not been generated yet.",
        )


@router.get("/{repo_id}/node/{node_id:path}")
def get_node_details(repo_id: str, node_id: str) -> Dict[str, Any]:
    """Retrieve detailed node information: summary, code snippet, callers, and callees."""
    try:
        graph_data = load_graph_json(repo_id)
        G = graph_from_json(graph_data)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Graph for repo '{repo_id}' not found.")

    if not G.has_node(node_id):
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found in graph.")

    node = G.nodes[node_id]

    # Find callers and callees
    callers = []
    for u, v, data in G.in_edges(node_id, data=True):
        if data.get("relation") == "calls":
            callers.append({"id": u, "label": G.nodes[u].get("label", u), "path": G.nodes[u].get("path", "")})

    callees = []
    for u, v, data in G.out_edges(node_id, data=True):
        if data.get("relation") == "calls":
            callees.append({"id": v, "label": G.nodes[v].get("label", v), "path": G.nodes[v].get("path", "")})

    return {
        "node_id": node_id,
        "label": node.get("label", node_id),
        "type": node.get("type", "Function"),
        "path": node.get("path", ""),
        "start_line": node.get("start_line", 1),
        "end_line": node.get("end_line", 1),
        "summary": node.get("summary", ""),
        "code": node.get("code_snippet", ""),
        "community": node.get("community", 0),
        "callers": callers,
        "callees": callees,
    }


@router.get("/{repo_id}/impact")
def get_symbol_impact(
    repo_id: str,
    symbol: str = Query(..., description="Target function or class symbol to evaluate"),
) -> Dict[str, Any]:
    """Evaluate upstream ripple effects and downstream dependencies for a given symbol."""
    res = analyze_impact(repo_id, symbol)
    if "error" in res and res.get("error"):
        raise HTTPException(status_code=400, detail=res["error"])
    return res
