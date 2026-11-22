"""Pytest configuration: disable remote tracing during automated tests."""
import os

# Prevent remote LangSmith network delays during test execution
os.environ["LANGCHAIN_TRACING_V2"] = "false"
os.environ["LANGCHAIN_API_KEY"] = ""
