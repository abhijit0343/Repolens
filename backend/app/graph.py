"""LangGraph StateGraph assembly for RepoLens deep codebase investigation workflow.

Workflow:
input_guard -> planner -> [code_searcher | graph_analyst | web_docs] -> critic -> output_guard -> END
"""
from typing import Any, Dict, Literal
from langgraph.graph import END, StateGraph
from backend.app.agents.code_searcher import code_searcher_node
from backend.app.agents.critic import critic_node
from backend.app.agents.graph_analyst import graph_analyst_node
from backend.app.agents.planner import planner_node
from backend.app.agents.web_docs import web_docs_node
from backend.app.guardrails.input import check_input_guardrail
from backend.app.guardrails.output import guard_output
from backend.app.state import AgentState


def input_guard_node(state: AgentState) -> Dict[str, Any]:
    """Inspect input question for prompt injections or malicious execution commands."""
    question = state.get("question", "")
    is_safe, status, reason = check_input_guardrail(question)
    if not is_safe:
        return {
            "guardrail": {"status": status, "reason": reason},
            "answer": f"Request blocked by guardrails: {reason}",
            "next_agent": "output_guard",
        }
    return {
        "guardrail": {"status": "ok", "reason": ""},
        "next_agent": "planner",
    }


def output_guard_node(state: AgentState) -> Dict[str, Any]:
    """Sanitize answer, redact secrets, extract citations, and map highlighted nodes."""
    raw_answer = state.get("answer", "")
    graph_nodes = state.get("graph_nodes", [])
    clean_ans, citations, highlight_ids = guard_output(raw_answer, graph_nodes)

    guardrail_info = state.get("guardrail", {"status": "ok", "reason": ""})
    return {
        "answer": clean_ans,
        "citations": citations,
        "highlight_node_ids": highlight_ids,
        "guardrail": guardrail_info,
    }


def route_input_guard(state: AgentState) -> Literal["planner", "output_guard"]:
    """Branch after input check: abort immediately if injection or refusal triggered."""
    if state.get("guardrail", {}).get("status") in ("blocked_injection", "refused"):
        return "output_guard"
    return "planner"


def route_planner(state: AgentState) -> Literal["code_searcher", "graph_analyst", "web_docs", "critic"]:
    """Branch from planner to chosen specialist or final critic."""
    next_step = state.get("next_agent", "code_searcher")
    if next_step in ("code_searcher", "graph_analyst", "web_docs", "critic"):
        return next_step
    return "critic"


def create_repolens_graph() -> StateGraph:
    """Build and compile the multi-agent StateGraph workflow."""
    workflow = StateGraph(AgentState)

    # Add workflow nodes
    workflow.add_node("input_guard", input_guard_node)
    workflow.add_node("planner", planner_node)
    workflow.add_node("code_searcher", code_searcher_node)
    workflow.add_node("graph_analyst", graph_analyst_node)
    workflow.add_node("web_docs", web_docs_node)
    workflow.add_node("critic", critic_node)
    workflow.add_node("output_guard", output_guard_node)

    # Set entry point
    workflow.set_entry_point("input_guard")

    # Connect conditional routing
    workflow.add_conditional_edges("input_guard", route_input_guard, {
        "planner": "planner",
        "output_guard": "output_guard",
    })

    workflow.add_conditional_edges("planner", route_planner, {
        "code_searcher": "code_searcher",
        "graph_analyst": "graph_analyst",
        "web_docs": "web_docs",
        "critic": "critic",
    })

    # Looping edges back to planner for iterative search
    workflow.add_edge("code_searcher", "planner")
    workflow.add_edge("graph_analyst", "planner")
    workflow.add_edge("web_docs", "planner")

    # Finalization edges
    workflow.add_edge("critic", "output_guard")
    workflow.add_edge("output_guard", END)

    return workflow.compile()


app_workflow = create_repolens_graph()
