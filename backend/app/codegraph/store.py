"""Graph serialization and 3D layout generator for WebGL frontend.

Computes 3D coordinates using NetworkX spring layout (dim=3, seed=42) normalized to [0..1]
and saves data/graphs/<repo_id>.json adhering strictly to the target schema.
"""
import json
from pathlib import Path
from typing import Any, Dict, List, Tuple
import networkx as nx
from backend.app.config import settings


def compute_3d_layout(G: nx.DiGraph) -> Dict[str, Tuple[float, float, float]]:
    """Compute 3D spring layout coordinates for all nodes normalized to 0.0 .. 1.0."""
    if len(G) == 0:
        return {}

    # Compute 3D layout using spring_layout with fixed seed
    undirected = G.to_undirected()
    try:
        raw_pos = nx.spring_layout(undirected, dim=3, seed=42, iterations=50)
    except Exception:
        raw_pos = {nid: [0.5, 0.5, 0.5] for nid in G.nodes()}

    # Normalize coordinates to 0..1 bounding box with safe padding
    xs = [coord[0] for coord in raw_pos.values()]
    ys = [coord[1] for coord in raw_pos.values()]
    zs = [coord[2] for coord in raw_pos.values()]

    min_x, max_x = min(xs, default=0.0), max(xs, default=1.0)
    min_y, max_y = min(ys, default=0.0), max(ys, default=1.0)
    min_z, max_z = min(zs, default=0.0), max(zs, default=1.0)

    range_x = (max_x - min_x) or 1.0
    range_y = (max_y - min_y) or 1.0
    range_z = (max_z - min_z) or 1.0

    layout: Dict[str, Tuple[float, float, float]] = {}
    for node_id, (x, y, z) in raw_pos.items():
        norm_x = round(float((x - min_x) / range_x), 4)
        norm_y = round(float((y - min_y) / range_y), 4)
        norm_z = round(float((z - min_z) / range_z), 4)
        layout[node_id] = (norm_x, norm_y, norm_z)

    return layout


def save_graph_json(
    repo_id: str,
    G: nx.DiGraph,
    communities: List[Dict[str, Any]],
) -> Path:
    """Save graph data in JSON format matching the frontend 3D WebGL schema."""
    layout = compute_3d_layout(G)
    nodes_payload = []

    for node_id, data in G.nodes(data=True):
        coords = layout.get(node_id, (0.5, 0.5, 0.5))
        nodes_payload.append({
            "id": data.get("id", node_id),
            "label": data.get("label", node_id),
            "type": data.get("type", "Function"),
            "path": data.get("path", ""),
            "start_line": data.get("start_line", 1),
            "end_line": data.get("end_line", 1),
            "summary": data.get("summary", ""),
            "community": data.get("community", 0),
            "x": coords[0],
            "y": coords[1],
            "z": coords[2],
        })

    edges_payload = []
    for u, v, data in G.edges(data=True):
        edges_payload.append({
            "source": u,
            "target": v,
            "relation": data.get("relation", "calls"),
        })

    payload = {
        "repo_id": repo_id,
        "nodes": nodes_payload,
        "edges": edges_payload,
        "communities": communities,
        "stats": {
            "node_count": len(nodes_payload),
            "edge_count": len(edges_payload),
            "community_count": len(communities),
        },
    }

    out_path = settings.graphs_dir / f"{repo_id}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return out_path


def load_graph_json(repo_id: str) -> Dict[str, Any]:
    """Load serialized graph JSON for a repository."""
    graph_file = settings.graphs_dir / f"{repo_id}.json"
    if not graph_file.exists():
        raise FileNotFoundError(f"Graph JSON for {repo_id} not found at {graph_file}")
    return json.loads(graph_file.read_text(encoding="utf-8"))
