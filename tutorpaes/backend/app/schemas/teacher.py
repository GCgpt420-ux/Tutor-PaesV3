from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class CourseOut(BaseModel):
    course_id: int
    name: str
    student_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class StudentOut(BaseModel):
    student_id: int
    name: str
    email: str
    total_attempts: int
    average_score: float
    average_accuracy: float

class CourseDetailOut(BaseModel):
    course_id: int
    name: str
    students: List[StudentOut]

class TopicPerformanceOut(BaseModel):
    topic_id: int
    topic_code: str
    topic_name: str
    subject_name: str
    average_accuracy: float
    students_attempted: int
