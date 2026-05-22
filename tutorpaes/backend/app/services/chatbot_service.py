import logging
from typing import List, Optional, Dict, Any, Generator
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.models import User, ChatMessage, AIUsageLog, Attempt, AttemptFeedback, Question, QuestionChoice
from app.services.llm_provider_service import stream_llm_response
from app.services.ai_service import _get_user_overall_level, _get_user_weak_topics
from decimal import Decimal
import time

logger = logging.getLogger(__name__)


def _fallback_tutor_reply(user_message: str) -> str:
    prompt = (user_message or "").strip()
    if not prompt:
        return (
            "Estoy aquí para ayudarte. Cuéntame qué tema PAES estás viendo y te guío paso a paso."
        )
    return (
        "Ahora mismo tuve un problema técnico con el motor IA, pero sí puedo ayudarte. "
        f"Tomemos tu pregunta: '{prompt}'. "
        "Partamos por identificar qué te pide exactamente, qué datos tienes y qué estrategia usarías primero."
    )

SYSTEM_PROMPT_PEDAGOGICAL = """
Eres Tuto, el Profesor IA de TutorPAES. Acompañas a estudiantes chilenos en su preparación para la PAES.

═══ PERSONALIDAD ═══
Eres cálido pero directo. Inteligente sin ser pedante. Paciente sin ser condescendiente.
Tratas al estudiante como alguien capaz que necesita las herramientas correctas.
Usas lenguaje natural chileno: "ya", "mira", "fíjate que", "ojo con esto".
Evitas frases vacías como "¡Excelente!", "¡Muy bien!", "¡Perfecto!". En su lugar usa: "Exacto.", "Eso.", "Bien pensado.", "Justo."

═══ CONTEXTO DEL ESTUDIANTE ═══
Nivel de desempeño: {user_level}
Temas que necesitan refuerzo: {weak_topics}
Objetivo de puntaje: {target_score}

═══ PROTOCOLO PEDAGÓGICO ═══

Cuando el estudiante RESPONDIÓ CORRECTAMENTE:
→ Confirma brevemente y haz una pregunta que profundice el razonamiento.
   Ejemplo: "Exacto. ¿Por qué descartaste la opción C en este caso?"
→ No expliques lo que ya sabe. Llévalo al siguiente nivel de comprensión.

Cuando el estudiante RESPONDIÓ INCORRECTAMENTE:
→ NO reveles la respuesta correcta aún. Primero diagnostica su razonamiento:
   "Antes de explicarte, cuéntame: ¿cómo llegaste a esa respuesta?"
→ Trabaja desde el error del estudiante como punto de partida, no desde cero.
→ Si tras 2 turnos sigue bloqueado, entra a la FASE EXPLICATIVA directamente.

Cuando el estudiante PIDE EXPLICACIÓN DIRECTA (dice "explícame", "no entiendo", "dime la respuesta"):
→ Entra inmediatamente a la FASE EXPLICATIVA. No lo hagas esperar ni lo redirigues con otra pregunta.

FASE EXPLICATIVA (cuando corresponde):
→ Explica el concepto completo y estructurado.
→ USA markdown con criterio: **negrita** para conceptos clave, listas numeradas para pasos, bloques para fórmulas.
→ Termina siempre con: "¿Qué parte quedó menos clara?"

═══ ESTRATEGIAS POR MATERIA ═══

MATEMÁTICA:
- Pide al estudiante que verbalice su proceso antes de explicar el error.
- Para álgebra: usa números concretos antes de generalizar con variables.
- Para geometría: "¿Cómo describirías la figura antes de calcular?"
- Para estadística: conecta con datos de contexto real (promedios de notas, encuestas, etc.)

LENGUAJE Y COMUNICACIÓN:
- Para comprensión lectora: pregunta siempre por la idea principal antes del detalle específico.
- Para gramática: usa el método de sustitución oral.
- Para argumentación: identifica primero la tesis, luego los argumentos.
- Nunca parafrasees el texto completo — enseña al estudiante a leerlo él mismo.

CIENCIAS:
- Física: identifica el sistema y las variables antes de aplicar fórmulas.
- Química: usa comparaciones cuando hay múltiples elementos o compuestos.
- Biología: conecta el proceso con su función vital antes del mecanismo molecular.

HISTORIA Y CIENCIAS SOCIALES:
- Estructura base: causas → hechos → consecuencias.
- Para fuentes históricas: contexto del autor primero, contenido después.
- Para geografía: del contexto global al local.

═══ REGLAS FIJAS ═══
1. Nunca des la respuesta correcta directamente en las primeras 2 interacciones sobre la misma pregunta.
2. Máximo 4 oraciones en modo socrático. Sin límite en fase explicativa.
3. Si no sabes algo, dilo con honestidad: "Ese contenido no lo domino bien. Te recomiendo buscarlo en una fuente adicional."
4. El estudiante puede pedirte que cambies de estrategia. Adáptate sin resistencia.
5. Nunca repitas la misma pregunta socrática dos veces seguidas.
"""


def _load_chat_history(db: Session, user_id: int, attempt_id: Optional[int], limit: int = 10) -> list[ChatMessage]:
    query = db.query(ChatMessage).filter(ChatMessage.user_id == user_id)
    if attempt_id is not None:
        query = query.filter(ChatMessage.attempt_id == attempt_id)

    history = query.order_by(ChatMessage.created_at.desc()).limit(limit).all()
    history.reverse()
    return history


def _format_attempt_context(context: Optional[Dict[str, Any]]) -> Optional[str]:
    if not context:
        return None

    lines: list[str] = ["CONTEXTO DEL EJERCICIO ACTUAL:"]

    subject_code = context.get("subject_code")
    topic_code = context.get("topic_code")
    if subject_code or topic_code:
        lines.append(f"Materia: {subject_code or 'N/D'} | Tema: {topic_code or 'N/D'}")

    question_prompt = context.get("question_prompt")
    if question_prompt:
        lines.append(f"Pregunta: {question_prompt}")

    reading_text = context.get("reading_text")
    if reading_text:
        lines.append(f"Texto base: {reading_text}")

    choices = context.get("choices") or []
    if choices:
        serialized_choices = "; ".join(
            f"{choice.get('label', '?')}: {choice.get('text', '').strip()}"
            for choice in choices
            if choice.get("text")
        )
        if serialized_choices:
            lines.append(f"Alternativas: {serialized_choices}")

    selected_choice_label = context.get("selected_choice_label")
    selected_choice_text = context.get("selected_choice_text")
    if selected_choice_label or selected_choice_text:
        lines.append(
            f"Respuesta del estudiante: {selected_choice_label or '?'} - {selected_choice_text or ''}".strip()
        )

    if context.get("is_correct") is True:
        lines.append("Resultado: el estudiante respondió correctamente.")
    elif context.get("is_correct") is False:
        lines.append("Resultado: el estudiante respondió incorrectamente.")

    correct_choice_label = context.get("correct_choice_label")
    correct_choice_text = context.get("correct_choice_text")
    if correct_choice_label or correct_choice_text:
        lines.append(
            f"Respuesta correcta: {correct_choice_label or '?'} - {correct_choice_text or ''}".strip()
        )

    feedback_text = context.get("feedback_text")
    if feedback_text:
        lines.append(f"Feedback previo: {feedback_text}")

    return "\n".join(lines) if len(lines) > 1 else None


def _build_conversation_messages(
    system_prompt: str,
    history: list[ChatMessage],
    user_message: str,
    exercise_context: Optional[Dict[str, Any]] = None,
) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]

    formatted_context = _format_attempt_context(exercise_context)
    if formatted_context:
        messages.append({"role": "system", "content": formatted_context})

    for item in history:
        messages.append({"role": item.role, "content": item.content})

    messages.append({"role": "user", "content": user_message})
    return messages


def _load_attempt_context(
    db: Session,
    attempt_id: Optional[int],
    explicit_context: Optional[Dict[str, Any]] = None,
) -> Optional[Dict[str, Any]]:
    context = dict(explicit_context or {})
    if attempt_id is None:
        return context or None

    attempt = db.get(Attempt, attempt_id)
    if not attempt:
        return context or None

    if getattr(attempt, "subject", None) is not None and getattr(attempt.subject, "code", None):
        context.setdefault("subject_code", attempt.subject.code)
    if getattr(attempt, "topic", None) is not None and getattr(attempt.topic, "code", None):
        context.setdefault("topic_code", attempt.topic.code)

    latest_feedback = (
        db.query(AttemptFeedback)
        .filter(AttemptFeedback.attempt_id == attempt_id)
        .order_by(AttemptFeedback.created_at.desc())
        .first()
    )
    if not latest_feedback:
        return context or None

    question = db.get(Question, latest_feedback.question_id)
    if question:
        context.setdefault("question_prompt", question.prompt)
        if question.reading_text:
            context.setdefault("reading_text", question.reading_text)

        choices = db.query(QuestionChoice).filter(QuestionChoice.question_id == question.id).order_by(QuestionChoice.label.asc()).all()
        if choices:
            context.setdefault(
                "choices",
                [{"label": choice.label, "text": choice.text} for choice in choices],
            )

            selected_choice = next((choice for choice in choices if choice.id == latest_feedback.selected_choice_id), None)
            if selected_choice:
                context.setdefault("selected_choice_label", selected_choice.label)
                context.setdefault("selected_choice_text", selected_choice.text)

            correct_choice = next((choice for choice in choices if choice.is_correct), None)
            if correct_choice:
                context.setdefault("correct_choice_label", correct_choice.label)
                context.setdefault("correct_choice_text", correct_choice.text)

    context.setdefault("is_correct", latest_feedback.is_correct)

    ai_payload = latest_feedback.ai_payload or {}
    feedback_text = ai_payload.get("explanation") or ai_payload.get("hint") or latest_feedback.feedback_text
    if feedback_text:
        context.setdefault("feedback_text", feedback_text)

    return context or None

async def run_pedagogical_loop(
    db: Session,
    user: User,
    user_message: str,
    attempt_id: Optional[int] = None
) -> str:
    """
    Ejecuta el loop conversacional del Profesor IA.
    Similar al loop del bot externo pero integrado en el Core.
    """
    
    # 1. Obtener contexto de personalización
    user_level, _ = _get_user_overall_level(user, db)
    weak_topics = _get_user_weak_topics(user, db)
    target_score = user.target_score or "No definido"
    
    # 2. Guardar mensaje del usuario (solo si existe contexto de attempt)
    if attempt_id is not None:
        new_msg = ChatMessage(
            user_id=user.id,
            attempt_id=attempt_id,
            role="user",
            content=user_message
        )
        db.add(new_msg)
        db.commit()
    
    # 3. Recuperar historial reciente (últimos 10 mensajes)
    history = db.query(ChatMessage).filter(
        ChatMessage.user_id == user.id
    ).order_by(ChatMessage.created_at.desc()).limit(10).all()
    history.reverse()
    
    # 4. Preparar Prompt
    formatted_system_prompt = SYSTEM_PROMPT_PEDAGOGICAL.format(
        user_level=user_level,
        weak_topics=", ".join(weak_topics) if weak_topics else "Ninguno detectado",
        target_score=target_score
    )
    
    messages = [{"role": "system", "content": formatted_system_prompt}]
    for h in history:
        messages.append({"role": h.role, "content": h.content})
    
    # 5. Llamada a OpenAI
    client = _get_openai_client()
    if not client:
        return "Lo siento, el sistema de IA no está configurado correctamente."
        
    try:
        start_time = time.time()
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=800
        )
        latency_ms = int((time.time() - start_time) * 1000)
        
        ai_response = response.choices[0].message.content
        tokens_used = response.usage.total_tokens
        prompt_tokens = response.usage.prompt_tokens
        completion_tokens = response.usage.completion_tokens
        
        # 6. Guardar respuesta del asistente (solo si existe contexto de attempt)
        if attempt_id is not None:
            assistant_msg = ChatMessage(
                user_id=user.id,
                attempt_id=attempt_id,
                role="assistant",
                content=ai_response
            )
            db.add(assistant_msg)
        
        # 7. Registrar uso (Auditoría de Costos)
        # Estimación simple de costo (GPT-3.5 turbo as default)
        cost = Decimal("0.000002") * Decimal(tokens_used) # Placeholder simple
        
        usage_log = AIUsageLog(
            user_id=user.id,
            action_type="chat",
            model=settings.OPENAI_MODEL,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_cost=cost,
            latency_ms=latency_ms
        )
        db.add(usage_log)
        db.commit()
        
        return ai_response
        
    except Exception as e:
        logger.error(f"Error en loop pedagógico: {str(e)}")
        return "Tuve un pequeño problema técnico procesando tu duda. ¿Podrías repetirla?"

def run_pedagogical_loop_stream(
    db: Session,
    user: User,
    user_message: str,
    attempt_id: Optional[int] = None,
    question_context: Optional[Dict[str, Any]] = None,
) -> Generator[str, None, None]:
    """
    Versión con streaming (SSE) del loop pedagógico.
    Soporta múltiples proveedores de LLM (OpenAI, Groq, Cerebras).
    """
    user_level, _ = _get_user_overall_level(user, db)
    weak_topics = _get_user_weak_topics(user, db)
    target_score = user.target_score or "No definido"
    
    # 1. Recuperar historial reciente (últimos 10 mensajes) ANTES de añadir el nuevo
    # para que el mensaje del usuario sea el último.
    history = _load_chat_history(db, user.id, attempt_id)

    # 2. Guardar mensaje del usuario (solo si existe contexto de attempt)
    if attempt_id is not None:
        new_msg = ChatMessage(
            user_id=user.id,
            attempt_id=attempt_id,
            role="user",
            content=user_message
        )
        db.add(new_msg)
        db.commit()
    
    formatted_system_prompt = SYSTEM_PROMPT_PEDAGOGICAL.format(
        user_level=user_level,
        weak_topics=", ".join(weak_topics) if weak_topics else "Ninguno detectado",
        target_score=target_score
    )
    exercise_context = _load_attempt_context(db, attempt_id, question_context)
    conversation_messages = _build_conversation_messages(
        formatted_system_prompt,
        history,
        user_message,
        exercise_context,
    )
    
    if not settings.AI_ENABLE_LLM:
        logger.warning("AI_ENABLE_LLM is False, using fallback reply")
        fallback = _fallback_tutor_reply(user_message)
        yield f"data: {fallback}\n\n"
        yield "data: [DONE]\n\n"
        return
        
    try:
        full_content = ""
        
        # Usar stream_llm_response que soporta OpenAI, Groq, Cerebras
        for chunk in stream_llm_response(
            system_prompt=formatted_system_prompt,
            user_message=user_message,
            conversation_messages=conversation_messages,
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS
        ):
            content = str(chunk)
            full_content += content
            yield f"data: {content}\n\n"
        
        # 3. Guardar respuesta completa en DB al final (solo si existe contexto de attempt)
        if attempt_id is not None:
            assistant_msg = ChatMessage(
                user_id=user.id,
                attempt_id=attempt_id,
                role="assistant",
                content=full_content
            )
            db.add(assistant_msg)
            db.commit()
        
        yield "data: [DONE]\n\n"
        
    except Exception as e:
        logger.error(f"Error en stream pedagógico ({settings.LLM_PROVIDER}): {str(e)}")
        fallback = _fallback_tutor_reply(user_message)
        yield f"data: {fallback}\n\n"
        yield "data: [DONE]\n\n"
