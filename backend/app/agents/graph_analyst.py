"""Graph analyst agent: explores the knowledge graph, callers/callees, and impact blast radiuses."""
from typing import Any, Dict
from backend.app.llm import get_tagged_llm
from backend.app.state import AgentState
from backend.app.tools.graph_search import graph_search
from backend.app.tools.impact_analysis import impact_analysis


def graph_analyst_node(state: AgentState) -> Dict[str, Any]:
    """Analyze structural graph neighborhoods and symbol impact relationships."""
    repo_id = state.get("repo_id", "")
    question = state.get("question", "")
    evidence = list(state.get("evidence", []))

    # Extract target symbol from question or use heuristic
    llm = None
    try:
        llm = get_tagged_llm("graph_analyst", temperature=0.1)
    except Exception:
        llm = None

    target_symbol = question.split()[0]
    if llm:
        try:
            resp = llm.invoke(
                f"Extract the primary code symbol, function, or class name from: '{question}'. "
                "Reply with just the symbol name or NONE."
            )
            parsed = resp.content.strip().split()[0]
            if parsed != "NONE":
                target_symbol = parsed
        except Exception:
            pass

    # Run graph search
    g_out = graph_search.invoke({"repo_id": repo_id, "symbol_or_query": target_symbol})
    evidence.append({
        "source": "graph_search",
        "symbol": target_symbol,
        "content": g_out,
    })

    # If question mentions impact or break, run impact analysis
    if "impact" in question.lower() or "break" in question.lower() or "call" in question.lower():
        imp_out = impact_analysis.invoke({"repo_id": repo_id, "symbol": target_symbol})
        evidence.append({
            "source": "impact_analysis",
            "symbol": target_symbol,
            "content": imp_out,
        })

    return {
        "evidence": evidence,
        "next_agent": "planner",
    }
