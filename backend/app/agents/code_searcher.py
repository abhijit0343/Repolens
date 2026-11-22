"""Code searcher agent: runs vector code search and targeted file inspections."""
from typing import Any, Dict
from backend.app.llm import get_tagged_llm
from backend.app.state import AgentState
from backend.app.tools.code_search import code_search
from backend.app.tools.read_file import read_file


def code_searcher_node(state: AgentState) -> Dict[str, Any]:
    """Execute code search over Chroma vector store and read specific file ranges."""
    repo_id = state.get("repo_id", "")
    question = state.get("question", "")
    searches_used = state.get("searches_used", 0) + 1
    evidence = list(state.get("evidence", []))

    # 1. Execute code search
    search_out = code_search.invoke({"repo_id": repo_id, "query": question, "top_k": 3})
    evidence.append({
        "source": "code_search",
        "query": question,
        "content": search_out,
    })

    # 2. If a specific file is identified, read a snippet
    llm = None
    try:
        llm = get_tagged_llm("code_searcher", temperature=0.1)
    except Exception:
        llm = None

    if llm and "Citation:" in search_out:
        prompt = (
            f"Review search results:\n{search_out[:800]}\n"
            "Is there a specific file path and line number you need to read in detail? "
            "Reply with PATH: <file_path> or NONE."
        )
        try:
            resp = llm.invoke(prompt)
            if "PATH:" in resp.content:
                fpath = resp.content.split("PATH:")[1].strip().split()[0]
                read_out = read_file.invoke({"repo_id": repo_id, "file_path": fpath, "start_line": 1, "end_line": 60})
                evidence.append({"source": "read_file", "path": fpath, "content": read_out})
        except Exception:
            pass

    return {
        "evidence": evidence,
        "searches_used": searches_used,
        "next_agent": "planner",
    }
