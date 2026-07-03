"""Endpoints del motor de quiz y gestión de intentos de ensayo.

Este módulo implementa la capa HTTP del dominio de quiz para FastAPI. Expone
endpoints para obtener la siguiente pregunta, registrar respuestas, crear y
finalizar intentos de ensayo, y consultar resultados detallados.

Flujo principal de datos:
1. El endpoint recibe parámetros/payload y valida identidad del usuario.
2. Se consulta y actualiza estado en base de datos mediante SQLAlchemy (Attempt,
    AttemptFeedback, Question, Subject, Topic, Exam).
3. Se delega generación de feedback rápido a la capa de servicios
    (app.services.ai_service.generate_feedback).
4. Se devuelve un response model tipado (schemas de app.schemas.quiz) para
    mantener contrato estable con frontend.
"""

import random

from datetime import timezone
from datetime import datetime
from typing import Optional, Union
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.core.exceptions import not_found, bad_request
from app.core.auth import get_current_user
from app.db.session import get_db
from app.db.models import Topic, Question, QuestionChoice, Exam, Subject, Attempt, AttemptFeedback, User
from app.schemas.quiz import (
    QuestionOut,
    AnswerIn,
    AnswerOut,
    TopicCompletedOut,
    AttemptResultOut,
    AttemptFeedbackDetailOut
)
from app.services.ai_service import generate_feedback
from app.services.user_progress_service import update_user_progress

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/quiz", tags=["quiz"])


@router.get("/next-question", response_model=Union[QuestionOut, TopicCompletedOut])
def next_question(
    attempt_id: Optional[int] = None,
    topic_code: str = "ALG",
    subject_code: str = "M1",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene la siguiente pregunta disponible de un tema para el usuario autenticado.

    El endpoint intenta reutilizar un intento en progreso cuando existe,
    calcula preguntas ya respondidas y retorna una pregunta aleatoria activa no
    contestada. Si no hay más preguntas o se alcanzó el máximo por tema,
    finaliza el intento y retorna un payload de tema completado.

    Args:
        attempt_id: ID opcional del intento en progreso que se quiere continuar.
        topic_code: Código del tema (por ejemplo, "ALG").
        subject_code: Código de la materia (por ejemplo, "M1").
        db: Sesión de base de datos inyectada por dependencia.
        current_user: Usuario autenticado obtenido desde el token.

    Returns:
        Union[QuestionOut, TopicCompletedOut]:
        - QuestionOut cuando existe una pregunta disponible.
        - TopicCompletedOut cuando se completó el tema.

    Raises:
        HTTPException: Si attempt_id no coincide con subject/topic solicitados.
        HTTPException: Si faltan recursos de catálogo (exam, subject o topic).
    """
    user_id = current_user.id
    logger.info(
        "Usuario %s solicita siguiente pregunta | Materia: %s | Tema: %s",
        user_id,
        subject_code,
        topic_code,
    )

    exam = db.scalar(
        select(Exam).where(Exam.code == settings.PAES_CODE, Exam.is_custom == False)  # noqa: E712
    )
    if not exam:
        raise bad_request("exam_not_seeded", f"Exam with code={settings.PAES_CODE} not found")

    subject = db.scalar(
        select(Subject).where(Subject.code == subject_code, Subject.exam_id == exam.id)
    )
    if not subject:
        raise not_found("subject_not_found", f"subject_code={subject_code} en exam=PAES")

    topic = db.scalar(
        select(Topic).where(Topic.subject_id == subject.id, Topic.code == topic_code)
    )
    if not topic:
        raise not_found("topic", f"topic_code={topic_code} en subject_code={subject_code}")

    if attempt_id is not None:
        attempt = db.get(Attempt, attempt_id)
        if not attempt or attempt.user_id != user_id:
            raise not_found("attempt", f"attempt_id={attempt_id}")
        if (
            attempt.exam_id != exam.id
            or attempt.subject_id != subject.id
            or attempt.topic_id != topic.id
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "bad_request",
                    "detail": "attempt_id no coincide con subject/topic del request",
                    "code": "ATTEMPT_MISMATCH",
                },
            )
    else:
        attempt = db.scalar(
            select(Attempt)
            .where(
                Attempt.user_id == user_id,
                Attempt.exam_id == exam.id,
                Attempt.subject_id == subject.id,
                Attempt.topic_id == topic.id,
                Attempt.status == "in_progress",
            )
            .order_by(Attempt.id.desc())
        )

    answered_question_ids = set()
    if attempt:
        answered_question_ids = set(
            db.scalars(
                select(AttemptFeedback.question_id).where(AttemptFeedback.attempt_id == attempt.id)
            ).all()
        )

    def _build_topic_completed_payload(current_attempt: Attempt) -> dict:
        """Construye el payload de respuesta cuando un tema está finalizado.

        Args:
            current_attempt: Intento del usuario ya cerrado o a cerrar.

        Returns:
            dict: Estructura serializable con métricas finales del intento.
        """
        # Se normaliza puntaje en dos escalas para compatibilidad:
        # porcentaje para UI y escala PAES (0-1000) para negocio/reportes.
        total = current_attempt.total_questions or 0
        correct = current_attempt.correct_count or 0
        score_percentage = int((correct / total) * 100) if total > 0 else 0
        score_paes = int((correct / total) * 1000) if total > 0 else 0

        return {
            "kind": "topic_completed",
            "message": "¡Tema completado!",
            "attempt_id": current_attempt.id,
            "status": current_attempt.status,
            "total_questions": total,
            "correct_count": correct,
            "score_percentage": score_percentage,
            "score_paes": score_paes,
            "score": score_paes,
        }

    def _finalize_attempt(current_attempt: Attempt) -> dict:
        """Finaliza un intento en progreso y devuelve su payload consolidado.

        Args:
            current_attempt: Intento a cerrar.

        Returns:
            dict: Payload de tema completado listo para response.
        """
        if current_attempt.status != "completed":
            current_attempt.status = "completed"
            current_attempt.completed_at = datetime.now(timezone.utc)
            total = current_attempt.total_questions or 0
            correct = current_attempt.correct_count or 0
            score_paes = int((correct / total) * 1000) if total > 0 else 0
            current_attempt.score = score_paes
            db.commit()
        return _build_topic_completed_payload(current_attempt)

    if attempt and (attempt.total_questions or 0) >= settings.QUIZ_TOPIC_MAX_QUESTIONS:
        logger.info(
            "Attempt %s reached max questions (%s)",
            attempt.id,
            settings.QUIZ_TOPIC_MAX_QUESTIONS,
        )
        return _finalize_attempt(attempt)

    # Se busca una pregunta aleatoria no respondida para evitar repetición y
    # distribuir la práctica entre el banco de ítems del tema.
    question = db.scalar(
        select(Question)
        .where(
            Question.topic_id == topic.id,
            Question.is_active == True,  # noqa: E712
            Question.id.not_in(answered_question_ids) if answered_question_ids else True,
        )
        .order_by(func.random())
    )

    if not question:
        if not attempt:
            raise bad_request("no_attempt", "No active attempt found for this topic")

        completed_payload = _finalize_attempt(attempt)
        logger.info(
            "Topic completed | User: %s | Score: %s/%s (%s%%)",
            user_id,
            completed_payload["correct_count"],
            completed_payload["total_questions"],
            completed_payload["score_percentage"],
        )
        return completed_payload

    choices = db.scalars(
        select(QuestionChoice).where(QuestionChoice.question_id == question.id)
    ).all()
    random.shuffle(choices)

    logger.debug("Serving question %s to user %s", question.id, user_id)

    return {
        "kind": "question",
        "question_id": question.id,
        "prompt": question.prompt,
        "topic": topic.code,
        "reading_text": question.reading_text,
        "choices": [
            {"id": choice.id, "label": choice.label, "text": choice.text}
            for choice in choices
        ],
    }

@router.post("/answer", response_model=AnswerOut)
def submit_answer(
    payload: AnswerIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Registra la respuesta del usuario para una pregunta del quiz.

    Este endpoint valida pertenencia de la alternativa elegida, crea o reutiliza
    un intento en progreso, evita duplicados por pregunta e intenta generar
    feedback rápido sin LLM para controlar costo y latencia.

    Args:
        payload: Cuerpo de solicitud con subject/topic/question y choice elegida.
        db: Sesión de base de datos inyectada por dependencia.
        current_user: Usuario autenticado obtenido desde el token.

    Returns:
        AnswerOut: Resultado de corrección, feedback y estado de finalización.

    Raises:
        HTTPException: Si el usuario intenta responder con user_id ajeno.
        HTTPException: Si la pregunta o alternativa no son válidas.
        HTTPException: Si no se puede crear/recuperar intento activo tras
            condición de carrera.
    """
    if payload.user_id is not None and payload.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "forbidden",
                "detail": "user_id no coincide con el token",
                "code": "IDOR_BLOCKED",
            },
        )
    user_id = current_user.id
    logger.info(
        "User %s answering | Question: %s | Choice: %s",
        user_id,
        payload.question_id,
        payload.selected_choice_id,
    )

    question = db.get(Question, payload.question_id)
    if not question:
        raise not_found("question", "Question does not exist")

    choice = db.get(QuestionChoice, payload.selected_choice_id)
    if not choice or choice.question_id != payload.question_id:
        raise bad_request("invalid_choice", "Selected choice does not belong to this question")

    subject = db.scalar(
        select(Subject)
        .join(Exam, Exam.id == Subject.exam_id)
        .where(Subject.code == payload.subject_code, Exam.is_custom == False)  # noqa: E712
    )
    if not subject:
        raise not_found("subject_not_found", f"subject_code={payload.subject_code} en exam=PAES")

    exam = db.get(Exam, subject.exam_id)

    topic = db.scalar(
        select(Topic).where(Topic.subject_id == subject.id, Topic.code == payload.topic_code)
    )
    if not topic:
        raise not_found("topic", f"topic_code={payload.topic_code} en subject_code={payload.subject_code}")

    is_correct = bool(choice.is_correct)

    # Se usa SELECT ... FOR UPDATE para serializar concurrencia por usuario/tema:
    # evita que dos requests simultáneos creen intentos en progreso duplicados.
    attempt = db.scalar(
        select(Attempt)
        .where(
            Attempt.user_id == user_id,
            Attempt.exam_id == exam.id,
            Attempt.subject_id == subject.id,
            Attempt.topic_id == topic.id,
            Attempt.status == "in_progress",
        )
        .order_by(Attempt.id.desc())
        .with_for_update()
    )
    if not attempt:
        try:
            attempt = Attempt(
                user_id=user_id,
                exam_id=exam.id,
                subject_id=subject.id,
                topic_id=topic.id,
                status="in_progress",
                started_at=datetime.now(timezone.utc),
                total_questions=0,
                correct_count=0,
            )
            db.add(attempt)
            db.flush()
        except IntegrityError:
            # Si otro request ganó la carrera de creación, se revierte el flush y
            # se recupera el intento recién creado para mantener idempotencia.
            db.rollback()
            logger.info(
                f"Conflicto de intento detectado para user_id={user_id}. "
                "Haciendo rollback y recuperando intento existente."
            )
            attempt = db.scalar(
                select(Attempt)
                .where(
                    Attempt.user_id == user_id,
                    Attempt.exam_id == exam.id,
                    Attempt.subject_id == subject.id,
                    Attempt.topic_id == topic.id,
                    Attempt.status == "in_progress",
                )
                .order_by(Attempt.id.desc())
                .with_for_update()
            )
            if not attempt:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={"error": "attempt_conflict", "detail": "No se pudo crear ni recuperar el intento activo.", "code": "INTERNAL_ERROR"},
                )

    feedback_text = "¡Correcto!" if is_correct else "Incorrecto."
    ai_payload = {}

    # Fase 3: feedback rápido por reglas/cache (sin LLM para evitar costo por respuesta)
    quick_feedback = None
    

    def _attempt_has_remaining_questions(attempt_id: int) -> bool:
        """Determina si el intento todavía puede recibir una nueva pregunta.

        Args:
            attempt_id: Identificador del intento a evaluar.

        Returns:
            bool: True si quedan preguntas activas sin responder y no se superó
            el límite máximo por tema.
        """
        # Primero se valida el límite configurado para cortar temprano y evitar
        # queries innecesarias cuando el intento ya llegó al tope.
        if (attempt.total_questions or 0) >= settings.QUIZ_TOPIC_MAX_QUESTIONS:
            return False

        # Se calcula el set de preguntas ya respondidas para filtrar únicamente
        # las pendientes del mismo tema.
        answered_ids = db.scalars(
            select(AttemptFeedback.question_id).where(AttemptFeedback.attempt_id == attempt_id)
        ).all()
        answered_set = set(answered_ids)
        remaining = db.scalar(
            select(Question.id)
            .where(
                Question.topic_id == topic.id,
                Question.is_active == True,  # noqa: E712
                Question.id.not_in(answered_set) if answered_set else True,
            )
            .limit(1)
        )
        return remaining is not None

    def _finalize_attempt(attempt: Attempt) -> None:
        """Marca un intento como completado y recalcula su score PAES.

        Args:
            attempt: Entidad Attempt a finalizar.

        Returns:
            None
        """
        if attempt.status == "completed":
            return
        attempt.status = "completed"
        attempt.completed_at = datetime.now(timezone.utc)
        total = attempt.total_questions or 0
        correct = attempt.correct_count or 0
        if total > 0:
            score_paes = int((correct / total) * 1000)
            attempt.score = score_paes

    # Deduplicación defensiva: si la misma pregunta ya fue respondida dentro del
    # intento, se retorna el feedback persistido para mantener idempotencia.
    existing_feedback = db.scalar(
        select(AttemptFeedback).where(
            AttemptFeedback.attempt_id == attempt.id,
            AttemptFeedback.question_id == payload.question_id,
        )
    )
    if existing_feedback:
        logger.info(
            "Duplicate answer detected | Question: %s | Returning cached feedback",
            payload.question_id,
        )

        is_finished = False
        if not _attempt_has_remaining_questions(attempt.id):
            _finalize_attempt(attempt)
            db.commit()
            is_finished = True

        return {
            "attempt_id": attempt.id,
            "feedback_id": existing_feedback.id,
            "is_correct": existing_feedback.is_correct,
            "feedback_text": existing_feedback.feedback_text,
            "is_attempt_finished": is_finished or attempt.status == "completed",
            "ai_payload": existing_feedback.ai_payload or {},
        }
    fb = AttemptFeedback(
        attempt_id=attempt.id,
        question_id=payload.question_id,
        selected_choice_id=payload.selected_choice_id,
        is_correct=is_correct,
        feedback_text=feedback_text,
        ai_payload=ai_payload,
    )
    db.add(fb)

    attempt.total_questions = (attempt.total_questions or 0) + 1
    if is_correct:
        attempt.correct_count = (attempt.correct_count or 0) + 1
    else:
        attempt.incorrect_count = (attempt.incorrect_count or 0) + 1

    db.flush()

    # Se genera feedback rápido cuando feedback ya tiene ID persistido, porque la
    # capa de servicios puede depender de relaciones guardadas en base de datos.
    quick_feedback = generate_feedback(fb, db, user=current_user, allow_llm=False)
    if quick_feedback and quick_feedback.get("explanation"):
        feedback_text = quick_feedback["explanation"]
        fb.feedback_text = feedback_text
        ai_payload = {
            "source": quick_feedback.get("source", "rule_based_phase1"),
            "mode": "quick_feedback",
        }
        fb.ai_payload = ai_payload

    is_finished = False
    if not _attempt_has_remaining_questions(attempt.id):
        _finalize_attempt(attempt)
        is_finished = True

    update_user_progress(db=db, user_id=user_id, topic_id=topic.id, is_correct=is_correct)
    db.commit()

    logger.info(
        "Answer recorded | Result: %s | Progress: %s/%s",
        "correcto" if is_correct else "incorrecto",
        attempt.correct_count,
        attempt.total_questions,
    )

    return {
        "attempt_id": attempt.id,
        "feedback_id": fb.id,
        "is_correct": is_correct,
        "feedback_text": feedback_text,
        "is_attempt_finished": is_finished,
        "ai_payload": ai_payload,
    }

# -----------------------------------------------------------------------
# ENDPOINTS DE INTENTOS DE ENSAYO
# -----------------------------------------------------------------------


class ExamAttemptCreateIn(BaseModel):
    """Payload para crear un intento de examen.

    Attributes:
        exam_id: ID del examen objetivo.
        subject_id: ID de la materia del intento.
        topic_id: ID opcional del tema, para intentos acotados.
    """
    exam_id: int
    subject_id: int
    topic_id: Optional[int] = None


class ExamAttemptCreateOut(BaseModel):
    """Respuesta al crear un intento de examen.

    Attributes:
        attempt_id: ID generado del intento.
        exam_id: ID del examen asociado.
        subject_id: ID de la materia asociada.
        topic_id: ID del tema asociado (si aplica).
        total_questions: Cantidad de preguntas previstas para el intento.
    """
    attempt_id: int
    exam_id: int
    subject_id: int
    topic_id: Optional[int]
    total_questions: int


class ExamAttemptSubmitIn(BaseModel):
    """Payload para finalizar manualmente un intento de examen.

    Attributes:
        attempt_id: ID del intento a cerrar.
        correct_count: Número de respuestas correctas.
        total_questions: Total de preguntas del intento.
        score: Puntaje opcional calculado por cliente.
    """
    attempt_id: int
    correct_count: int
    total_questions: int
    score: Optional[int] = None


class ExamAttemptSubmitOut(BaseModel):
    """Respuesta al finalizar un intento de examen.

    Attributes:
        attempt_id: ID del intento cerrado.
        status: Estado final del intento (por ejemplo, completed).
        score: Puntaje final persistido.
        accuracy: Precisión porcentual calculada.
    """
    attempt_id: int
    status: str
    score: Optional[int]
    accuracy: float


@router.post("/exam-attempts", response_model=ExamAttemptCreateOut)
def create_exam_attempt(
    request: ExamAttemptCreateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crea un nuevo intento de examen para el usuario autenticado.

    Args:
        request: Payload con exam_id, subject_id y topic_id opcional.
        db: Sesión de base de datos inyectada por dependencia.
        current_user: Usuario autenticado que crea el intento.

    Returns:
        ExamAttemptCreateOut: Metadatos del intento creado y total estimado de
        preguntas.

    Raises:
        HTTPException: Si el exam, subject o topic no existen.
    """
    # Se valida catálogo antes de crear el intento para evitar referencias
    # huérfanas y errores tardíos en endpoints siguientes.
    exam = db.scalar(select(Exam).where(Exam.id == request.exam_id))
    if not exam:
        raise bad_request("exam_not_found", f"Exam {request.exam_id} not found")
    
    subject = db.scalar(select(Subject).where(Subject.id == request.subject_id))
    if not subject:
        raise bad_request("subject_not_found", f"Subject {request.subject_id} not found")
    
    if request.topic_id:
        topic = db.scalar(select(Topic).where(Topic.id == request.topic_id))
        if not topic:
            raise bad_request("topic_not_found", f"Topic {request.topic_id} not found")
    
    # Se crea el intento primero y luego se estima total de preguntas para
    # devolver información útil al frontend en un único response.
    attempt = Attempt(
        user_id=current_user.id,
        exam_id=request.exam_id,
        subject_id=request.subject_id,
        topic_id=request.topic_id,
        status="in_progress",
        total_questions=0,
        correct_count=0,
    )
    
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    # Se acota a 10 para mantener consistencia con el comportamiento actual del
    # producto y evitar payloads grandes al inicializar el intento.
    questions = db.scalars(
        select(Question)
        .where(
            (Question.topic_id == request.topic_id) if request.topic_id
            else (Question.is_active == True)
        )
        .limit(10)
    ).all()
    
    attempt.total_questions = len(questions)
    db.commit()
    db.refresh(attempt)
    
    return {
        "attempt_id": attempt.id,
        "exam_id": attempt.exam_id,
        "subject_id": attempt.subject_id,
        "topic_id": attempt.topic_id,
        "total_questions": attempt.total_questions,
    }


@router.post("/exam-attempts/submit", response_model=ExamAttemptSubmitOut)
def submit_exam_attempt(
    request: ExamAttemptSubmitIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Finaliza un intento de examen y persiste sus métricas finales.

    Args:
        request: Payload con IDs y métricas finales del intento.
        db: Sesión de base de datos inyectada por dependencia.
        current_user: Usuario autenticado dueño del intento.

    Returns:
        ExamAttemptSubmitOut: Estado final, score y accuracy calculada.

    Raises:
        HTTPException: Si el intento no existe o no pertenece al usuario.
    """
    attempt = db.scalar(
        select(Attempt).where(
            (Attempt.id == request.attempt_id) &
            (Attempt.user_id == current_user.id)
        )
    )
    
    if not attempt:
        raise not_found("attempt_not_found", f"Attempt {request.attempt_id} not found")
    
    # Se persisten las métricas recibidas para cerrar el intento de forma
    # explícita desde frontend cuando corresponde al flujo de ensayo completo.
    attempt.status = "completed"
    attempt.completed_at = datetime.now(timezone.utc)
    attempt.correct_count = request.correct_count
    attempt.total_questions = request.total_questions
    attempt.score = request.score
    
    db.commit()
    db.refresh(attempt)
    
    accuracy = (
        (request.correct_count / request.total_questions * 100)
        if request.total_questions > 0
        else 0
    )
    
    return {
        "attempt_id": attempt.id,
        "status": attempt.status,
        "score": attempt.score,
        "accuracy": accuracy,
    }


@router.get("/attempts/{attempt_id}/results", response_model=AttemptResultOut)
def get_attempt_results(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene el detalle completo de un intento de examen.

    Incluye preguntas, alternativa seleccionada, alternativa correcta y
    explicación final disponible (desde ai_payload o feedback_text).

    Args:
        attempt_id: ID del intento a consultar.
        db: Sesión de base de datos inyectada por dependencia.
        current_user: Usuario autenticado dueño del intento.

    Returns:
        AttemptResultOut: Resultado integral del intento con detalle por pregunta.

    Raises:
        HTTPException: Si el intento no existe o no pertenece al usuario.
    """
    attempt = db.scalar(
        select(Attempt).where(
            (Attempt.id == attempt_id) &
            (Attempt.user_id == current_user.id)
        )
    )
    
    if not attempt:
        raise not_found("attempt_not_found", f"Attempt {attempt_id} not found or access denied")
    
    feedbacks = db.scalars(
        select(AttemptFeedback)
        .where(AttemptFeedback.attempt_id == attempt.id)
        .order_by(AttemptFeedback.id.asc())
    ).all()

    answers_detail = []
    for fb in feedbacks:
        question = db.get(Question, fb.question_id)
        if not question:
            continue

        selected_choice = db.get(QuestionChoice, fb.selected_choice_id) if fb.selected_choice_id else None
        
        # Se consulta explícitamente la alternativa correcta para construir un
        # payload de revisión que permita comparar elección vs respuesta válida.
        correct_choice = db.scalar(
            select(QuestionChoice).where(
                (QuestionChoice.question_id == question.id) &
                (QuestionChoice.is_correct == True)
            )
        )

        ai_payload = fb.ai_payload or {}
        ai_explanation = ai_payload.get("explanation") or fb.feedback_text

        answers_detail.append(
            AttemptFeedbackDetailOut(
                question_id=fb.question_id,
                prompt=question.prompt,
                reading_text=question.reading_text,
                selected_choice_id=selected_choice.id if selected_choice else None,
                selected_choice_text=selected_choice.text if selected_choice else None,
                correct_choice_id=correct_choice.id if correct_choice else None,
                correct_choice_text=correct_choice.text if correct_choice else None,
                is_correct=fb.is_correct or False,
                ai_explanation=ai_explanation,
            )
        )
    
    total_questions = attempt.total_questions or 0
    correct_count = attempt.correct_count or 0
    
    return AttemptResultOut(
        attempt_id=attempt.id,
        exam_id=attempt.exam_id,
        subject_id=attempt.subject_id,
        topic_id=attempt.topic_id,
        status=attempt.status,
        score=attempt.score,
        total_questions=total_questions,
        correct_count=correct_count,
        started_at=attempt.started_at.isoformat() if attempt.started_at else "",
        completed_at=attempt.completed_at.isoformat() if attempt.completed_at else None,
        answers_detail=answers_detail
    )