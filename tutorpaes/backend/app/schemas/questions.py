from typing import List, Literal, Optional

from pydantic import BaseModel, Field

from app.schemas.quiz import ChoiceOut

ChoiceLabel = Literal["A", "B", "C", "D"]


class QuestionChoiceIn(BaseModel):
    label: ChoiceLabel
    text: str = Field(min_length=1, max_length=5000)


class QuestionCreateIn(BaseModel):
    subject_code: str = Field(min_length=1, max_length=32)
    topic_code: str = Field(min_length=1, max_length=32)

    prompt: str = Field(min_length=5, max_length=20000)
    reading_text: Optional[str] = Field(default=None, max_length=50000)
    explanation: Optional[str] = Field(default=None, max_length=50000)

    difficulty: int = Field(default=1, ge=1, le=3)

    choices: List[QuestionChoiceIn] = Field(min_length=4, max_length=4)
    correct_choice: ChoiceLabel


class QuestionCreatedOut(BaseModel):
    question_id: int
    subject_code: str
    topic_code: str
    prompt: str
    reading_text: Optional[str] = Field(default=None, max_length=50000)
    explanation: Optional[str] = Field(default=None, max_length=50000)
    difficulty: int

    choices: List[ChoiceOut]
    correct_choice: ChoiceLabel


class RecentQuestionOut(BaseModel):
    question_id: int
    subject_code: str
    topic_code: str
    prompt: str
    reading_text: Optional[str] = Field(default=None, max_length=50000)
    difficulty: int
    created_at: str
    choices: List[ChoiceOut]


class BulkQuestionCreateIn(BaseModel):
    questions: List[QuestionCreateIn] = Field(min_length=1, max_length=200)

    # If true, only validates and returns a report, without writing to DB.
    dry_run: bool = False

    # If true, either all questions are created or none (if there are errors).
    atomic: bool = False


class BulkQuestionErrorOut(BaseModel):
    index: int
    error: str
    detail: Optional[str] = None


class BulkQuestionCreateOut(BaseModel):
    dry_run: bool
    atomic: bool
    total: int
    created: int
    skipped: int
    question_ids: List[int] = []
    errors: List[BulkQuestionErrorOut] = []
