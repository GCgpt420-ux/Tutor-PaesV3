"""Schemas for quiz completion.

This module intentionally re-exports the canonical `TopicCompletedOut` schema
from `app.schemas.quiz` to avoid having multiple divergent definitions.
"""

from app.schemas.quiz import TopicCompletedOut  # noqa: F401
