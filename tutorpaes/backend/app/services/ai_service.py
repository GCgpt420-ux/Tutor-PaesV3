from datetime import timezone
from app.db.models import (
    AttemptFeedback, Question, QuestionChoice, QuestionExplanation,
    User, Attempt, Topic, AttemptStatus
)
from sqlalchemy.orm import Session
from sqlalchemy import func, select, case, and_
from typing import Optional, Dict, List, Tuple
from datetime import datetime, timedelta

# Importar OpenAI service
try:
    from app.services.openai_service import generate_llm_explanation
except ImportError:
    generate_llm_explanation = None


# ============================================================================
# USER PROFILING FUNCTIONS - Análisis del perfil del usuario
# ============================================================================

def _get_user_performance_by_topic(user: User, db: Session, limit_days: int = 30) -> Dict[str, Dict]:
    """
    Obtiene el desempeño del usuario por tema en los últimos N días.
    Usa una sola query SQL agregada (sin N+1).

    Returns:
        {
            'topic_code': {
                'topic_name': str,
                'total': int,
                'correct': int,
                'accuracy': float,
                'difficulty_avg': float,
                'recent': bool  # Si respondió en los últimos 7 días
            }
        }
    """
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=limit_days)
    recent_cutoff = datetime.now(timezone.utc) - timedelta(days=7)

    # Una sola query que agrega todo en PostgreSQL, sin bucles Python ni N+1.
    rows = db.execute(
        select(
            Topic.code.label("topic_code"),
            Topic.name.label("topic_name"),
            func.sum(Attempt.total_questions).label("total"),
            func.sum(Attempt.correct_count).label("correct"),
            func.avg(Question.difficulty).label("difficulty_avg"),
            func.bool_or(Attempt.completed_at >= recent_cutoff).label("recent"),
        )
        .join(Attempt, Attempt.topic_id == Topic.id)
        .join(Question, Question.topic_id == Topic.id)
        .where(
            Attempt.user_id == user.id,
            Attempt.status == "completed",
            Attempt.completed_at >= cutoff_date,
        )
        .group_by(Topic.id, Topic.code, Topic.name)
    ).all()

    performance: Dict[str, Dict] = {}
    for row in rows:
        total = int(row.total or 0)
        correct = int(row.correct or 0)
        performance[row.topic_code] = {
            "topic_name": row.topic_name,
            "total": total,
            "correct": correct,
            "incorrect": total - correct,
            "accuracy": round(correct / total, 3) if total > 0 else 0.0,
            "difficulty_avg": round(float(row.difficulty_avg or 1.0), 1),
            "recent": bool(row.recent),
        }

    return performance


def _get_user_weak_topics(user: User, db: Session, threshold: float = 0.6) -> List[str]:
    """
    Retorna lista de temas donde el usuario tiene desempeño bajo.
    
    Args:
        threshold: Umbral de accuracy para considerar un tema como débil (default: 60%)
    """
    performance = _get_user_performance_by_topic(user, db)
    weak = [code for code, data in performance.items() if data['accuracy'] < threshold and data['total'] >= 3]
    return weak


def _get_user_overall_level(user: User, db: Session) -> Tuple[str, float]:
    """
    Calcula el nivel general del usuario.
    
    Returns:
        Tuple: ('principiante' | 'intermedio' | 'avanzado', accuracy_promedio)
    """
    performance = _get_user_performance_by_topic(user, db)
    
    if not performance:
        return ('principiante', 0.0)
    
    total_questions = sum(p['total'] for p in performance.values())
    total_correct = sum(p['correct'] for p in performance.values())
    
    if total_questions == 0:
        return ('principiante', 0.0)
    
    avg_accuracy = total_correct / total_questions
    
    if avg_accuracy >= 0.75:
        level = 'avanzado'
    elif avg_accuracy >= 0.50:
        level = 'intermedio'
    else:
        level = 'principiante'
    
    return (level, round(avg_accuracy, 3))


def _get_common_wrong_options(user: User, question: Question, db: Session, limit: int = 3) -> List[str]:
    """
    Identifica las opciones incorrectas más comúnmente seleccionadas por el usuario
    en preguntas del mismo tema. Una sola query SQL agregada (sin N+1).
    """
    rows = db.execute(
        select(
            QuestionChoice.label,
            func.count(AttemptFeedback.id).label("count"),
        )
        .join(AttemptFeedback, AttemptFeedback.selected_choice_id == QuestionChoice.id)
        .join(Attempt, Attempt.id == AttemptFeedback.attempt_id)
        .where(
            Attempt.user_id == user.id,
            Attempt.topic_id == question.topic_id,
            AttemptFeedback.is_correct == False,  # noqa: E712
            QuestionChoice.is_correct == False,  # noqa: E712
        )
        .group_by(QuestionChoice.label)
        .order_by(func.count(AttemptFeedback.id).desc())
        .limit(limit)
    ).all()

    return [(row.label, row.count) for row in rows]


# ============================================================================
# PERSONALIZED FEEDBACK GENERATION - Generación de feedback personalizado
# ============================================================================

def _build_personalized_hint(
    question: Question,
    user: User,
    user_level: str,
    weak_topics: List[str],
    db: Session
) -> str:
    """
    Genera un hint personalizado basado en el perfil del usuario.
    """
    topic = question.topic
    topic_code = topic.code if topic else "general"
    
    # Seleccionar intensidad del hint según el nivel del usuario
    if user_level == 'principiante':
        hint_intensity = "muy detallado"
    elif user_level == 'intermedio':
        hint_intensity = "moderado"
    else:
        hint_intensity = "sutil"
    
    # Si el usuario tiene dificultades en este tema, dar hint más detallado
    is_weak_topic = topic_code in weak_topics
    
    # Construir hint base según el tema
    topic_hints = {
        "ALG": "En Álgebra, enfócate en las propiedades de las operaciones. Intenta substituir valores específicos para verificar.",
        "GEO": "En Geometría, dibuja o visualiza. Recuerda: ángulos, perímetro, área. Usa propiedades de figuras planas o 3D.",
        "LECT": "En Lectura Comprensiva, relée el párrafo relevante. Busca palabras clave y conecta con la pregunta específica.",
        "CIEN": "En Ciencias, piensa en procesos: reacciones químicas, fuerzas, energía. Causa y efecto son clave.",
        "HIST": "En Historia, considera el contexto temporal y los actores. Causa-efecto y secuencia son fundamentales.",
        "PSU-MAT": "En Matemática PSU, revisa conceptos previos. Muchas preguntas combinan múltiples ideas.",
        "PSU-LEN": "En Lenguaje PSU, analiza estructura lingüística y contexto literario.",
    }
    
    base_hint = topic_hints.get(topic_code, "Revisa los conceptos clave del tema.")
    
    # Personalizar según si es tema débil
    if is_weak_topic:
        return f" Tema recurrente para ti: {base_hint} Practica más en este tópico."
    else:
        return f" {base_hint}"


def _build_core_explanation(question: Question, correct_choice: QuestionChoice) -> str:
    if question.explanation:
        return question.explanation

    topic_name = question.topic.name if question.topic else "este tema"
    difficulty_map = {1: "fácil", 2: "medio", 3: "difícil"}
    difficulty = difficulty_map.get(question.difficulty, "medio")

    return (
        f"Esta es una pregunta de dificultad {difficulty} sobre {topic_name}. "
        f"La respuesta correcta es {correct_choice.label}: {correct_choice.text}."
    )


def generate_feedback_phase1(feedback: AttemptFeedback, db: Session, user: Optional[User] = None) -> dict:
    """
    Fase 1 - Rule-based feedback generator con PERSONALIZACIÓN.
    Estrategia:
    1. Si respuesta correcta: feedback positivo variado + encouragement personalizado
    2. Si incorrecta: hint personalizado basado en el perfil del usuario
    """
    
    # Obtener question y correcta choice
    question = db.query(Question).get(feedback.question_id)
    correct_choice = db.query(QuestionChoice).filter(
        QuestionChoice.question_id == feedback.question_id,
        QuestionChoice.is_correct == True
    ).first()
    
    if not question or not correct_choice:
        return {"explanation": "No se pudo generar feedback.", "source": "rule_based_phase1"}
    
    if feedback.is_correct:
        # Feedback positivo variado + personalización
        responses = {
            'principiante': [
                " ¡Excelente! Respuesta correcta. Vas mejorando.",
                " ¡Correcto! Así se aprende paso a paso.",
                " ¡Perfecto! Sigue practicando, vas bien.",
            ],
            'intermedio': [
                " ¡Muy bien! Demostraste dominar este concepto.",
                " ¡Excelente! Tu comprensión va en aumento.",
                " ¡Correcto! Mantén este ritmo de aprendizaje.",
            ],
            'avanzado': [
                " ¡Perfecto! Excelente precisión.",
                " ¡Súper! Dominas este contenido completamente.",
                " ¡Exacto! Un acierto más en tu camino.",
            ]
        }
        
        user_level = 'principiante'
        if user:
            try:
                user_level, _ = _get_user_overall_level(user, db)
            except:
                user_level = 'principiante'
        
        level_responses = responses.get(user_level, responses['principiante'])
        msg = level_responses[feedback.id % len(level_responses)]
        
        return {
            "explanation": msg,
            "is_correct": True,
            "source": "rule_based_phase1",
            "user_level": user_level
        }
    
    else:
        # Feedback negativo con hint PERSONALIZADO
        weak_topics = []
        user_level = 'principiante'
        
        if user:
            try:
                weak_topics = _get_user_weak_topics(user, db, threshold=0.6)
                user_level, _ = _get_user_overall_level(user, db)
            except:
                weak_topics = []
                user_level = 'principiante'
        
        hint = _build_personalized_hint(question, user, user_level, weak_topics, db)
        
        return {
            "explanation": f"Respuesta incorrecta. {hint}\n\nRespuesta correcta: {correct_choice.label}. {correct_choice.text}",
            "is_correct": False,
            "correct_choice_id": correct_choice.id,
            "correct_choice_label": correct_choice.label,
            "source": "rule_based_phase1",
            "user_level": user_level
        }


def generate_feedback(
    feedback: AttemptFeedback,
    db: Session,
    user: Optional[User] = None,
    allow_llm: bool = True,
) -> dict:
    """
    Main feedback generator con soporte para PERSONALIZACIÓN + LLM.
    
    Estrategia:
    1. Si respuesta correcta: Fase 1 (rule-based, rápido)
    2. Si respuesta incorrecta: Intentar OpenAI → Fallback rule-based
    
    Args:
        feedback: AttemptFeedback object
        db: Sesión de base de datos
        user: Usuario autenticado (opcional pero recomendado para personalización)
    """
    # Si la respuesta es correcta, usar feedback positivo personalizado (sempre rápido)
    if feedback.is_correct:
        return generate_feedback_phase1(feedback, db, user=user)

    # Para respuestas incorrectas, intentar LLM primero
    question = db.get(Question, feedback.question_id)
    if not question:
        return {"explanation": "No se pudo generar feedback.", "source": "error"}

    correct_choice = db.query(QuestionChoice).filter(
        QuestionChoice.question_id == feedback.question_id,
        QuestionChoice.is_correct == True,
    ).first()

    if not correct_choice:
        return {"explanation": "No se pudo generar feedback.", "source": "error"}

    selected_choice = None
    if feedback.selected_choice_id:
        selected_choice = db.get(QuestionChoice, feedback.selected_choice_id)

    if not selected_choice or not selected_choice.label:
        return generate_feedback_phase1(feedback, db, user=user)

    # Obtener nivel del usuario para personalización
    user_level = "intermedio"
    if user:
        try:
            user_level, _ = _get_user_overall_level(user, db)
        except:
            user_level = "intermedio"
    
    # ========================================================================
    # INTENTAR OPENAI PRIMERO - Si está habilitado
    # ========================================================================
    if allow_llm and generate_llm_explanation:
        try:
            from app.core.config import settings
            
            if settings.AI_ENABLE_LLM and settings.OPENAI_API_KEY:
                # Intentar generar con OpenAI
                llm_result = generate_llm_explanation(
                    question=question,
                    correct_choice=correct_choice,
                    selected_choice=selected_choice,
                    user=user,
                    user_level=user_level,
                    is_correct=False,
                    fallback_text=None
                )
                
                if llm_result and llm_result.get("success"):
                    return {
                        "explanation": llm_result["explanation"],
                        "is_correct": False,
                        "correct_choice_id": correct_choice.id,
                        "correct_choice_label": correct_choice.label,
                        "source": llm_result.get("model", "openai"),
                        "tokens_used": llm_result.get("tokens_used", 0)
                    }
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f" OpenAI failed, falling back: {str(e)}")

    # ========================================================================
    # FALLBACK: USAR SISTEMA DE REGLAS PERSONALIZADO
    # ========================================================================
    
    # Buscar en cache de explicaciones para esta opción incorrecta
    cached = db.query(QuestionExplanation).filter(
        QuestionExplanation.question_id == feedback.question_id,
        QuestionExplanation.wrong_option == selected_choice.label,
    ).first()

    if cached:
        cached.times_used += 1
        db.add(cached)
        db.commit()

        # Personalizar la explicación cacheada con datos del usuario si aplica
        explanation = cached.explanation_text
        if user:
            weak_topics = []
            try:
                weak_topics = _get_user_weak_topics(user, db, threshold=0.6)
            except:
                pass
            
            if question.topic and question.topic.code in weak_topics:
                explanation = f" Este es un tema donde tenemos que reforzar más.\n\n{explanation}"

        return {
            "explanation": (
                f"{explanation}\n\n"
                f"Respuesta correcta: {correct_choice.label}. {correct_choice.text}"
            ),
            "is_correct": False,
            "correct_choice_id": correct_choice.id,
            "correct_choice_label": correct_choice.label,
            "source": "smart_cache_hit",
        }

    # Si no hay cache, generar explicación personalizada y guardar en cache
    explanation_text = _build_core_explanation(question, correct_choice)
    
    # Agregar personalización según nivel
    weak_topics = []
    if user:
        try:
            weak_topics = _get_user_weak_topics(user, db, threshold=0.6)
        except:
            pass
    
    if question.topic and question.topic.code in weak_topics and user_level == "principiante":
        explanation_text = f" Tema donde practicar más.\n{explanation_text}"
    
    new_cache = QuestionExplanation(
        question_id=feedback.question_id,
        wrong_option=selected_choice.label,
        explanation_text=explanation_text,
    )
    db.add(new_cache)
    db.commit()

    return {
        "explanation": (
            f"{explanation_text}\n\n"
            f"Respuesta correcta: {correct_choice.label}. {correct_choice.text}"
        ),
        "is_correct": False,
        "correct_choice_id": correct_choice.id,
        "correct_choice_label": correct_choice.label,
        "source": "smart_cache_seed",
    }

