from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import AttemptFeedback, Attempt, Question, QuestionChoice, User
from app.services.ai_service import generate_feedback
from app.schemas.quiz import AIFeedbackOut
from app.core.auth import get_current_user
from app.services.openai_service import generate_llm_explanation, generate_llm_hint, generate_llm_explanation_stream
from app.services.ai_service import _get_user_overall_level
from app.core.rate_limiter import limiter

router = APIRouter(prefix="/ai", tags=["ai"])


# -----------------------------------------------------------------------
# PYDANTIC MODELS
# -----------------------------------------------------------------------

class AIExplainIn(BaseModel):
    question_id: int


class AIExplainOut(BaseModel):
    explanation: str
    question_content: str
    correct_answer: str
    metadata: dict


# -----------------------------------------------------------------------
# ENDPOINTS
# -----------------------------------------------------------------------

@router.post("/explain", response_model=AIExplainOut)
@limiter.limit("30/minute")
def explain_question(
    request: Request,
    payload: AIExplainIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate an AI explanation for a specific question.
    
    IMPORTANTE: Las explicaciones son PERSONALIZADAS según el perfil del usuario:
    - Nivel de desempeño (principiante, intermedio, avanzado)
    - Temas débiles detectados
    - Historial de errores
    - Puntaje objetivo del usuario
    Actualmente: Sistema de reglas personalizado + cache inteligente.
    """
    question = db.scalar(
        select(Question).where(Question.id == payload.question_id)
    )
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    correct_choice = next((choice for choice in question.choices if choice.is_correct), None)
    if not correct_choice:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question has no correct choice"
        )

    correct_answer = correct_choice.text

    # Última opción seleccionada por el usuario para esta pregunta (si existe)
    latest_feedback = db.scalar(
        select(AttemptFeedback)
        .join(Attempt, Attempt.id == AttemptFeedback.attempt_id)
        .where(AttemptFeedback.question_id == payload.question_id)
        .where(Attempt.user_id == user.id)
        .order_by(AttemptFeedback.id.desc())
    )

    selected_choice = None
    if latest_feedback and latest_feedback.selected_choice_id:
        selected_choice = db.get(QuestionChoice, latest_feedback.selected_choice_id)

    user_level = "intermedio"
    try:
        user_level, _ = _get_user_overall_level(user, db)
    except Exception:
        user_level = "intermedio"

    # Fase 4: tutoría profunda bajo demanda (puede usar LLM)
    llm_result = generate_llm_explanation(
        question=question,
        correct_choice=correct_choice,
        selected_choice=selected_choice,
        user=user,
        user_level=user_level,
        is_correct=False,
        fallback_text=question.explanation,
    )

    explanation = llm_result.get("explanation") or question.explanation or (
        f"Esta es una pregunta de {['fácil', 'media', 'difícil'][question.difficulty - 1]} "
        f"sobre {question.topic.name if question.topic else 'este tema'}. "
        f"La respuesta correcta es: {correct_answer}"
    )

    hint_result = generate_llm_hint(question, user_level=user_level)
    
    return {
        "explanation": explanation,
        "question_content": question.prompt,
        "correct_answer": correct_answer,
        "metadata": {
            "model": llm_result.get("model", "personalized_rule_based"),
            "question_id": question.id,
            "difficulty": question.difficulty,
            "topic": question.topic.name if question.topic else None,
            "user_level": user_level,
            "tokens_used": llm_result.get("tokens_used", 0),
            "hint": hint_result.get("hint", ""),
        }
    }


@router.post("/explain/stream")
@limiter.limit("30/minute")
def explain_question_stream(
    request: Request,
    payload: AIExplainIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate an AI explanation using Server-Sent Events (SSE).
    """
    question = db.scalar(
        select(Question).where(Question.id == payload.question_id)
    )
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    correct_choice = next((choice for choice in question.choices if choice.is_correct), None)
    if not correct_choice:
        raise HTTPException(status_code=400, detail="Question has no correct choice")

    latest_feedback = db.scalar(
        select(AttemptFeedback)
        .join(Attempt, Attempt.id == AttemptFeedback.attempt_id)
        .where(AttemptFeedback.question_id == payload.question_id)
        .where(Attempt.user_id == user.id)
        .order_by(AttemptFeedback.id.desc())
    )

    selected_choice = None
    if latest_feedback and latest_feedback.selected_choice_id:
        selected_choice = db.get(QuestionChoice, latest_feedback.selected_choice_id)

    user_level = "intermedio"
    try:
        user_level, _ = _get_user_overall_level(user, db)
    except Exception:
        user_level = "intermedio"

    generator = generate_llm_explanation_stream(
        question=question,
        correct_choice=correct_choice,
        selected_choice=selected_choice,
        user=user,
        user_level=user_level,
        is_correct=False,
        fallback_text=question.explanation,
    )

    return StreamingResponse(generator, media_type="text/event-stream")


@router.get("/health")
def ai_health_check():
    """
    Verifica el estado del sistema de IA.
    Retorna información sobre qué proveedores están disponibles.
    """
    from app.services.openai_service import check_openai_connection
    from app.core.config import settings
    
    openai_status = check_openai_connection()
    
    return {
        "status": "ok",
        "ai_systems": {
            "rule_based": {
                "status": "ready",
                "description": "Sistema de reglas personalizado (siempre disponible)"
            },
            "openai": openai_status,
            "llm_enabled": settings.AI_ENABLE_LLM and bool(settings.OPENAI_API_KEY)
        }
    }


@router.get("/feedback/{feedback_id}")
@limiter.limit("60/minute")
def ai_feedback(
    request: Request,
    feedback_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Endpoint para obtener feedback personalizado generado por IA.
    
    El feedback se PERSONALIZA automáticamente según:
    - Historial de intentos del usuario
    - Desempeño por tema
    - Nivel general de comprensión
    - Temas débiles identificados
    
    Futuro: Integración con LLM para explicaciones más sofisticadas.
    Hoy: Sistema de reglas personalizado + explicaciones cacheadas.
    """
    fb = db.scalar(
        select(AttemptFeedback)
        .join(Attempt, Attempt.id == AttemptFeedback.attempt_id)
        .where(AttemptFeedback.id == feedback_id)
        .where(Attempt.user_id == user.id)
    )
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")

    # Pasar el usuario al generador de feedback para personalización
    return generate_feedback(fb, db, user=user)
