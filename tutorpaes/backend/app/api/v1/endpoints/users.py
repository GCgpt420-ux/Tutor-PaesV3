from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import (
    User, Attempt, Subject, Topic, Exam
)
from app.core.exceptions import not_found, bad_request
from app.core.auth import get_current_user
from fastapi import Query
from pydantic import BaseModel
from typing import List
from datetime import datetime

router = APIRouter(prefix="/users", tags=["users"])


class RankingEntryOut(BaseModel):
    rank: int
    user_id: int
    name: str
    total_attempts: int
    average_score: float
    best_score: int
    accuracy: float


@router.get("/ranking", response_model=List[RankingEntryOut])
def get_users_ranking(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    rows = db.execute(
        select(
            User.id.label("user_id"),
            func.coalesce(User.name, "Estudiante").label("name"),
            func.count(Attempt.id).label("total_attempts"),
            func.coalesce(func.avg(Attempt.score), 0).label("average_score"),
            func.coalesce(func.max(Attempt.score), 0).label("best_score"),
            func.coalesce(
                (func.sum(Attempt.correct_count) * 100.0)
                / func.nullif(func.sum(Attempt.total_questions), 0),
                0,
            ).label("accuracy"),
        )
        .join(Attempt, Attempt.user_id == User.id)
        .where(Attempt.status == "completed")
        .group_by(User.id, User.name)
        .order_by(
            desc("average_score"),
            desc("accuracy"),
            desc("total_attempts"),
            User.id.asc(),
        )
        .limit(limit)
    ).all()

    ranking: list[RankingEntryOut] = []
    for idx, row in enumerate(rows):
        ranking.append(
            RankingEntryOut(
                rank=idx + 1,
                user_id=int(row.user_id),
                name=str(row.name),
                total_attempts=int(row.total_attempts or 0),
                average_score=round(float(row.average_score or 0), 2),
                best_score=int(row.best_score or 0),
                accuracy=round(float(row.accuracy or 0), 2),
            )
        )

    return ranking

@router.get("/{user_id}/stats")
def user_stats(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "forbidden",
                "detail": "user_id no coincide con el token",
                "code": "IDOR_BLOCKED",
            },
        )
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise not_found("user", f"user_id={user_id}")

    exam = db.scalar(select(Exam).where(Exam.code == "PAES"))
    if not exam:
        raise bad_request("exam_not_seeded", "PAES exam not initialized. Run seed_paes.py")

    subjects = db.scalars(
        select(Subject)
        .where(Subject.exam_id == exam.id)
        .order_by(Subject.id.asc())
    ).all()

    subject_ids = [s.id for s in subjects]
    topic_rows = db.execute(
        select(Topic.id, Topic.code, Topic.name, Topic.subject_id)
        .where(Topic.subject_id.in_(subject_ids) if subject_ids else False)
        .order_by(Topic.id.asc())
    ).all()

    attempt_rows = db.execute(
        select(
            Attempt.subject_id,
            Attempt.topic_id,
            Attempt.status,
            Attempt.total_questions,
            Attempt.correct_count,
            Attempt.completed_at,
        )
        .where(Attempt.user_id == user_id)
    ).all()

    topic_stats = {}
    total_questions = 0
    total_correct = 0

    for row in attempt_rows:
        total_questions += int(row.total_questions or 0)
        total_correct += int(row.correct_count or 0)

        if not row.topic_id:
            continue

        stats = topic_stats.setdefault(
            row.topic_id,
            {"questions": 0, "correct": 0, "completed_at": None},
        )

        stats["questions"] += int(row.total_questions or 0)
        stats["correct"] += int(row.correct_count or 0)

        if row.status == "completed" and row.completed_at:
            if not stats["completed_at"] or row.completed_at > stats["completed_at"]:
                stats["completed_at"] = row.completed_at

    overall_accuracy = (
        round((total_correct / total_questions) * 100, 2) if total_questions else 0
    )

    topics_by_subject = {}
    for t in topic_rows:
        topics_by_subject.setdefault(t.subject_id, []).append(t)

    completed_subjects = 0
    subjects_payload = []

    for subject in subjects:
        topics_payload = []
        subject_topics = topics_by_subject.get(subject.id, [])
        subject_completed = True if subject_topics else False

        for topic in subject_topics:
            stats = topic_stats.get(topic.id, {"questions": 0, "correct": 0, "completed_at": None})
            questions = stats["questions"]
            correct = stats["correct"]
            accuracy = round((correct / questions) * 100, 2) if questions else 0
            completed_at = stats["completed_at"]

            if not completed_at:
                subject_completed = False

            topics_payload.append(
                {
                    "topic_name": topic.name,
                    "topic_code": topic.code,
                    "accuracy": accuracy,
                    "questions": questions,
                    "correct": correct,
                    "completed_at": completed_at.isoformat() if completed_at else None,
                }
            )

        if subject_completed:
            completed_subjects += 1

        subjects_payload.append(
            {
                "subject_code": subject.code,
                "subject_name": subject.name,
                "topics": topics_payload,
            }
        )

    return {
        "user_id": user_id,
        "total_subjects": len(subjects),
        "completed_subjects": completed_subjects,
        "overall_accuracy": overall_accuracy,
        "subjects": subjects_payload,
    }


# -----------------------------------------------------------------------
# PYDANTIC MODELS
# -----------------------------------------------------------------------

class ExamAttemptOut(BaseModel):
    id: int
    exam_id: int
    exam_title: str
    subject_id: int
    topic_id: int | None
    status: str  # "in_progress", "completed", "abandoned"
    total_questions: int
    correct_count: int
    incorrect_count: int
    omitted_count: int
    score: int | None
    started_at: datetime
    completed_at: datetime | None


# -----------------------------------------------------------------------
# ENDPOINTS
# -----------------------------------------------------------------------

@router.get("/{user_id}/exam-attempts", response_model=List[ExamAttemptOut])
def get_user_exam_attempts(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    GET /api/v1/users/{user_id}/exam-attempts
    
    Obtiene el historial de todos los intentos de examen del usuario.
    Solo el usuario puede ver su propio historial.
    
    Path params:
    - user_id: ID del usuario
    
    Returns:
    [
        {
            "id": 1,
            "exam_id": 1,
            "subject_id": 1,
            "topic_id": 5,
            "status": "completed",
            "total_questions": 10,
            "correct_count": 8,
            "score": 80,
            "started_at": "2026-02-26T10:00:00Z",
            "completed_at": "2026-02-26T10:30:00Z"
        }
    ]
    """
    # Verificar que el usuario solo pueda ver su propio historial
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver los intentos de otro usuario"
        )
    
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise not_found("user", f"user_id={user_id}")
    
    attempts = db.scalars(
        select(Attempt)
        .where(Attempt.user_id == user_id)
        .order_by(Attempt.started_at.desc())
    ).all()

    exam_ids = {a.exam_id for a in attempts}
    exams = db.scalars(select(Exam).where(Exam.id.in_(exam_ids) if exam_ids else False)).all()
    exam_map = {e.id: e.name for e in exams}
    
    result = []
    for a in attempts:
        total_questions = int(a.total_questions or 0)
        correct_count = int(a.correct_count or 0)
        omitted_count = int(a.omitted_count or 0)
        stored_incorrect_count = int(a.incorrect_count or 0)
        inferred_incorrect_count = max(total_questions - correct_count - omitted_count, 0)
        incorrect_count = max(stored_incorrect_count, inferred_incorrect_count)

        result.append(
            {
                "id": a.id,
                "exam_id": a.exam_id,
                "exam_title": exam_map.get(a.exam_id, "Ensayo"),
                "subject_id": a.subject_id,
                "topic_id": a.topic_id,
                "status": a.status,
                "total_questions": total_questions,
                "correct_count": correct_count,
                "incorrect_count": incorrect_count,
                "omitted_count": omitted_count,
                "score": a.score,
                "started_at": a.started_at,
                "completed_at": a.completed_at,
            }
        )

    return result



