"""Chroma vector store embedding and collection management per repository.

Embeds code snippets and architectural node summaries using Gemini embeddings.
Stores metadata: path, start_line, end_line, node_id, label, type.
"""
from typing import Any, Dict, List
import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_chroma import Chroma
import networkx as nx
from backend.app.config import settings
from backend.app.llm import get_embeddings


def get_chroma_client() -> chromadb.PersistentClient:
    """Instantiate a persistent Chroma client pointing to data/chroma."""
    chroma_path = str(settings.chroma_dir)
    return chromadb.PersistentClient(
        path=chroma_path,
        settings=ChromaSettings(allow_reset=True, anonymized_telemetry=False),
    )


def collection_name_for_repo(repo_id: str) -> str:
    """Format safe collection name for ChromaDB (3-63 chars, alphanumeric, underscores/hyphens)."""
    clean = repo_id.replace("/", "_").replace(".", "_").replace("-", "_").lower()
    return f"repo_{clean}"[:60]


def get_repo_vectorstore(repo_id: str) -> Chroma:
    """Return a LangChain Chroma vector store instance for the repository."""
    embeddings = get_embeddings()
    col_name = collection_name_for_repo(repo_id)
    return Chroma(
        collection_name=col_name,
        embedding_function=embeddings,
        persist_directory=str(settings.chroma_dir),
    )


def embed_code_graph(repo_id: str, G: nx.DiGraph) -> int:
    """Embed code chunks and summaries from all indexable nodes in the graph into Chroma."""
    client = get_chroma_client()
    col_name = collection_name_for_repo(repo_id)

    # Reset or retrieve collection
    try:
        client.delete_collection(col_name)
    except Exception:
        pass

    vectorstore = get_repo_vectorstore(repo_id)

    texts: List[str] = []
    metadatas: List[Dict[str, Any]] = []
    ids: List[str] = []

    for node_id, data in G.nodes(data=True):
        ntype = data.get("type", "")
        # Only embed code-bearing nodes
        if ntype not in ("Function", "Class", "File", "Module"):
            continue

        label = data.get("label", "")
        path = data.get("path", "")
        summary = data.get("summary", "")
        code = data.get("code_snippet", "")

        # Rich text combining summary and code snippet for semantic search
        doc_text = f"Symbol: {label} ({ntype})\nFile: {path}\nSummary: {summary}\n\n{code}".strip()
        if not doc_text:
            continue

        texts.append(doc_text)
        metadatas.append({
            "node_id": node_id,
            "label": label,
            "type": ntype,
            "path": path,
            "start_line": int(data.get("start_line", 1)),
            "end_line": int(data.get("end_line", 1)),
        })
        ids.append(node_id)

    if texts:
        # Add documents in batches of 50 to avoid payload limits
        batch_size = 50
        for i in range(0, len(texts), batch_size):
            vectorstore.add_texts(
                texts=texts[i : i + batch_size],
                metadatas=metadatas[i : i + batch_size],
                ids=ids[i : i + batch_size],
            )

    return len(texts)
