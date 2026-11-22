"""Web documentation agent: retrieves official external documentation on allowed domains."""
from typing import Any, Dict
from backend.app.state import AgentState
from backend.app.tools.web_search import web_search


def web_docs_node(state: AgentState) -> Dict[str, Any]:
    """Search official documentation and knowledge sources on allowed domains."""
    question = state.get("question", "")
    searches_used = state.get("searches_used", 0) + 1
    evidence = list(state.get("evidence", []))

    search_result = web_search.invoke({"query": question})
    evidence.append({
        "source": "web_docs",
        "query": question,
        "content": search_result,
    })

    return {
        "evidence": evidence,
        "searches_used": searches_used,
        "next_agent": "planner",
    }
