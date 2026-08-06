from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class RankingEntryOut(BaseModel):
    rank: int
    user_id: int
    name: str
    total_attempts: int
    average_score: float
    best_score: int
    accuracy: float


class ExamAttemptOut(BaseModel):
    id: int
    exam_id: int
    exam_title: str
    subject_id: int
    topic_id: Optional[int] = None
    status: str  # "in_progress", "completed", "abandoned"
    total_questions: int
    correct_count: int
    incorrect_count: int
    omitted_count: int
    score: Optional[int] = None
    started_at: datetime
    completed_at: Optional[datetime] = None


class TopicStats(BaseModel):
    topic_name: str
    topic_code: str
    accuracy: float
    questions: int
    correct: int
    completed_at: Optional[str] = None


class SubjectStats(BaseModel):
    subject_code: str
    subject_name: str
    topics: List[TopicStats]


class UserStatsOut(BaseModel):
    user_id: int
    total_subjects: int
    completed_subjects: int
    overall_accuracy: float
    subjects: List[SubjectStats]
