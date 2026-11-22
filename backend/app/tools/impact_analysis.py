"""Impact analysis agent tool: formats upstream and downstream ripple effects."""
from langchain_core.tools import tool
from backend.app.codegraph.impact import analyze_impact


@tool
def impact_analysis(repo_id: str, symbol: str) -> str:
    """Analyze the blast radius of modifying a function, class, or module.

    Reports upstream callers that break if this symbol changes and downstream dependencies.
    """
    res = analyze_impact(repo_id, symbol)
    if "error" in res and res.get("error"):
        return f"Impact analysis failed: {res['error']}"

    target = res.get("target_node") or {}
    upstream = res.get("upstream", [])
    downstream = res.get("downstream", [])

    lines = [
        f"=== Impact Analysis for Symbol: '{target.get('label', symbol)}' ===",
        f"Location: {target.get('path')}:{target.get('start_line')}",
        f"Summary: {res.get('summary')}\n",
        f"--- UPSTREAM RIPPLE EFFECT (What breaks if changed - {len(upstream)} symbols) ---",
    ]

    for item in upstream[:10]:
        lines.append(
            f"  • Dist {item['distance']} | {item['type']} '{item['label']}' in {item['path']}:{item['start_line']}"
        )
    if len(upstream) > 10:
        lines.append(f"  ... and {len(upstream) - 10} more upstream callers.")

    lines.append(f"\n--- DOWNSTREAM DEPENDENCIES (Called or imported - {len(downstream)} symbols) ---")
    for item in downstream[:10]:
        lines.append(
            f"  • Dist {item['distance']} | {item['type']} '{item['label']}' in {item['path']}:{item['start_line']}"
        )
    if len(downstream) > 10:
        lines.append(f"  ... and {len(downstream) - 10} more downstream symbols.")

    return "\n".join(lines)
