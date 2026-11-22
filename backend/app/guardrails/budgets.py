"""Budget guardrails: enforces execution step limits, search limits, and token budgets."""
from backend.app.config import settings


class ExecutionBudget:
    """Tracks and enforces limits across a single user question investigation session."""

    def __init__(self):
        self.max_steps = settings.max_agent_steps
        self.max_searches = settings.max_searches
        self.max_tokens = settings.max_tokens_per_session

    def is_step_budget_exceeded(self, steps_used: int) -> bool:
        """Check if max agent steps cap has been reached."""
        return steps_used >= self.max_steps

    def is_search_budget_exceeded(self, searches_used: int) -> bool:
        """Check if max external/vector search queries cap has been reached."""
        return searches_used >= self.max_searches


budget_guard = ExecutionBudget()
