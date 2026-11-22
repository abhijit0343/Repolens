"""Planner agent: decomposes user inquiries, maintains task plan, routes to specialist agents."""
from typing import Any, Dict
from backend.app.guardrails.budgets import budget_guard
from backend.app.llm import get_tagged_llm
from backend.app.state import AgentState


def planner_node(state: AgentState) -> Dict[str, Any]:
    """Examine current state, update plan, and route to the next appropriate specialist agent."""
    steps_used = state.get("steps_used", 0) + 1
    searches_used = state.get("searches_used", 0)
    question = state.get("question", "")
    evidence = state.get("evidence", [])
    plan = state.get("plan", [])

    # Check budget constraints
    if budget_guard.is_step_budget_exceeded(steps_used):
        return {
            "steps_used": steps_used,
            "next_agent": "critic",
            "guardrail": {
                "status": "budget",
                "reason": "Max agent steps budget reached. Proceeding to finalize answer with available evidence.",
            },
        }

    # If we already have sufficient evidence, proceed to critic
    if len(evidence) >= 3 or (len(evidence) >= 1 and any("Citation:" in str(e) for e in evidence)):
        return {
            "steps_used": steps_used,
            "next_agent": "critic",
        }

    # Initial plan creation or routing decision
    llm = None
    try:
        llm = get_tagged_llm("planner", temperature=0.1)
    except Exception:
        llm = None

    if not plan and llm:
        prompt = (
            f"You are a technical investigation planner for repository '{state.get('repo_id')}'.\n"
            f"Question: {question}\n\n"
            "Pick ONE next agent from: [code_searcher, graph_analyst, web_docs, critic].\n"
            "Format: NEXT: <agent_name>"
        )
        try:
            resp = llm.invoke(prompt)
            content = resp.content.lower()
            if "graph_analyst" in content:
                next_agent = "graph_analyst"
            elif "web_docs" in content:
                next_agent = "web_docs"
            elif "critic" in content:
                next_agent = "critic"
            else:
                next_agent = "code_searcher"
        except Exception:
            next_agent = "code_searcher"
    else:
        # Heuristic routing based on question keywords
        q_lower = question.lower()
        if "impact" in q_lower or "call" in q_lower or "depend" in q_lower or "architecture" in q_lower:
            next_agent = "graph_analyst"
        elif "official doc" in q_lower or "http" in q_lower or "library version" in q_lower:
            next_agent = "web_docs"
        else:
            next_agent = "code_searcher"

    return {
        "steps_used": steps_used,
        "plan": plan or ["Analyze question", f"Query {next_agent}", "Synthesize & cite"],
        "next_agent": next_agent,
    }
