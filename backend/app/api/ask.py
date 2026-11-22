"""Ask API: answers codebase questions using the LangGraph multi-agent workflow."""
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.app.codegraph.store import load_graph_json
from backend.app.graph import app_workflow

router = APIRouter(prefix="/repos", tags=["ask"])


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str
    citations: List[str]
    highlight_node_ids: List[str]
    guardrail: Dict[str, str]
    steps_used: int


@router.post("/{repo_id}/ask", response_model=AskResponse)
def ask_codebase_question(repo_id: str, req: AskRequest) -> Dict[str, Any]:
    """Execute LangGraph multi-agent investigation and return cited technical answer."""
    # Attempt to load graph nodes to enable 3D node highlighting
    try:
        graph_data = load_graph_json(repo_id)
        nodes = graph_data.get("nodes", [])
    except Exception:
        nodes = []

    initial_state = {
        "repo_id": repo_id,
        "question": req.question,
        "graph_nodes": nodes,
        "steps_used": 0,
        "searches_used": 0,
    }

    try:
        final_state = app_workflow.invoke(initial_state)
        return {
            "answer": final_state.get("answer", "No answer could be generated."),
            "citations": final_state.get("citations", []),
            "highlight_node_ids": final_state.get("highlight_node_ids", []),
            "guardrail": final_state.get("guardrail", {"status": "ok", "reason": ""}),
            "steps_used": final_state.get("steps_used", 1),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Workflow execution failed: {exc}")
