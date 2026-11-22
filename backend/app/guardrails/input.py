"""Input security guardrails: injection detection and code execution refusal.

Detects jailbreak and injection patterns, and blocks requests attempting to run,
execute, or modify repository code on the host machine.
"""
import re
from typing import Tuple

# Common prompt injection and jailbreak patterns
INJECTION_PATTERNS = [
    re.compile(r"(?i)\bignore\s+(?:all\s+)?(?:previous|prior)\s+(?:instructions|prompts)\b"),
    re.compile(r"(?i)\byou\s+are\s+now\s+(?:an?\s+)?(?:dan|unrestricted|god\s+mode|jailbroken)\b"),
    re.compile(r"(?i)\bdisregard\s+(?:system\s+)?rules\b"),
    re.compile(r"(?i)\bprint\s+(?:the\s+)?(?:system\s+prompt|\.env|api[_\s]key)\b"),
    re.compile(r"(?i)\bshow\s+(?:me\s+)?(?:your\s+)?system\s+instructions\b"),
]

# Requests to execute or mutate host system or repo files
EXECUTION_REFUSAL_PATTERNS = [
    re.compile(r"(?i)\b(?:execute|run|start)\s+(?:this\s+)?(?:bash|shell|terminal|powershell|cmd|script|code|command)\b"),
    re.compile(r"(?i)\b(?:delete|modify|overwrite|edit|rm\s+-rf|drop\s+database)\s+"),
    re.compile(r"(?i)\b(?:install|pip\s+install|npm\s+install|curl\s+|wget\s+)\b"),
    re.compile(r"(?i)\bformat\s+(?:the\s+)?(?:hard\s+drive|disk|c:)\b"),
]


def check_input_guardrail(question: str) -> Tuple[bool, str, str]:
    """Validate user prompt against injection and execution exploits.

    Returns:
        (is_safe, status, reason)
        status: "ok", "blocked_injection", or "refused"
    """
    if not question or not question.strip():
        return False, "refused", "Empty question received."

    text = question.strip()

    # Check for prompt injection
    for pattern in INJECTION_PATTERNS:
        if pattern.search(text):
            return False, "blocked_injection", "Prompt injection pattern detected in user input."

    # Check for execution or destructive mutation requests
    for pattern in EXECUTION_REFUSAL_PATTERNS:
        if pattern.search(text):
            return (
                False,
                "refused",
                "RepoLens is a read-only codebase explorer. Running or modifying code is prohibited.",
            )

    return True, "ok", ""
