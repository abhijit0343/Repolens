"""LLM-based summarization for code nodes and community clusters.

Batches requests and produces concise architectural summaries for Functions,
Classes, Files, and Community Module Clusters.
"""
from typing import Any, Dict, List
import networkx as nx
from backend.app.llm import get_tagged_llm


def summarize_node_heuristic(node: Dict[str, Any]) -> str:
    """Generate high-quality heuristic summary when LLM is offline or during quick indexing."""
    ntype = node.get("type", "Node")
    label = node.get("label", "")
    path = node.get("path", "")
    lines = f"L{node.get('start_line', 1)}-L{node.get('end_line', 1)}"
    if ntype == "File":
        return f"{path} ({lines}) module implementing {label} logic."
    elif ntype == "Class":
        return f"Class {label} in {path} ({lines}) managing core object state and behaviors."
    elif ntype == "Function":
        return f"Function {label} in {path} ({lines}) executing logic."
    elif ntype == "Module":
        return f"Package directory {path} clustering repository components."
    return f"{ntype} {label} in {path}"


def summarize_graph(G: nx.DiGraph, clusters: Dict[int, List[str]], max_llm_calls: int = 15) -> List[Dict[str, Any]]:
    """Generate summaries for significant nodes and community clusters."""
    llm = None
    try:
        llm = get_tagged_llm("summarizer")
    except Exception:
        llm = None

    # Step 1: Assign summaries to nodes (using LLM for top nodes by degree, heuristic for remainder)
    top_nodes = sorted(G.nodes(), key=lambda n: G.degree(n), reverse=True)[:max_llm_calls]

    for node_id in G.nodes():
        node = G.nodes[node_id]
        if not node.get("summary"):
            node["summary"] = summarize_node_heuristic(node)

    if llm and top_nodes:
        for node_id in top_nodes:
            node = G.nodes[node_id]
            snippet = node.get("code_snippet", "")[:600]
            if not snippet.strip():
                continue
            prompt = (
                f"Describe in ONE concise sentence what this {node.get('type')} does:\n"
                f"Name: {node.get('label')}\nPath: {node.get('path')}\nCode:\n{snippet}"
            )
            try:
                resp = llm.invoke(prompt)
                text = resp.content.strip().replace("\n", " ")
                if text:
                    node["summary"] = text[:300]
            except Exception:
                pass

    # Step 2: Summarize communities ("module cluster" name + summary)
    communities_list: List[Dict[str, Any]] = []
    for comm_id, node_ids in clusters.items():
        sample_nodes = [G.nodes[nid] for nid in node_ids if G.has_node(nid)]
        sample_labels = [n.get("label", "") for n in sample_nodes[:6]]
        types = set(n.get("type") for n in sample_nodes)

        comm_name = f"Cluster {comm_id}: {', '.join(sample_labels[:3]) or 'Core'}"
        comm_summary = (
            f"Module cluster containing {len(node_ids)} elements ({', '.join(types)}) "
            f"spanning {sample_labels[:4]}."
        )

        if llm and len(sample_nodes) >= 2:
            prompt = (
                f"Name this code module cluster in 3-5 words and describe its purpose in 1 sentence.\n"
                f"Symbols: {', '.join(sample_labels)}"
            )
            try:
                resp = llm.invoke(prompt)
                lines = [l.strip() for l in resp.content.strip().split("\n") if l.strip()]
                if lines:
                    comm_name = lines[0].strip('":*#- ')[:40]
                    if len(lines) > 1:
                        comm_summary = lines[1][:250]
            except Exception:
                pass

        communities_list.append({
            "id": comm_id,
            "name": comm_name,
            "summary": comm_summary,
            "node_count": len(node_ids),
        })

    return communities_list
