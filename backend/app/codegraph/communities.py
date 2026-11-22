"""Louvain community detection for code knowledge graphs.

Partitions the graph into architectural module clusters and assigns community IDs.
"""
from typing import Dict, List
import community as community_louvain
import networkx as nx


def detect_communities(G: nx.DiGraph) -> Dict[int, List[str]]:
    """Partition the code graph into communities using Louvain modularity.

    Returns:
        Mapping of community_id -> list of node_ids
    """
    if len(G) == 0:
        return {}

    # Louvain requires an undirected graph
    undirected = G.to_undirected()

    try:
        partition = community_louvain.best_partition(undirected, random_state=42)
    except Exception:
        # Fallback to connected components if partition fails
        partition = {}
        for comp_idx, comp in enumerate(nx.connected_components(undirected)):
            for node in comp:
                partition[node] = comp_idx

    # Update node attributes with community id
    clusters: Dict[int, List[str]] = {}
    for node_id, comm_id in partition.items():
        if G.has_node(node_id):
            G.nodes[node_id]["community"] = comm_id
            clusters.setdefault(comm_id, []).append(node_id)

    return clusters
