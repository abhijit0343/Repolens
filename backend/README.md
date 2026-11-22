# RepoLens Backend

High-performance GraphRAG and multi-agent codebase analysis service.

## Architecture

- **Ingestion**: Shallow git cloning (`--depth 1`) with secure token routing through Git environment headers. File filtering caps size (200KB) and file counts (2000).
- **Code Graph (GraphRAG)**: AST extraction using Tree-Sitter (Python, JS/TS) generates `File`, `Module`, `Class`, `Function`, and `Import` nodes linked by `contains`, `imports`, `calls`, and `inherits` edges.
- **Communities**: Louvain modularity clustering partitions the codebase into architectural module groups.
- **3D Layout**: NetworkX 3D spring layout (`dim=3`, `seed=42`) normalized to unit space `[0..1]` for Three.js rendering.
- **Multi-Agent Workflow (LangGraph)**:
  `input_guard` -> `planner` -> `[code_searcher | graph_analyst | web_docs]` -> `critic` -> `output_guard` -> `END`.
- **Citations**: All technical answers strictly enforce `file:line` or URL citations.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health status |
| `POST` | `/repos` | Trigger repository background shallow clone and indexing |
| `GET` | `/repos/{id}/status` | Check real-time indexing status and statistics |
| `GET` | `/repos/{id}/graph` | Download full 3D layout JSON for WebGL rendering |
| `GET` | `/repos/{id}/node/{id}` | Inspect node summary, code snippet, callers, callees |
| `GET` | `/repos/{id}/impact?symbol=` | Calculate upstream blast radius and downstream deps |
| `POST` | `/repos/{id}/ask` | Query deep multi-agent workflow for cited answers |

## Running the Backend

```bash
cd backend
python -m uvicorn backend.app.main:app --port 8000 --reload
```

## Running Tests

```bash
pytest
```
