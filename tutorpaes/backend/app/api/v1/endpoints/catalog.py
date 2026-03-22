"""
Catalog endpoints - Exámenes, asignaturas, temas
Sin autenticación requerida (catálogo público)
"""
import random
from datetime import datetime, timezone
from typing import Literal

from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from app.core.auth import get_current_user
from app.db.session import get_db
from app.db.models import Exam, Subject, Topic, Question, User
from app.core.exceptions import bad_request, not_found

router = APIRouter(prefix="/catalog", tags=["catalog"])


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
    created_by: str | None
    created_at: str


def _topics_with_active_questions_query(subject_id: int):
    return (
        select(Topic)
        .where(
            Topic.subject_id == subject_id,
            Topic.id.in_(
                select(Question.topic_id).where(Question.is_active == True)  # noqa: E712
            ),
        )
        .order_by(Topic.id.asc())
    )


@router.post("/exams/custom", response_model=CustomExamCreateOut)
def create_custom_exam(
    payload: CustomExamCreateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    POST /api/v1/catalog/exams/custom

    Crea un examen personalizado persistido en backend y lo vincula a preguntas activas.
    """
    if not payload.title.strip():
        raise bad_request("invalid_title", "Title is required")

    query = (
        select(Question)
        .join(Topic, Topic.id == Question.topic_id)
        .where(Question.is_active == True)  # noqa: E712
    )

    if payload.selected_topics:
        query = query.where(Question.topic_id.in_(payload.selected_topics))
    elif payload.selected_subjects:
        query = query.where(Topic.subject_id.in_(payload.selected_subjects))

    difficulty_map = {
        "easy": 1,
        "medium": 2,
        "hard": 3,
    }
    if payload.difficulty in difficulty_map:
        query = query.where(Question.difficulty == difficulty_map[payload.difficulty])

    available_questions = db.scalars(query).all()
    if not available_questions:
        raise bad_request(
            "no_questions_available",
            "No active questions match the selected filters",
        )

    selected_count = min(payload.num_questions, len(available_questions))
    selected_questions = random.sample(available_questions, selected_count)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    exam_code = f"CUSTOM-{current_user.id}-{timestamp}"

    custom_exam = Exam(
        code=exam_code,
        name=payload.title.strip(),
        is_custom=True,
        created_at=datetime.now(timezone.utc),
    )
    custom_exam.questions.extend(selected_questions)

    db.add(custom_exam)
    db.commit()
    db.refresh(custom_exam)

    return {
        "exam_id": custom_exam.id,
        "code": custom_exam.code,
        "name": custom_exam.name,
        "is_custom": custom_exam.is_custom,
        "question_count": len(selected_questions),
        "duration_minutes": payload.duration_minutes,
        "created_by": current_user.email,
        "created_at": custom_exam.created_at.isoformat(),
    }


@router.get("/exams/")
def get_exams(db: Session = Depends(get_db)):
    """
    GET /api/v1/catalog/exams/
    
    Obtiene lista de exámenes disponibles.
    
    Returns:
    [
        {
            "exam_id": 1,
            "code": "PAES",
            "title": "PAES 2024",
            "subjects": [...]
        }
    ]
    """
    exams = db.scalars(select(Exam)).all()
    
    result = []
    for exam in exams:
        subjects = db.scalars(
            select(Subject).where(Subject.exam_id == exam.id)
        ).all()
        
        result.append({
            "exam_id": exam.id,
            "code": exam.code,
            "name": exam.name,
            "is_custom": exam.is_custom,
            "subjects": [
                {
                    "subject_id": s.id,
                    "subject_code": s.code,
                    "name": s.name
                }
                for s in subjects
            ]
        })
    
    return result


@router.get("/subjects/")
def get_subjects(exam_id: int = Query(...), db: Session = Depends(get_db)):
    """
    GET /api/v1/catalog/subjects/?exam_id=1
    
    Obtiene asignaturas de un examen.
    
    Query params:
    - exam_id: ID del examen
    
    Returns:
    [
        {
            "subject_id": 1,
            "subject_code": "MATH1",
            "name": "Matemática 1",
            "topics": [...]
        }
    ]
    """
    exam = db.scalar(select(Exam).where(Exam.id == exam_id))
    if not exam:
        raise not_found("exam_not_found", f"Exam {exam_id} not found")
    
    subjects = db.scalars(
        select(Subject).where(Subject.exam_id == exam_id)
    ).all()
    
    result = []
    for subject in subjects:
        topics = db.scalars(_topics_with_active_questions_query(subject.id)).all()
        
        result.append({
            "subject_id": subject.id,
            "subject_code": subject.code,
            "name": subject.name,
            "topics": [
                {
                    "topic_id": t.id,
                    "topic_code": t.code,
                    "name": t.name
                }
                for t in topics
            ]
        })
    
    return result


@router.get("/topics/")
def get_topics(subject_id: int = Query(...), db: Session = Depends(get_db)):
    """
    GET /api/v1/catalog/topics/?subject_id=1
    
    Obtiene temas de una asignatura.
    
    Query params:
    - subject_id: ID de la asignatura
    
    Returns:
    [
        {
            "topic_id": 1,
            "topic_code": "ALGEBRA",
            "name": "Álgebra"
        }
    ]
    """
    subject = db.scalar(select(Subject).where(Subject.id == subject_id))
    if not subject:
        raise not_found("subject_not_found", f"Subject {subject_id} not found")
    
    topics = db.scalars(_topics_with_active_questions_query(subject_id)).all()
    
    return [
        {
            "topic_id": t.id,
            "topic_code": t.code,
            "name": t.name
        }
        for t in topics
    ]


@router.get("/topics/{topic_id}")
def get_topic_detail(topic_id: int, db: Session = Depends(get_db)):
    """
    GET /api/v1/catalog/topics/{topic_id}

    Obtiene detalles de un tema específico.

    Path params:
    - topic_id: ID del tema

    Returns:
    {
        "topic_id": 1,
        "code": "ALGEBRA",
        "name": "Álgebra",
        "subject_id": 1
    }
    """
    topic = db.scalar(select(Topic).where(Topic.id == topic_id))
    if not topic:
        raise not_found("topic_not_found", f"Topic {topic_id} not found")

    return {
        "topic_id": topic.id,
        "code": topic.code,
        "name": topic.name,
        "subject_id": topic.subject_id
    }


@router.get("/exams/{exam_id}")
def get_exam_detail(exam_id: int, db: Session = Depends(get_db)):
    """
    GET /api/v1/catalog/exams/{exam_id}
    
    Obtiene detalles de un examen específico con sus asignaturas y temas.
    
    Path params:
    - exam_id: ID del examen
    
    Returns:
    {
        "exam_id": 1,
        "code": "PAES",
        "name": "PAES 2024",
        "subjects": [
            {
                "subject_id": 1,
                "code": "M1",
                "name": "Matemática 1",
                "topics": [...]
            }
        ]
    }
    """
    exam = db.scalar(select(Exam).where(Exam.id == exam_id))
    if not exam:
        raise not_found("exam_not_found", f"Exam {exam_id} not found")
    
    subjects = db.scalars(
        select(Subject).where(Subject.exam_id == exam_id)
    ).all()
    
    result = {
        "exam_id": exam.id,
        "code": exam.code,
        "name": exam.name,
        "subjects": []
    }
    
    for subject in subjects:
        topics = db.scalars(_topics_with_active_questions_query(subject.id)).all()
        
        result["subjects"].append({
            "subject_id": subject.id,
            "code": subject.code,
            "name": subject.name,
            "topics": [
                {
                    "topic_id": t.id,
                    "code": t.code,
                    "name": t.name
                }
                for t in topics
            ]
        })
    
    return result


@router.get("/exams/{exam_id}/questions")
def get_exam_questions(exam_id: int, db: Session = Depends(get_db)):
    """
    GET /api/v1/catalog/exams/{exam_id}/questions

    Obtiene la lista COMPLETA de preguntas activas vinculadas a un examen, 
    buscando a través de sus asignaturas y tópicos correspondientes.
    
    Path params:
    - exam_id: ID del examen
    """
    exam = db.scalar(select(Exam).where(Exam.id == exam_id))
    if not exam:
        raise not_found("exam_not_found", f"Exam {exam_id} not found")

    # Obtener todas las preguntas activas vinculadas a las asignaturas de este examen
    questions = db.scalars(
        select(Question)
        .join(Topic, Topic.id == Question.topic_id)
        .join(Subject, Subject.id == Topic.subject_id)
        .where(Subject.exam_id == exam_id, Question.is_active == True) # noqa: E712
    ).all()

    result = []
    for q in questions:
        result.append({
            "question_id": q.id,
            "topic_id": q.topic_id,
            "prompt": q.prompt,
            "difficulty": q.difficulty,
            "reading_text": q.reading_text
        })
    return result


@router.get("/subjects/{subject_id}")
def get_subject_detail(subject_id: int, db: Session = Depends(get_db)):
    """
    GET /api/v1/catalog/subjects/{subject_id}
    
    Obtiene detalles de una asignatura con sus temas.
    
    Path params:
    - subject_id: ID de la asignatura
    
    Returns:
    {
        "subject_id": 1,
        "code": "M1",
        "name": "Matemática 1",
        "exam_id": 1,
        "topics": [
            {
                "topic_id": 1,
                "code": "ALG",
                "name": "Álgebra"
            }
        ]
    }
    """
    subject = db.scalar(select(Subject).where(Subject.id == subject_id))
    if not subject:
        raise not_found("subject_not_found", f"Subject {subject_id} not found")
    
    topics = db.scalars(_topics_with_active_questions_query(subject_id)).all()
    
    return {
        "subject_id": subject.id,
        "code": subject.code,
        "name": subject.name,
        "exam_id": subject.exam_id,
        "topics": [
            {
                "topic_id": t.id,
                "code": t.code,
                "name": t.name
            }
            for t in topics
        ]
    }


@router.get("/subjects-with-topics")
def get_subjects_with_topics(exam_id: int = Query(...), db: Session = Depends(get_db)):
    """
    GET /api/v1/catalog/subjects-with-topics?exam_id=1
    
    Obtiene todas las asignaturas con sus temas para un examen (combina 2 queries).
    Útil para dashboards y vistas generales.
    
    Query params:
    - exam_id: ID del examen
    
    Returns:
    [
        {
            "subject_id": 1,
            "code": "M1",
            "name": "Matemática 1",
            "topics": [
                {
                    "topic_id": 1,
                    "code": "ALG",
                    "name": "Álgebra"
                }
            ]
        }
    ]
    """
    exam = db.scalar(select(Exam).where(Exam.id == exam_id))
    if not exam:
        raise not_found("exam_not_found", f"Exam {exam_id} not found")
    
    subjects = db.scalars(
        select(Subject).where(Subject.exam_id == exam_id)
    ).all()
    
    result = []
    for subject in subjects:
        topics = db.scalars(_topics_with_active_questions_query(subject.id)).all()
        
        result.append({
            "subject_id": subject.id,
            "code": subject.code,
            "name": subject.name,
            "topics": [
                {
                    "topic_id": t.id,
                    "code": t.code,
                    "name": t.name
                }
                for t in topics
            ]
        })
    
    return result