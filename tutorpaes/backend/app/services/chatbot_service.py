import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from openai import OpenAI
from app.core.config import settings
from app.db.models import User, ChatMessage, AIActionType, AIUsageLog
from app.services.openai_service import _get_openai_client
from app.services.ai_service import _get_user_overall_level, _get_user_weak_topics
from decimal import Decimal
import time

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_PEDAGOGICAL = """
Eres el Profesor IA de TutorPAES. Tu objetivo es ayudar a estudiantes chilenos a prepararse para la PAES.
Tu estilo es:
- SOCRÁTICO: No des la respuesta directamente. Guía al alumno con una pregunta o un pequeño desafío.
- EMPÁTICO: Valida la frustración, celebra los pequeños aciertos.
- PRECISO: Usa terminología PAES correcta.
- CONCISO: No escribas párrafos gigantes. Divide la explicación en pasos.

CONTEXTO DEL ESTUDIANTE:
Nivel: {user_level}
Temas débiles: {weak_topics}
Puntaje Objetivo: {target_score}

INSTRUCCIONES DE FLUJO:
1. Analiza qué está preguntando el alumno.
2. Si es una duda teórica, explícala con una analogía simple.
3. Si pide ayuda con un ejercicio, dale un 'hint' (pista) primero.
4. Si insiste en la respuesta, muéstrale el procedimiento paso a paso pero deja el resultado final para que él lo calcule.
"""

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
    
    # 2. Guardar mensaje del usuario
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
        
        # 6. Guardar respuesta del asistente
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
    attempt_id: Optional[int] = None
):
    """
    Versión con streaming (SSE) del loop pedagógico.
    """
    user_level, _ = _get_user_overall_level(user, db)
    weak_topics = _get_user_weak_topics(user, db)
    target_score = user.target_score or "No definido"
    
    # 1. Recuperar historial reciente (últimos 10 mensajes) ANTES de añadir el nuevo
    # para que el mensaje del usuario sea el último.
    history = db.query(ChatMessage).filter(
        ChatMessage.user_id == user.id
    ).order_by(ChatMessage.created_at.desc()).limit(10).all()
    history.reverse()

    # 2. Guardar mensaje del usuario
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
    
    messages = [{"role": "system", "content": formatted_system_prompt}]
    for h in history:
        messages.append({"role": h.role, "content": h.content})
    # Añadir el mensaje actual que acabamos de guardar
    messages.append({"role": "user", "content": user_message})
    
    client = _get_openai_client()
    if not client:
        yield "data: No se pudo conectar con el sistema de IA.\n\n"
        yield "data: [DONE]\n\n"
        return
        
    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=800,
            stream=True
        )
        
        full_content = ""
        for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full_content += content
                yield f"data: {content}\n\n"
        
        # 3. Guardar respuesta completa en DB al final
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
        logger.error(f"Error en stream pedagógico: {str(e)}")
        yield f"data: Error: {str(e)}\n\n"
        yield "data: [DONE]\n\n"
