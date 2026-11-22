"""Output guardrail: extracts citations, highlights nodes, and ensures zero secret leakage."""
import re
from typing import Dict, List, Set, Tuple
from backend.app.guardrails.secrets import redact_secrets

# Regex pattern for file:line citations (e.g. "app/main.py:12-45" or "src/util.ts:25" or "http://...")
CITATION_PATTERN = re.compile(
    r"\b([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+):(\d+)(?:-(\d+))?\b"
)
URL_CITATION_PATTERN = re.compile(
    r"https?:\/\/[^\s)\]]+"
)


def extract_citations(text: str) -> List[str]:
    """Extract code line citations and URL sources from an answer."""
    citations: Set[str] = set()

    for match in CITATION_PATTERN.finditer(text):
        file_path = match.group(1)
        start_line = match.group(2)
        end_line = match.group(3)
        if end_line:
            citations.add(f"{file_path}:{start_line}-{end_line}")
        else:
            citations.add(f"{file_path}:{start_line}")

    for match in URL_CITATION_PATTERN.finditer(text):
        citations.add(match.group(0).rstrip(".,;)"))

    return sorted(citations)


def map_citations_to_nodes(citations: List[str], graph_nodes: List[Dict]) -> List[str]:
    """Identify which graph node IDs correspond to the cited files and lines."""
    highlight_ids: Set[str] = set()
    for citation in citations:
        if ":" in citation and not citation.startswith("http"):
            parts = citation.split(":")
            c_path = parts[0].replace("\\", "/").lower()
            try:
                line_info = parts[1].split("-")[0]
                c_line = int(line_info)
            except (ValueError, IndexError):
                c_line = 1

            for node in graph_nodes:
                n_path = node.get("path", "").replace("\\", "/").lower()
                if c_path.endswith(n_path) or n_path.endswith(c_path):
                    s_line = int(node.get("start_line", 1))
                    e_line = int(node.get("end_line", s_line))
                    if s_line <= c_line <= e_line:
                        highlight_ids.add(node.get("id"))
                    elif node.get("type") == "File":
                        highlight_ids.add(node.get("id"))

    return sorted(highlight_ids)


def guard_output(raw_answer: str, graph_nodes: List[Dict]) -> Tuple[str, List[str], List[str]]:
    """Sanitize output by masking secrets, extracting citations, and mapping highlight nodes.

    Returns:
        (sanitized_answer, citations, highlight_node_ids)
    """
    clean_answer = redact_secrets(raw_answer)
    citations = extract_citations(clean_answer)
    highlight_ids = map_citations_to_nodes(citations, graph_nodes)
    return clean_answer, citations, highlight_ids
