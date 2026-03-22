from pydantic import BaseModel
from typing import List, Optional, Dict, Literal


class ChoiceOut(BaseModel):
    id: int
    label: str
    text: str


class QuestionOut(BaseModel):
    kind: Literal["question"] = "question"
    question_id: int
    prompt: str
    topic: str
    reading_text: Optional[str] = None
    choices: List[ChoiceOut]


class AnswerIn(BaseModel):
    # `user_id` se deriva del JWT (get_current_user). Se mantiene opcional por compatibilidad hacia atrás.
    user_id: Optional[int] = None
    subject_code: str
    topic_code: str
    question_id: int
    selected_choice_id: int


class AnswerOut(BaseModel):
    attempt_id: int
    feedback_id: int
    is_correct: bool
    feedback_text: str
    is_attempt_finished: bool
    ai_payload: Dict = {}


class TopicCompletedOut(BaseModel):
    kind: Literal["topic_completed"] = "topic_completed"
    message: str
    attempt_id: int
    status: str
    total_questions: int
    correct_count: int
    score_percentage: int
    score_paes: int
    score: int


class AIFeedbackOut(BaseModel):
    explanation: str
    is_correct: bool
    source: str
    correct_choice_id: Optional[int] = None
    correct_choice_label: Optional[str] = None


class AttemptFeedbackDetailOut(BaseModel):
    question_id: int
    prompt: str
    reading_text: Optional[str] = None
    selected_choice_id: Optional[int]
    selected_choice_text: Optional[str]
    correct_choice_id: Optional[int]
    correct_choice_text: Optional[str]
    is_correct: bool
    ai_explanation: Optional[str] = None


class AttemptResultOut(BaseModel):
    attempt_id: int
    exam_id: int
    subject_id: int
    topic_id: Optional[int]
    status: str
    score: Optional[int]
    total_questions: int
    correct_count: int
    started_at: str
    completed_at: Optional[str] = None
    answers_detail: List[AttemptFeedbackDetailOut]
