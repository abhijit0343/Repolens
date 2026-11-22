"""Secrets detection and redaction guardrail.

Detects and masks sensitive credentials (API keys, GitHub tokens, AWS keys,
Google keys, JWTs, PEM private keys) before indexing files or emitting answers.
"""
import re
from typing import Dict, List, Tuple

# Patterns for identifying various secrets
SECRET_PATTERNS: List[Tuple[str, re.Pattern]] = [
    ("AWS Access Key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("AWS Secret Key", re.compile(r"\b(?i:aws_secret_access_key|aws_sec_key)[\s:=]+([a-zA-Z0-9/+=]{40})\b")),
    ("GitHub Token", re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}\b")),
    ("GitHub Personal Access Token", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{82}\b")),
    ("Google API Key", re.compile(r"\bAIza[0-9A-Za-z_\-]{30,45}\b")),
    ("JWT Token", re.compile(r"\beyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*\b")),
    ("Private Key Block", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----")),
    ("Generic Bearer/Secret", re.compile(r"(?i)(?:api_key|secret_key|auth_token|bearer)\s*[:=]\s*['\"]([A-Za-z0-9\-_]{20,})['\"]")),
]


def detect_secrets(text: str) -> List[Dict[str, str]]:
    """Scan text for known secret patterns and return detected occurrences."""
    if not text:
        return []
    findings = []
    for label, pattern in SECRET_PATTERNS:
        matches = pattern.finditer(text)
        for m in matches:
            findings.append({
                "type": label,
                "span": m.span(),
            })
    return findings


def redact_secrets(text: str) -> str:
    """Mask all detected secrets in text with [REDACTED:<type>]."""
    if not text:
        return text

    sanitized = text
    # Mask private key blocks first
    for label, pattern in SECRET_PATTERNS:
        if "Private Key" in label:
            sanitized = pattern.sub("[REDACTED_PRIVATE_KEY]", sanitized)
        elif "Bearer/Secret" in label:
            sanitized = pattern.sub(r'\1: "[REDACTED_SECRET]"', sanitized)
        else:
            sanitized = pattern.sub(f"[REDACTED_{label.upper().replace(' ', '_')}]", sanitized)

    return sanitized
