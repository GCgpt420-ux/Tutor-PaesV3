from datetime import timezone
from app.db.models import (
    AttemptFeedback, Question, QuestionChoice, QuestionExplanation, 
    User, Attempt, Topic, AttemptStatus
)
from sqlalchemy.orm import Session
from sqlalchemy import func, select
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
    
    Returns:
        {
            'topic_code': {
                'total': 10,
                'correct': 7,
                'accuracy': 0.7,
                'difficulty_avg': 1.8,
                'recent': True  # Si respondió en los últimos 7 días
            }
        }
    """
    from sqlalchemy import func as sa_func
    
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=limit_days)
    
    # Obtener todos los intentos del usuario en este período
    attempts = db.query(Attempt).filter(
        Attempt.user_id == user.id,
        Attempt.status == "completed"
    ).all()
    
    # Filtrar por fecha en Python (safer with timezone awareness)
    attempts = [a for a in attempts if a.completed_at and a.completed_at.replace(tzinfo=None) >= cutoff_date]
    
    performance = {}
    
    for attempt in attempts:
        if not attempt.topic:
            continue
            
        topic_code = attempt.topic.code
        
        if topic_code not in performance:
            performance[topic_code] = {
                'topic_name': attempt.topic.name,
                'total': 0,
                'correct': 0,
                'incorrect': 0,
                'omitted': 0,
                'difficulty_levels': [],
            }
        
        perf = performance[topic_code]
        perf['total'] += attempt.total_questions or 0
        perf['correct'] += attempt.correct_count or 0
        perf['incorrect'] += attempt.incorrect_count or 0
        perf['omitted'] += attempt.omitted_count or 0
        
        # Recolectar dificultades
        questions = db.query(Question).filter(
            Question.topic_id == attempt.topic_id
        ).all()
        for q in questions:
            perf['difficulty_levels'].append(q.difficulty or 1)
    
    # Calcular métricas agregadas
    for topic_code, data in performance.items():
        total = data['total']
        if total > 0:
            data['accuracy'] = round(data['correct'] / total, 3)
            data['difficulty_avg'] = round(sum(data['difficulty_levels']) / len(data['difficulty_levels']), 1) if data['difficulty_levels'] else 1.0
        else:
            data['accuracy'] = 0
            data['difficulty_avg'] = 1.0
        
        # Marcar si es reciente (últimos 7 días)
        recent_cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        recent_attempts = [a for a in attempts if a.topic and a.topic.code == topic_code and a.completed_at and a.completed_at.replace(tzinfo=None) >= recent_cutoff]
        data['recent'] = len(recent_attempts) > 0
        
        del data['difficulty_levels']  # Limpiar datos temporales
    
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
    en preguntas del mismo tema.
    """
    attempts = db.query(Attempt).filter(
        Attempt.user_id == user.id,
        Attempt.topic_id == question.topic_id
    ).all()
    
    wrong_patterns = {}
    for attempt in attempts:
        feedbacks = db.query(AttemptFeedback).filter(
            AttemptFeedback.attempt_id == attempt.id,
            AttemptFeedback.is_correct == False
        ).all()
        
        for fb in feedbacks:
            if fb.selected_choice_id:
                choice = db.get(QuestionChoice, fb.selected_choice_id)
                if choice and not choice.is_correct:
                    wrong_patterns[choice.label] = wrong_patterns.get(choice.label, 0) + 1
    
    return sorted(wrong_patterns.items(), key=lambda x: x[1], reverse=True)[:limit]


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

