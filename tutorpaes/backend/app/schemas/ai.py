from pydantic import BaseModel
from typing import Optional

class AIExplainIn(BaseModel):
    question_id: int


class AIExplainOut(BaseModel):
    explanation: str
    question_content: str
    correct_answer: str
    metadata: dict


class ChatIn(BaseModel):
    message: str
    attempt_id: Optional[int] = None
    question_context: Optional[dict] = None
