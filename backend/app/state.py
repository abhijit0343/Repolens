"""LangGraph multi-agent workflow state definition for RepoLens."""
from typing import Any, Dict, List, TypedDict


class AgentState(TypedDict, total=False):
    """Execution state passed through the LangGraph multi-agent workflow."""

    # Context & Request
    repo_id: str
    question: str
    graph_nodes: List[Dict[str, Any]]

    # Planning & Navigation
    plan: List[str]
    completed_steps: List[str]
    current_step: str
    next_agent: str  # "code_searcher", "graph_analyst", "web_docs", "critic", "end"

    # Collected Evidence & Diagnostics
    evidence: List[Dict[str, Any]]

    # Synthesis & Results
    answer: str
    citations: List[str]
    highlight_node_ids: List[str]

    # Guardrails & Resource Tracking
    guardrail: Dict[str, str]  # {"status": "ok|blocked_injection|refused|budget", "reason": ""}
    steps_used: int
    searches_used: int
