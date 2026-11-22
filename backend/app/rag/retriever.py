"""Retriever module for semantic search over code chunks and summaries."""
from typing import Any, Dict, List
from backend.app.rag.embed import get_repo_vectorstore


def retrieve_code(repo_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Retrieve top-k relevant code chunks and node metadata from Chroma."""
    try:
        store = get_repo_vectorstore(repo_id)
        docs_and_scores = store.similarity_search_with_relevance_scores(query, k=top_k)

        results = []
        for doc, score in docs_and_scores:
            results.append({
                "node_id": doc.metadata.get("node_id", ""),
                "label": doc.metadata.get("label", ""),
                "type": doc.metadata.get("type", ""),
                "path": doc.metadata.get("path", ""),
                "start_line": doc.metadata.get("start_line", 1),
                "end_line": doc.metadata.get("end_line", 1),
                "content": doc.page_content,
                "score": float(score) if score is not None else 0.0,
            })
        return results
    except Exception as exc:
        print(f"[RETRIEVER ERROR] Failed to query Chroma for {repo_id}: {exc}")
        return []
