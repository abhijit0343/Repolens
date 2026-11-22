"""Graph builder: constructs NetworkX DiGraph from parsed AST nodes and edges.

Resolves internal calls by matching callee symbols against defined repo functions/classes,
creates Module directory nodes, and adds structural contains/inherits/imports edges.
"""
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple
import networkx as nx
from backend.app.ingest.parse import parse_file_ast


def build_code_graph(scanned_files: List[Dict[str, Any]]) -> nx.DiGraph:
    """Build a complete DiGraph with Module, File, Class, Function, and Import nodes."""
    G = nx.DiGraph()

    all_raw_calls: List[Tuple[str, str]] = []
    symbol_to_node_ids: Dict[str, List[str]] = {}
    created_modules: Set[str] = set()

    for file_meta in scanned_files:
        rel_path = file_meta["path"]
        # Ensure parent modules exist
        parent_dir = Path(rel_path).parent.as_posix()
        if parent_dir and parent_dir != ".":
            parts = Path(parent_dir).parts
            current = ""
            for p in parts:
                current = f"{current}/{p}" if current else p
                mod_id = f"module:{current}"
                if mod_id not in created_modules:
                    created_modules.add(mod_id)
                    G.add_node(
                        mod_id,
                        id=mod_id,
                        label=p,
                        type="Module",
                        path=current,
                        start_line=1,
                        end_line=1,
                        language="",
                        code_snippet=f"Module directory: {current}",
                        summary=f"Package module directory {current}",
                        community=0,
                    )

        # Parse AST of file
        nodes, edges, raw_calls = parse_file_ast(file_meta)

        # Add nodes
        for node in nodes:
            nid = node["id"]
            G.add_node(nid, **node)
            # Index functions and classes by label for call resolution
            if node["type"] in ("Function", "Class"):
                symbol_to_node_ids.setdefault(node["label"], []).append(nid)

        # Add explicit edges
        for edge in edges:
            G.add_edge(edge["source"], edge["target"], relation=edge["relation"])

        # Link file to its parent module
        if parent_dir and parent_dir != ".":
            G.add_edge(f"module:{parent_dir}", f"file:{rel_path}", relation="contains")

        all_raw_calls.extend(raw_calls)

    # Resolve call edges internally within repo (ignore unresolved externals)
    for caller_id, callee_symbol in all_raw_calls:
        if not G.has_node(caller_id):
            continue

        if callee_symbol.startswith("inherits:"):
            base_name = callee_symbol.split(":", 1)[1]
            targets = symbol_to_node_ids.get(base_name, [])
            for target_id in targets:
                if target_id != caller_id:
                    G.add_edge(caller_id, target_id, relation="inherits")
        else:
            targets = symbol_to_node_ids.get(callee_symbol, [])
            for target_id in targets:
                if target_id != caller_id:
                    G.add_edge(caller_id, target_id, relation="calls")

    return G
