"""Tree-sitter AST parser for Python, JavaScript, and TypeScript.

Extracts File, Module, Class, Function, and Import nodes along with
contains, imports, calls, and inherits relationships.
"""
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple
import tree_sitter_languages

# Load tree-sitter parsers
PARSERS = {
    "python": tree_sitter_languages.get_parser("python"),
    "javascript": tree_sitter_languages.get_parser("javascript"),
    "typescript": tree_sitter_languages.get_parser("typescript"),
}


def _node_text(ts_node, source_bytes: bytes) -> str:
    """Extract string text from a tree-sitter node."""
    return source_bytes[ts_node.start_byte : ts_node.end_byte].decode("utf-8", errors="replace")


def parse_file_ast(file_meta: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Tuple[str, str]]]:
    """Parse a single code file into graph nodes, structural edges, and raw calls.

    Returns:
        (nodes, edges, raw_calls) where raw_calls is [(caller_node_id, callee_name)]
    """
    rel_path = file_meta["path"]
    lang = file_meta["language"]
    content = file_meta["content"]
    source_bytes = content.encode("utf-8", errors="replace")
    parser = PARSERS.get(lang)

    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    raw_calls: List[Tuple[str, str]] = []

    file_node_id = f"file:{rel_path}"
    file_label = Path(rel_path).name
    line_count = file_meta.get("line_count", content.count("\n") + 1)

    # 1. File Node
    nodes.append({
        "id": file_node_id,
        "label": file_label,
        "type": "File",
        "path": rel_path,
        "start_line": 1,
        "end_line": line_count,
        "language": lang,
        "code_snippet": content[:1500],
        "summary": "",
        "community": 0,
    })

    if not parser:
        return nodes, edges, raw_calls

    tree = parser.parse(source_bytes)
    root = tree.root_node

    def walk_python(cursor_node, current_parent_id: str):
        ntype = cursor_node.type
        start_line = cursor_node.start_point[0] + 1
        end_line = cursor_node.end_point[0] + 1
        snippet = _node_text(cursor_node, source_bytes)[:1500]

        if ntype == "function_definition":
            name_node = cursor_node.child_by_field_name("name")
            name = _node_text(name_node, source_bytes) if name_node else f"func_{start_line}"
            fn_id = f"func:{rel_path}:{name}:{start_line}"
            nodes.append({
                "id": fn_id,
                "label": name,
                "type": "Function",
                "path": rel_path,
                "start_line": start_line,
                "end_line": end_line,
                "language": lang,
                "code_snippet": snippet,
                "summary": "",
                "community": 0,
            })
            edges.append({"source": current_parent_id, "target": fn_id, "relation": "contains"})
            # Walk body for calls with this function as parent
            for child in cursor_node.children:
                walk_python(child, fn_id)
            return

        elif ntype == "class_definition":
            name_node = cursor_node.child_by_field_name("name")
            name = _node_text(name_node, source_bytes) if name_node else f"class_{start_line}"
            cls_id = f"class:{rel_path}:{name}:{start_line}"
            nodes.append({
                "id": cls_id,
                "label": name,
                "type": "Class",
                "path": rel_path,
                "start_line": start_line,
                "end_line": end_line,
                "language": lang,
                "code_snippet": snippet,
                "summary": "",
                "community": 0,
            })
            edges.append({"source": current_parent_id, "target": cls_id, "relation": "contains"})

            # Check superclasses
            super_node = cursor_node.child_by_field_name("superclasses")
            if super_node:
                super_text = _node_text(super_node, source_bytes).strip("()")
                for s in super_text.split(","):
                    sc = s.strip()
                    if sc:
                        raw_calls.append((cls_id, f"inherits:{sc}"))

            for child in cursor_node.children:
                walk_python(child, cls_id)
            return

        elif ntype in ("import_statement", "import_from_statement"):
            import_text = _node_text(cursor_node, source_bytes).strip()
            imp_id = f"import:{rel_path}:{start_line}"
            nodes.append({
                "id": imp_id,
                "label": import_text[:40],
                "type": "Import",
                "path": rel_path,
                "start_line": start_line,
                "end_line": end_line,
                "language": lang,
                "code_snippet": import_text[:1500],
                "summary": "",
                "community": 0,
            })
            edges.append({"source": file_node_id, "target": imp_id, "relation": "imports"})
            return

        elif ntype == "call":
            fn_node = cursor_node.child_by_field_name("function")
            if fn_node:
                callee_name = _node_text(fn_node, source_bytes).split(".")[-1]
                raw_calls.append((current_parent_id, callee_name))

        for child in cursor_node.children:
            walk_python(child, current_parent_id)

    def walk_js(cursor_node, current_parent_id: str):
        ntype = cursor_node.type
        start_line = cursor_node.start_point[0] + 1
        end_line = cursor_node.end_point[0] + 1
        snippet = _node_text(cursor_node, source_bytes)[:1500]

        if ntype in ("function_declaration", "method_definition"):
            name_node = cursor_node.child_by_field_name("name")
            name = _node_text(name_node, source_bytes) if name_node else f"fn_{start_line}"
            fn_id = f"func:{rel_path}:{name}:{start_line}"
            nodes.append({
                "id": fn_id,
                "label": name,
                "type": "Function",
                "path": rel_path,
                "start_line": start_line,
                "end_line": end_line,
                "language": lang,
                "code_snippet": snippet,
                "summary": "",
                "community": 0,
            })
            edges.append({"source": current_parent_id, "target": fn_id, "relation": "contains"})
            for child in cursor_node.children:
                walk_js(child, fn_id)
            return

        elif ntype == "class_declaration":
            name_node = cursor_node.child_by_field_name("name")
            name = _node_text(name_node, source_bytes) if name_node else f"Class_{start_line}"
            cls_id = f"class:{rel_path}:{name}:{start_line}"
            nodes.append({
                "id": cls_id,
                "label": name,
                "type": "Class",
                "path": rel_path,
                "start_line": start_line,
                "end_line": end_line,
                "language": lang,
                "code_snippet": snippet,
                "summary": "",
                "community": 0,
            })
            edges.append({"source": current_parent_id, "target": cls_id, "relation": "contains"})
            for child in cursor_node.children:
                walk_js(child, cls_id)
            return

        elif ntype == "import_statement":
            import_text = _node_text(cursor_node, source_bytes).strip()
            imp_id = f"import:{rel_path}:{start_line}"
            nodes.append({
                "id": imp_id,
                "label": import_text[:40],
                "type": "Import",
                "path": rel_path,
                "start_line": start_line,
                "end_line": end_line,
                "language": lang,
                "code_snippet": import_text[:1500],
                "summary": "",
                "community": 0,
            })
            edges.append({"source": file_node_id, "target": imp_id, "relation": "imports"})
            return

        elif ntype == "call_expression":
            fn_node = cursor_node.child_by_field_name("function")
            if fn_node:
                callee_name = _node_text(fn_node, source_bytes).split(".")[-1]
                raw_calls.append((current_parent_id, callee_name))

        for child in cursor_node.children:
            walk_js(child, current_parent_id)

    if lang == "python":
        walk_python(root, file_node_id)
    else:
        walk_js(root, file_node_id)

    return nodes, edges, raw_calls
