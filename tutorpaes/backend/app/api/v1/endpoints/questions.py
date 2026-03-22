from datetime import timezone
from datetime import datetime
import logging
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import require_admin_user
from app.core.config import settings
from app.core.exceptions import bad_request, not_found
from app.db.models import Exam, Subject, Topic, Question, QuestionChoice
from app.db.session import get_db
from app.schemas.questions import (
    QuestionCreateIn,
    QuestionCreatedOut,
    RecentQuestionOut,
    BulkQuestionCreateIn,
    BulkQuestionCreateOut,
)

router = APIRouter(
    prefix="/questions",
    tags=["questions"],
    dependencies=[Depends(require_admin_user)],
)


@router.post("/", response_model=QuestionCreatedOut)
def create_question(
    payload: QuestionCreateIn,
    db: Session = Depends(get_db),
):
    exam = db.scalar(select(Exam).where(Exam.code == settings.PAES_CODE))
    if not exam:
        raise bad_request(
            "exam_not_seeded",
            f"{settings.PAES_CODE} exam no inicializado. Ejecutar seed_paes.py",
        )

    subject = db.scalar(
        select(Subject).where(Subject.exam_id == exam.id, Subject.code == payload.subject_code)
    )
    if not subject:
        raise not_found("subject", f"subject_code={payload.subject_code} en exam={exam.code}")

    topic = db.scalar(
        select(Topic).where(Topic.subject_id == subject.id, Topic.code == payload.topic_code)
    )
    if not topic:
        raise not_found(
            "topic",
            f"topic_code={payload.topic_code} en subject_code={payload.subject_code}",
        )

    labels = [c.label for c in payload.choices]
    if len(set(labels)) != 4:
        raise bad_request("invalid_choices", "Las alternativas deben tener labels únicos (A/B/C/D)")
    if payload.correct_choice not in set(labels):
        raise bad_request("invalid_correct_choice", "correct_choice debe existir dentro de choices")

    # Rechazo de preguntas marcadas como prueba/demo:
    # Propósito: evitar que contenido de pruebas se inserte en la BD de producción.
    if isinstance(payload.prompt, str) and payload.prompt.strip().startswith("[TEST]"):
        raise bad_request("test_question", "Preguntas marcadas como [TEST] no están permitidas en la DB")

    question = Question(
        topic_id=topic.id,
        prompt=payload.prompt,
        reading_text=payload.reading_text,
        explanation=payload.explanation,
        difficulty=payload.difficulty,
        question_type="mcq",
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(question)
    db.flush()

    created_choices: List[QuestionChoice] = []
    for choice in payload.choices:
        created = QuestionChoice(
            question_id=question.id,
            label=choice.label,
            text=choice.text,
            is_correct=(choice.label == payload.correct_choice),
        )
        db.add(created)
        created_choices.append(created)

    db.flush()
    db.commit()

    # Audit log: registra creación para facilitar trazabilidad en el futuro.
    logger = logging.getLogger(__name__)
    # Registro de auditoría: facilita trazabilidad de creaciones
    # Propósito: permitir revisar en logs cuándo y qué preguntas se crean
    logger.info(
        "Pregunta creada: id=%s subject=%s topic=%s prompt=%s",
        question.id,
        payload.subject_code,
        payload.topic_code,
        (question.prompt[:200] if question.prompt else ""),
    )

    return {
        "question_id": question.id,
        "subject_code": payload.subject_code,
        "topic_code": payload.topic_code,
        "prompt": question.prompt,
        "reading_text": question.reading_text,
        "explanation": question.explanation,
        "difficulty": question.difficulty,
        "choices": [
            {"id": c.id, "label": c.label, "text": c.text}
            for c in created_choices
        ],
        "correct_choice": payload.correct_choice,
    }


@router.post("/bulk", response_model=BulkQuestionCreateOut)
def create_questions_bulk(
    payload: BulkQuestionCreateIn,
    db: Session = Depends(get_db),
):
    exam = db.scalar(select(Exam).where(Exam.code == settings.PAES_CODE))
    if not exam:
        raise bad_request(
            "exam_not_seeded",
            f"{settings.PAES_CODE} exam no inicializado. Ejecutar seed_paes.py",
        )

    # Caché local de subjects/topics para reducir llamadas repetidas a la DB.
    # Propósito: evitar múltiples roundtrips a la BD durante la validación y creación
    # de preguntas en operaciones bulk, mejorando latencia y consistencia.
    subject_cache: dict[str, Subject] = {}
    topic_cache: dict[tuple[str, str], Topic] = {}

    errors: list[dict] = []
    created_question_ids: list[int] = []

    def resolve_subject(subject_code: str) -> Subject | None:
        cached = subject_cache.get(subject_code)
        if cached:
            return cached
        subject = db.scalar(
            select(Subject).where(Subject.exam_id == exam.id, Subject.code == subject_code)
        )
        if subject:
            subject_cache[subject_code] = subject
        return subject

    def resolve_topic(subject_code: str, topic_code: str) -> Topic | None:
        key = (subject_code, topic_code)
        cached = topic_cache.get(key)
        if cached:
            return cached
        subject = resolve_subject(subject_code)
        if not subject:
            return None
        topic = db.scalar(
            select(Topic).where(Topic.subject_id == subject.id, Topic.code == topic_code)
        )
        if topic:
            topic_cache[key] = topic
        return topic

    # Primera pasada: validar todos los ítems del payload y preparar objetos.
    # Propósito: detectar errores (subjects/topics no existentes, choices inválidas,
    # o preguntas marcadas como test) antes de escribir nada en la base de datos.
    prepared: list[tuple[QuestionCreateIn, Topic]] = []
    for index, q in enumerate(payload.questions):
        # Bloqueo de preguntas de prueba (bulk):
        # Propósito: rechazar explícitamente preguntas marcadas como [TEST]
        # para evitar que datos de prueba se filtren a la BD de producción.
        if isinstance(q.prompt, str) and q.prompt.strip().startswith("[TEST]"):
            errors.append(
                {
                    "index": index,
                    "error": "test_question",
                    "detail": "Preguntas marcadas como [TEST] no están permitidas",
                }
            )
            continue
        topic = resolve_topic(q.subject_code, q.topic_code)
        if not topic:
            # Determine which entity is missing for better error messaging.
            if not resolve_subject(q.subject_code):
                errors.append(
                    {
                        "index": index,
                        "error": "subject_not_found",
                        "detail": f"subject_code={q.subject_code} en exam={exam.code}",
                    }
                )
            else:
                errors.append(
                    {
                        "index": index,
                        "error": "topic_not_found",
                        "detail": f"topic_code={q.topic_code} en subject_code={q.subject_code}",
                    }
                )
            continue

        labels = [c.label for c in q.choices]
        if len(set(labels)) != 4:
            errors.append(
                {
                    "index": index,
                    "error": "invalid_choices",
                    "detail": "Las alternativas deben tener labels únicos (A/B/C/D)",
                }
            )
            continue
        if q.correct_choice not in set(labels):
            errors.append(
                {
                    "index": index,
                    "error": "invalid_correct_choice",
                    "detail": "correct_choice debe existir dentro de choices",
                }
            )
            continue

        prepared.append((q, topic))

    if payload.atomic and errors:
        return {
            "dry_run": payload.dry_run,
            "atomic": payload.atomic,
            "total": len(payload.questions),
            "created": 0,
            "skipped": len(payload.questions),
            "question_ids": [],
            "errors": errors,
        }

    if payload.dry_run:
        return {
            "dry_run": True,
            "atomic": payload.atomic,
            "total": len(payload.questions),
            "created": len(prepared),
            "skipped": len(payload.questions) - len(prepared),
            "question_ids": [],
            "errors": errors,
        }

    # Segunda pasada: escribir en la BD solo los ítems que pasaron validación.
    # Propósito: realizar la inserción en bloque de preguntas válidas y garantizar
    # que la operación sea atómica según la opción `atomic` del payload.
    try:
        for q, topic in prepared:
            question = Question(
                topic_id=topic.id,
                prompt=q.prompt,
                reading_text=q.reading_text,
                explanation=q.explanation,
                difficulty=q.difficulty,
                question_type="mcq",
                is_active=True,
                created_at=datetime.now(timezone.utc),
            )
            db.add(question)
            db.flush()

            for choice in q.choices:
                db.add(
                    QuestionChoice(
                        question_id=question.id,
                        label=choice.label,
                        text=choice.text,
                        is_correct=(choice.label == q.correct_choice),
                    )
                )

            created_question_ids.append(question.id)

        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "dry_run": False,
        "atomic": payload.atomic,
        "total": len(payload.questions),
        "created": len(created_question_ids),
        "skipped": len(payload.questions) - len(created_question_ids),
        "question_ids": created_question_ids,
        "errors": errors,
    }


@router.get("/recent", response_model=List[RecentQuestionOut])
def list_recent_questions(
    limit: int = 10,
    db: Session = Depends(get_db),
):
    limit = max(1, min(50, limit))

    rows = db.scalars(select(Question).order_by(Question.id.desc()).limit(limit)).all()

    # Pre-cargar relaciones (choices + topic->subject)
    # Propósito: evitar consultas N+1 al serializar la respuesta `recent`.
    result: List[RecentQuestionOut] = []
    for q in rows:
        topic = db.get(Topic, q.topic_id)
        subject_code = ""
        topic_code = ""
        if topic:
            topic_code = topic.code
            subject = db.get(Subject, topic.subject_id)
            if subject:
                subject_code = subject.code

        choices = db.scalars(
            select(QuestionChoice).where(QuestionChoice.question_id == q.id).order_by(QuestionChoice.label.asc())
        ).all()

        result.append(
            {
                "question_id": q.id,
                "subject_code": subject_code,
                "topic_code": topic_code,
                "prompt": q.prompt,
                "reading_text": q.reading_text,
                "difficulty": q.difficulty,
                "created_at": q.created_at.isoformat() if q.created_at else "",
                "choices": [
                    {"id": c.id, "label": c.label, "text": c.text}
                    for c in choices
                ],
            }
        )

    return result
