"""Web content guardrails: injection filtering, untrusted tags, domain verification."""
import re
from typing import List
from urllib.parse import urlparse

# Patterns that look like prompt injections or system instruction overrides
INSTRUCTION_LINE_PATTERNS = [
    re.compile(r"(?i)^(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior)\s+(?:instructions|prompts)"),
    re.compile(r"(?i)^system\s*:\s*"),
    re.compile(r"(?i)^you\s+are\s+now\s+(?:a|an)\s+"),
    re.compile(r"(?i)^(?:new|override)\s+instructions\s*:"),
    re.compile(r"(?i)^output\s+only\s+:"),
]


def is_allowed_domain(url: str, allowed_domains: List[str]) -> bool:
    """Verify that a URL belongs to one of the configured allowed domains."""
    try:
        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower()
        for allowed in allowed_domains:
            allowed_clean = allowed.strip().lower()
            if hostname == allowed_clean or hostname.endswith(f".{allowed_clean}"):
                return True
        return False
    except Exception:
        return False


def sanitize_web_content(raw_text: str) -> str:
    """Filter out instruction-like lines and wrap in <untrusted_content> container."""
    if not raw_text:
        return "<untrusted_content></untrusted_content>"

    clean_lines = []
    for line in raw_text.splitlines():
        trimmed = line.strip()
        # Drop lines that match prompt injection patterns
        if any(pat.search(trimmed) for pat in INSTRUCTION_LINE_PATTERNS):
            continue
        clean_lines.append(line)

    sanitized = "\n".join(clean_lines).strip()
    return f"<untrusted_content>\n{sanitized}\n</untrusted_content>"
