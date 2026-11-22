"""Web documentation search tool using Tavily API.

Strictly filters domains to ALLOWED_DOMAINS and wraps results in untrusted containers.
"""
from langchain_core.tools import tool
from tavily import TavilyClient
from backend.app.config import settings
from backend.app.guardrails.web import sanitize_web_content


@tool
def web_search(query: str) -> str:
    """Search external official documentation on allowed domains for frameworks, libraries, and APIs.

    Args:
        query: Specific programming question or API reference search.
    """
    try:
        client = TavilyClient(api_key=settings.tavily_api_key)
        # Filter domains strictly
        domains = settings.allowed_domains_list
        response = client.search(
            query=query,
            search_depth="basic",
            include_domains=domains,
            max_results=3,
        )

        results = response.get("results", [])
        if not results:
            return f"No external documentation results found on allowed domains {domains} for '{query}'."

        formatted = [f"Web search results on allowed domains for '{query}':\n"]
        for r in results:
            url = r.get("url", "")
            title = r.get("title", "")
            content = r.get("content", "")
            # Apply security sanitation
            safe_content = sanitize_web_content(content)
            formatted.append(f"Source: {url} ({title})\n{safe_content}\n")

        return "\n".join(formatted)
    except Exception as exc:
        return f"Web search could not be executed: {exc}"
