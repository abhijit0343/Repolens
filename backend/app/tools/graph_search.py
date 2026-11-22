"""Graph search tool: radius-2 ego-graph extraction and community summaries."""
import networkx as nx
from langchain_core.tools import tool
from backend.app.codegraph.impact import find_symbol_node_id, graph_from_json
from backend.app.codegraph.store import load_graph_json


@tool
def graph_search(repo_id: str, symbol_or_query: str) -> str:
    """Explore the architectural knowledge graph around a symbol or query.

    Extracts a 2-hop neighborhood ego-graph, callers, callees, and community cluster info.
    """
    try:
        data = load_graph_json(repo_id)
        G = graph_from_json(data)
    except Exception as exc:
        return f"Error loading graph for {repo_id}: {exc}"

    target_id = find_symbol_node_id(G, symbol_or_query)
    if not target_id:
        return f"Symbol '{symbol_or_query}' not found in the code graph of {repo_id}."

    target_node = G.nodes[target_id]
    comm_id = target_node.get("community", 0)

    # Find community summary
    comm_summary = "General architecture"
    for c in data.get("communities", []):
        if c.get("id") == comm_id:
            comm_summary = f"{c.get('name')}: {c.get('summary')}"
            break

    # Extract 2-hop ego-graph
    try:
        ego = nx.ego_graph(G.to_undirected(), target_id, radius=2)
    except Exception:
        ego = nx.Graph()

    callers = [u for u, v, d in G.in_edges(target_id, data=True) if d.get("relation") == "calls"]
    callees = [v for u, v, d in G.out_edges(target_id, data=True) if d.get("relation") == "calls"]

    lines = [
        f"=== Graph Neighborhood for '{target_node.get('label')}' [{target_node.get('type')}] ===",
        f"Node ID: {target_id}",
        f"File: {target_node.get('path')}:{target_node.get('start_line')}-{target_node.get('end_line')}",
        f"Architectural Community: {comm_summary}",
        f"Summary: {target_node.get('summary')}",
        f"Ego-Graph (radius=2): {len(ego.nodes)} nearby nodes, {len(ego.edges)} edges",
        f"Direct Callers ({len(callers)}): {', '.join([G.nodes[c].get('label', c) for c in callers[:8]]) or 'None'}",
        f"Direct Callees ({len(callees)}): {', '.join([G.nodes[c].get('label', c) for c in callees[:8]]) or 'None'}",
    ]

    return "\n".join(lines)
