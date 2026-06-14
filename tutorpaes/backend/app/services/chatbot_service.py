import logging
import json
from typing import List, Optional, Dict, Any, Generator
from sqlalchemy.orm import Session
from sqlalchemy.orm import aliased
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


def _extract_feedback_text(ai_payload: Any, fallback_text: Optional[str]) -> Optional[str]:
    """
    Extrae texto util desde ai_payload de forma segura.

    ai_payload puede venir como dict, str(JSON), o valores corruptos heredados.
    Nunca debe lanzar excepcion para no romper el stream SSE.
    """
    payload_obj: Dict[str, Any] = {}

    try:
        if isinstance(ai_payload, dict):
            payload_obj = ai_payload
        elif isinstance(ai_payload, str) and ai_payload.strip():
            parsed = json.loads(ai_payload)
            if isinstance(parsed, dict):
                payload_obj = parsed
    except Exception:
        payload_obj = {}

    explanation = payload_obj.get("explanation")
    hint = payload_obj.get("hint")
    if isinstance(explanation, str) and explanation.strip():
        return explanation.strip()
    if isinstance(hint, str) and hint.strip():
        return hint.strip()
    if isinstance(fallback_text, str) and fallback_text.strip():
        return fallback_text.strip()
    return None


def _load_recent_topic_errors(
    db: Session,
    user_id: int,
    topic_id: Optional[int],
    limit: int = 3,
) -> list[dict[str, str]]:
    """
    Recupera los ultimos errores (incorrectos) del alumno en un tema.
    Resultado acotado para inyectar memoria historica en el prompt.
    """
    if not topic_id:
        return []

    selected_choice_alias = aliased(QuestionChoice)
    correct_choice_alias = aliased(QuestionChoice)

    rows = (
        db.query(
            AttemptFeedback.created_at,
            Question.prompt,
            selected_choice_alias.label,
            selected_choice_alias.text,
            correct_choice_alias.label,
            correct_choice_alias.text,
        )
        .join(Attempt, Attempt.id == AttemptFeedback.attempt_id)
        .join(Question, Question.id == AttemptFeedback.question_id)
        .outerjoin(
            selected_choice_alias,
            selected_choice_alias.id == AttemptFeedback.selected_choice_id,
        )
        .outerjoin(
            correct_choice_alias,
            and_(
                correct_choice_alias.question_id == AttemptFeedback.question_id,
                correct_choice_alias.is_correct == True,  # noqa: E712
            ),
        )
        .filter(
            Attempt.user_id == user_id,
            Attempt.topic_id == topic_id,
            AttemptFeedback.is_correct == False,  # noqa: E712
        )
        .order_by(AttemptFeedback.created_at.desc())
        .limit(limit)
        .all()
    )

    errors: list[dict[str, str]] = []
    for row in rows:
        errors.append(
            {
                "question_prompt": (row[1] or "").strip(),
                "selected_label": (row[2] or "?").strip(),
                "selected_text": (row[3] or "").strip(),
                "correct_label": (row[4] or "?").strip(),
                "correct_text": (row[5] or "").strip(),
            }
        )

    return errors


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

    recent_topic_errors = context.get("recent_topic_errors") or []
    if recent_topic_errors:
        lines.append("MEMORIA HISTORICA DE ERRORES EN ESTE TEMA (ultimos 3):")
        for idx, item in enumerate(recent_topic_errors, start=1):
            q = (item.get("question_prompt") or "[sin enunciado]").strip()
            selected = f"{item.get('selected_label', '?')} - {item.get('selected_text', '')}".strip()
            correct = f"{item.get('correct_label', '?')} - {item.get('correct_text', '')}".strip()
            lines.append(
                f"{idx}) Pregunta: {q} | Eligio: {selected} | Correcta: {correct}"
            )

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
    feedback_text = _extract_feedback_text(ai_payload, latest_feedback.feedback_text)
    if feedback_text:
        context.setdefault("feedback_text", feedback_text)

    try:
        recent_errors = _load_recent_topic_errors(db, attempt.user_id, attempt.topic_id, limit=3)
        if recent_errors:
            context.setdefault("recent_topic_errors", recent_errors)
    except Exception as exc:
        logger.warning("No se pudo cargar memoria historica de errores: %s", str(exc))

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
        try:
            db.commit()
        except Exception as exc:
            db.rollback()
            logger.warning("No se pudo persistir mensaje de usuario en chat stream: %s", str(exc))
    
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
    try:
        user_level, _ = _get_user_overall_level(user, db)
    except Exception as exc:
        logger.warning("No se pudo calcular user_level, usando default: %s", str(exc))
        user_level = "principiante"

    try:
        weak_topics = _get_user_weak_topics(user, db)
    except Exception as exc:
        logger.warning("No se pudo calcular weak_topics, usando vacio: %s", str(exc))
        weak_topics = []

    target_score = user.target_score or "No definido"
    
    # 1. Recuperar historial reciente (últimos 10 mensajes) ANTES de añadir el nuevo
    # para que el mensaje del usuario sea el último.
    try:
        history = _load_chat_history(db, user.id, attempt_id)
    except Exception as exc:
        logger.warning("No se pudo cargar historial de chat, continuando sin historial: %s", str(exc))
        history = []

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
    try:
        exercise_context = _load_attempt_context(db, attempt_id, question_context)
    except Exception as exc:
        logger.warning("No se pudo cargar contexto de intento, continuando sin contexto: %s", str(exc))
        exercise_context = question_context or None
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
            try:
                db.commit()
            except Exception as exc:
                db.rollback()
                logger.warning("No se pudo persistir mensaje del asistente en chat stream: %s", str(exc))
        
        yield "data: [DONE]\n\n"
        
    except Exception as e:
        logger.error(f"Error en stream pedagógico ({settings.LLM_PROVIDER}): {str(e)}")
        fallback = _fallback_tutor_reply(user_message)
        yield f"data: {fallback}\n\n"
        yield "data: [DONE]\n\n"
