"""Impact analysis: calculates upstream and downstream dependency ripple effects.

Upstream: nx.ancestors over calls/imports (what breaks if this symbol changes).
Downstream: nx.descendants (what this symbol depends on or invokes).
Both sets are ranked by shortest path distance from the target symbol.
"""
from typing import Any, Dict, List, Optional
import networkx as nx
from backend.app.codegraph.store import load_graph_json


def graph_from_json(data: Dict[str, Any]) -> nx.DiGraph:
    """Reconstruct NetworkX DiGraph from serialized JSON payload."""
    G = nx.DiGraph()
    for n in data.get("nodes", []):
        G.add_node(n["id"], **n)
    for e in data.get("edges", []):
        G.add_edge(e["source"], e["target"], relation=e.get("relation", "calls"))
    return G


def find_symbol_node_id(G: nx.DiGraph, symbol: str) -> Optional[str]:
    """Resolve a symbol query to an exact node ID or best matching label."""
    if G.has_node(symbol):
        return symbol

    # Search by exact label match
    exact_matches = [n for n, d in G.nodes(data=True) if d.get("label", "").lower() == symbol.lower()]
    if exact_matches:
        # Prefer Function or Class over File/Module
        exact_matches.sort(key=lambda n: 0 if G.nodes[n].get("type") in ("Function", "Class") else 1)
        return exact_matches[0]

    # Substring search
    for n, d in G.nodes(data=True):
        if symbol.lower() in d.get("label", "").lower():
            return n

    return None


def analyze_impact(repo_id: str, symbol: str) -> Dict[str, Any]:
    """Calculate ranked upstream and downstream impact for a symbol.

    Upstream: caller nodes that depend on this symbol (breaking changes propagate here).
    Downstream: callee nodes and dependencies invoked by this symbol.
    """
    try:
        data = load_graph_json(repo_id)
        G = graph_from_json(data)
    except Exception as exc:
        return {"error": f"Failed to load graph for {repo_id}: {exc}", "upstream": [], "downstream": []}

    target_id = find_symbol_node_id(G, symbol)
    if not target_id:
        return {
            "error": f"Symbol '{symbol}' not found in repository graph.",
            "target_node": None,
            "upstream": [],
            "downstream": [],
        }

    target_data = G.nodes[target_id]

    # Create dependency graph filtered to calls, imports, inherits
    dep_edges = [
        (u, v) for u, v, d in G.edges(data=True)
        if d.get("relation") in ("calls", "imports", "inherits")
    ]
    dep_graph = nx.DiGraph(dep_edges)

    # Ensure target_id exists in dep_graph
    if not dep_graph.has_node(target_id):
        dep_graph.add_node(target_id)

    # Upstream: nodes that call/import target (predecessors / reverse paths)
    rev_graph = dep_graph.reverse()
    try:
        upstream_lengths = nx.single_source_shortest_path_length(rev_graph, target_id)
    except Exception:
        upstream_lengths = {}

    upstream_nodes = []
    for nid, dist in sorted(upstream_lengths.items(), key=lambda item: item[1]):
        if nid != target_id and G.has_node(nid):
            nd = G.nodes[nid]
            upstream_nodes.append({
                "id": nid,
                "label": nd.get("label", nid),
                "type": nd.get("type", "Unknown"),
                "path": nd.get("path", ""),
                "start_line": nd.get("start_line", 1),
                "distance": dist,
            })

    # Downstream: nodes that target calls/imports (descendants in dep_graph)
    try:
        downstream_lengths = nx.single_source_shortest_path_length(dep_graph, target_id)
    except Exception:
        downstream_lengths = {}

    downstream_nodes = []
    for nid, dist in sorted(downstream_lengths.items(), key=lambda item: item[1]):
        if nid != target_id and G.has_node(nid):
            nd = G.nodes[nid]
            downstream_nodes.append({
                "id": nid,
                "label": nd.get("label", nid),
                "type": nd.get("type", "Unknown"),
                "path": nd.get("path", ""),
                "start_line": nd.get("start_line", 1),
                "distance": dist,
            })

    return {
        "symbol": symbol,
        "target_node": {
            "id": target_id,
            "label": target_data.get("label", symbol),
            "type": target_data.get("type", "Function"),
            "path": target_data.get("path", ""),
            "start_line": target_data.get("start_line", 1),
            "end_line": target_data.get("end_line", 1),
        },
        "upstream": upstream_nodes,
        "downstream": downstream_nodes,
        "summary": (
            f"Symbol '{target_data.get('label')}' affects {len(upstream_nodes)} upstream callers "
            f"and depends on {len(downstream_nodes)} downstream symbols."
        ),
    }
