"""Code search tool: retrieves semantically matching code chunks with line citations."""
from langchain_core.tools import tool
from backend.app.rag.retriever import retrieve_code


@tool
def code_search(repo_id: str, query: str, top_k: int = 5) -> str:
    """Search repository code chunks and AST summaries for semantic relevance.

    Args:
        repo_id: The repository identifier (e.g. 'owner__repo').
        query: Search query describing functionality, symbol, or question.
        top_k: Number of matching code results to return.
    """
    results = retrieve_code(repo_id, query, top_k=top_k)
    if not results:
        return f"No code snippets found matching '{query}' in repo '{repo_id}'."

    output_lines = [f"Found {len(results)} relevant code snippets for query '{query}':\n"]
    for i, res in enumerate(results, 1):
        output_lines.append(
            f"--- Snippet {i} [{res['type']} {res['label']}] ---"
        )
        output_lines.append(f"Citation: {res['path']}:{res['start_line']}-{res['end_line']}")
        output_lines.append(f"Relevance Score: {res['score']:.3f}")
        output_lines.append(f"Content:\n{res['content']}\n")

    return "\n".join(output_lines)
