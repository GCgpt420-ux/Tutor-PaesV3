from pydantic import BaseModel, Field
from typing import Literal, Optional

class CustomExamCreateIn(BaseModel):
    title: str = Field(min_length=3, max_length=100)
    duration_minutes: int = Field(ge=15, le=300, default=150)
    selected_subjects: list[int] = Field(default_factory=list)
    selected_topics: list[int] = Field(default_factory=list)
    difficulty: Literal["all", "easy", "medium", "hard"] = "all"
    num_questions: int = Field(ge=5, le=200, default=40)


class CustomExamCreateOut(BaseModel):
    exam_id: int
    code: str
    name: str
    is_custom: bool
    question_count: int
    duration_minutes: int
    created_by: Optional[str] = None
    created_at: str
