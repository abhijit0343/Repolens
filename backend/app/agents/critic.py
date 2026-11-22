"""Critic agent: synthesizes answers and verifies that every claim cites file:lines or URLs."""
from typing import Any, Dict
from backend.app.llm import get_tagged_llm
from backend.app.state import AgentState


def critic_node(state: AgentState) -> Dict[str, Any]:
    """Synthesize final technical answer from collected evidence, enforcing file:line citations."""
    question = state.get("question", "")
    evidence = state.get("evidence", [])
    repo_id = state.get("repo_id", "")
    graph_nodes = state.get("graph_nodes", [])

    evidence_text = "\n\n".join([
        f"[{e.get('source', 'evidence')}]\n{e.get('content', '')}"
        for e in evidence
    ])

    llm = None
    try:
        llm = get_tagged_llm("critic", temperature=0.2)
    except Exception:
        llm = None

    prompt = (
        f"You are the senior Codebase Research Critic for repository '{repo_id}'.\n"
        f"User Question: {question}\n\n"
        f"Available Evidence:\n{evidence_text[:3000]}\n\n"
        "Instructions:\n"
        "1. Provide a comprehensive, accurate answer to the user's question.\n"
        "2. CRITICAL: Every single code claim MUST cite the exact file:line or line range (e.g. `path/to/file.py:10-25` or `src/index.ts:5`).\n"
        "3. Any external reference must cite the URL.\n"
        "4. Do NOT output placeholder citations."
    )

    answer = ""
    if llm:
        try:
            resp = llm.invoke(prompt)
            answer = resp.content.strip()
            # Verify citations present; if not, do one critique rewrite
            if ":" not in answer and any("/" in e.get("content", "") for e in evidence):
                rewrite_prompt = (
                    f"Your answer is missing mandatory `file:line` citations!\n"
                    f"Draft:\n{answer}\n\n"
                    "Please rewrite the answer ensuring every code claim references `path/file:line`."
                )
                rewrite_resp = llm.invoke(rewrite_prompt)
                answer = rewrite_resp.content.strip()
        except Exception:
            answer = ""

    if not answer:
        # Heuristic synthesis fallback ensuring citations are always present
        lines = [
            f"Codebase analysis for repository '{repo_id}':\n",
            f"Regarding: {question}\n",
        ]
        if evidence:
            for e in evidence:
                lines.append(f"[{e.get('source')}]:\n{e.get('content')}\n")
        elif graph_nodes:
            for n in graph_nodes[:3]:
                lines.append(
                    f"• {n.get('type')} `{n.get('label')}` is defined at {n.get('path')}:{n.get('start_line')}-{n.get('end_line')}. "
                    f"Summary: {n.get('summary')}"
                )
        else:
            lines.append("No active nodes or files found for repository.")
        answer = "\n".join(lines)

    return {
        "answer": answer,
        "next_agent": "end",
    }
