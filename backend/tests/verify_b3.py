"""Verification script for Phase B3: Code Graph Builder, Communities, and Store."""
import tempfile
from pathlib import Path
from backend.app.ingest.scan import scan_repository
from backend.app.codegraph.builder import build_code_graph
from backend.app.codegraph.communities import detect_communities
from backend.app.codegraph.summarize import summarize_graph
from backend.app.codegraph.store import save_graph_json, load_graph_json


def verify_b3():
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        src = root / "pkg"
        src.mkdir(parents=True)
        (src / "calc.py").write_text(
            """
class Evaluator:
    def evaluate(self, expr: str):
        return self.compute(expr)

    def compute(self, expr: str):
        return str(expr)

def main():
    ev = Evaluator()
    return ev.evaluate("test")
""",
            encoding="utf-8",
        )

        (src / "utils.ts").write_text(
            """
export function logMessage(msg: string) {
    console.log(msg);
}
""",
            encoding="utf-8",
        )

        scanned = scan_repository(root)
        assert len(scanned) == 2, f"Expected 2 scanned files, got {len(scanned)}"

        G = build_code_graph(scanned)
        assert len(G.nodes) > 0, "Graph should have nodes"
        print(f"Constructed graph with {len(G.nodes)} nodes, {len(G.edges)} edges.")

        clusters = detect_communities(G)
        print(f"Detected {len(clusters)} communities.")

        comms = summarize_graph(G, clusters, max_llm_calls=0)
        out_file = save_graph_json("sample_verify", G, comms)
        data = load_graph_json("sample_verify")

        # Schema verification
        assert "nodes" in data and "edges" in data and "communities" in data
        assert len(data["nodes"]) == len(G.nodes)
        first_node = data["nodes"][0]
        for key in ["id", "label", "type", "path", "start_line", "end_line", "summary", "community", "x", "y", "z"]:
            assert key in first_node, f"Node missing key: {key}"
            if key in ("x", "y", "z"):
                assert 0.0 <= first_node[key] <= 1.0, f"Coordinate {key} out of range: {first_node[key]}"

        if data["edges"]:
            first_edge = data["edges"][0]
            for key in ["source", "target", "relation"]:
                assert key in first_edge, f"Edge missing key: {key}"

        print("B3 Code Graph and JSON Schema Verification PASSED!")


if __name__ == "__main__":
    verify_b3()
