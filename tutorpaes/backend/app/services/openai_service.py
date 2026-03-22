"""
OpenAI LLM Service - Integración con GPT-4/GPT-3.5
=====================================================
Proporciona explicaciones de IA reales usando OpenAI API.
Con fallback automático al sistema de reglas si falla.
"""

import logging
from typing import Optional
from app.core.config import settings
from app.db.models import Question, QuestionChoice, User, AttemptFeedback

logger = logging.getLogger(__name__)


# ============================================================================
# OPENAI CLIENT INITIALIZATION
# ============================================================================

_client = None


def _get_openai_client():
    """Inicializa y cachea el cliente de OpenAI."""
    global _client
    
    if not settings.OPENAI_API_KEY:
        logger.warning(" OPENAI_API_KEY no está configurada. Usando fallback a rule-based.")
        return None
    
    if _client is None:
        try:
            from openai import OpenAI
            _client = OpenAI(
                api_key=settings.OPENAI_API_KEY,
                timeout=settings.OPENAI_TIMEOUT_SECONDS,
                max_retries=settings.OPENAI_MAX_RETRIES,
            )
            logger.info(
                " Cliente OpenAI inicializado correctamente (timeout=%ss, retries=%s)",
                settings.OPENAI_TIMEOUT_SECONDS,
                settings.OPENAI_MAX_RETRIES,
            )
        except ImportError:
            logger.error(" openai library no está instalada. Instala con: pip install openai")
            return None
        except Exception as e:
            logger.error(f" Error inicializando OpenAI: {e}")
            return None
    
    return _client


# ============================================================================
# PROMPT BUILDING - Construcción de prompts personalizados
# ============================================================================

def _build_personalized_prompt(
    question: Question,
    correct_choice: QuestionChoice,
    selected_choice: Optional[QuestionChoice],
    user: Optional[User],
    user_level: str = "intermedio",
    is_correct: bool = False
) -> str:
    """
    Construye un prompt avanzado y contextualizado para OpenAI que genere
    explicaciones educativas, detalladas y personalizadas según el perfil del usuario.
    
    Args:
        question: Pregunta de la que se solicita explicación
        correct_choice: Opción correcta
        selected_choice: Opción seleccionada por el usuario
        user: Usuario (para personalización)
        user_level: Nivel detectado (principiante/intermedio/avanzado)
        is_correct: Si la respuesta fue correcta
    """
    
    topic_context = question.topic.name if question.topic else "este tema"
    difficulty_text = {
        1: "fácil",
        2: "intermedia",
        3: "difícil"
    }.get(question.difficulty, "intermedia")
    
    # Instrucciones específicas por nivel
    level_details = {
        "principiante": {
            "tone": "muy paciente y alentador",
            "depth": "conceptos básicos sin jerga",
            "examples": "2-3 ejemplos simples",
            "detail": "10-12 líneas"
        },
        "intermedio": {
            "tone": "profesional y constructivo",
            "depth": "conceptos intermedios con conexiones",
            "examples": "1-2 ejemplos relevantes",
            "detail": "8-10 líneas"
        },
        "avanzado": {
            "tone": "analítico y desafiante",
            "depth": "conceptos avanzados con generalizaciones",
            "examples": "referencias a casos conexos",
            "detail": "6-8 líneas con profundidad"
        }
    }
    
    level_info = level_details.get(user_level, level_details["intermedio"])
    
    if is_correct:
        prompt = f"""
Eres un TUTOR EXPERTO de matemáticas PAES/PSU con 10+ años de experiencia.

CONTEXTO DEL ESTUDIANTE:
- Nivel: {user_level}
- Tema: {topic_context}
- Dificultad de pregunta: {difficulty_text}

El estudiante respondió CORRECTAMENTE. Tu tarea es:

1. RECONOCER: Valida genuinamente su respuesta
2. REFORZAR: Explica por QUÉ es correcta (el razonamiento detrás)
3. EXPANDIR: Conecta con conceptos relacionados
4. MOTIVAR: Encuraja a seguir mejorando

**PREGUNTA:**
{question.prompt}

**RESPUESTA DEL ESTUDIANTE:**
{selected_choice.label}. {selected_choice.text if selected_choice else '[No proporcionada]'}

**RESPUESTA CORRECTA:**
{correct_choice.label}. {correct_choice.text}

INSTRUCCIONES:
- Tono: {level_info['tone']}
- Profundidad: {level_info['depth']}
- Incluye: {level_info['examples']}
- Largo: aproximadamente {level_info['detail']}
- Estructura: encabezado motivador → explicación → conexión con otros temas
- NO repitas la pregunta, asume que ya la leyó
"""
    else:
        prompt = f"""
Eres un TUTOR EXPERTO de matemáticas PAES/PSU con 10+ años de experiencia.

CONTEXTO DEL ESTUDIANTE:
- Nivel: {user_level}
- Tema: {topic_context}
- Dificultad de pregunta: {difficulty_text}

El estudiante respondió INCORRECTAMENTE. Tu tarea es ENSEÑAR, no solo corregir.

**LA PREGUNTA:**
{question.prompt}

**LO QUE EL ESTUDIANTE RESPONDIÓ:**
{selected_choice.label if selected_choice else '[Sin alternativa]'}.
{selected_choice.text if selected_choice else '[No proporcionada]'}

**LA RESPUESTA CORRECTA:**
{correct_choice.label}. {correct_choice.text}

ESTRUCTURA OBLIGATORIA DE TU RESPUESTA:

1.  ANÁLISIS DEL ERROR (2 líneas máx)
   ¿Por qué la respuesta del estudiante es incorrecta?
   Sé específico sobre el error conceptual o procedimental

2.  EXPLICACIÓN DEL CONCEPTO (3-4 líneas)
   Enseña el concepto correcto paso a paso
   Usa lenguaje accesible para nivel {user_level}
   Justifica POR QUÉ la respuesta correcta es correcta

3.  SOLUCIÓN PASO A PASO (si aplica)
   Si es un cálculo/procedimiento, muestra los pasos
   Explica cada paso brevemente

4.  CONSEJO PARA NO VOLVER A EQUIVOCARSE
   Qué debe recordar o practicar el estudiante
   Un truco o regla mnemotécnica

5.  CONEXIÓN (opcional para {user_level})
   Cómo se relaciona con otros temas

INSTRUCCIONES DE TONO:
- Tono: {level_info['tone']}
- NO desencorajador, SÍ constructivo
- Valida el esfuerzo aunque esté mal
- Menciona que es común este error

INSTRUCCIONES DE CONTENIDO:
- Profundidad: {level_info['depth']}
- Incluye: {level_info['examples']}
- Largo TOTAL: aproximadamente {level_info['detail']}
- Usa ejemplos de la vida real si es posible
- NO repitas la pregunta completa

Genera ahora tu respuesta estructurada:
"""
    
    return prompt


# ============================================================================
# LLM EXPLANATION GENERATION
# ============================================================================

def generate_llm_explanation(
    question: Question,
    correct_choice: QuestionChoice,
    selected_choice: Optional[QuestionChoice],
    user: Optional[User] = None,
    user_level: str = "intermedio",
    is_correct: bool = False,
    fallback_text: str = None
) -> dict:
    """
    Genera una explicación usando OpenAI API.
    Con fallback automático si falla.
    
    Returns:
        {
            "explanation": "Explicación generada",
            "model": "openai/gpt-3.5-turbo",
            "success": True/False
        }
    """
    
    # Si no está habilitado LLM o no hay API key, retornar fallback
    if not settings.AI_ENABLE_LLM or not settings.OPENAI_API_KEY:
        return {
            "explanation": fallback_text or "No se pudo generar explicación personalizada.",
            "model": "rule_based_fallback",
            "success": False
        }
    
    client = _get_openai_client()
    if not client:
        return {
            "explanation": fallback_text or "No se pudo generar explicación personalizada.",
            "model": "rule_based_fallback",
            "success": False
        }
    
    try:
        prompt = _build_personalized_prompt(
            question=question,
            correct_choice=correct_choice,
            selected_choice=selected_choice,
            user=user,
            user_level=user_level,
            is_correct=is_correct
        )
        
        # Llamar a OpenAI
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "Eres un tutor experto en educación para estudiantes de PAES/PSU."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=settings.OPENAI_TEMPERATURE,
            max_tokens=settings.OPENAI_MAX_TOKENS
        )
        
        explanation = response.choices[0].message.content.strip()
        
        logger.info(f" OpenAI generó explicación exitosamente")
        
        return {
            "explanation": explanation,
            "model": f"openai/{settings.OPENAI_MODEL}",
            "success": True,
            "tokens_used": response.usage.total_tokens
        }
    
    except Exception as e:
        logger.warning(f" Error llamando OpenAI: {str(e)}. Usando fallback.")
        return {
            "explanation": fallback_text or f"Error generando explicación: {str(e)}",
            "model": "rule_based_fallback",
            "success": False,
            "error": str(e)
        }


def generate_llm_explanation_stream(
    question: Question,
    correct_choice: QuestionChoice,
    selected_choice: Optional[QuestionChoice],
    user: Optional[User] = None,
    user_level: str = "intermedio",
    is_correct: bool = False,
    fallback_text: str = None
):
    """
    Generador que emite eventos SSE (Server-Sent Events) del stream de OpenAI.
    Ideal para disminuir el TTI en el Frontend a < 2s.
    """
    if not settings.AI_ENABLE_LLM or not settings.OPENAI_API_KEY:
        yield f"data: {fallback_text or 'No LLM Key Configured'}\n\n"
        yield "data: [DONE]\n\n"
        return

    client = _get_openai_client()
    if not client:
        yield f"data: {fallback_text or 'Could not initialize OpenAI Client'}\n\n"
        yield "data: [DONE]\n\n"
        return

    try:
        prompt = _build_personalized_prompt(
            question=question,
            correct_choice=correct_choice,
            selected_choice=selected_choice,
            user=user,
            user_level=user_level,
            is_correct=is_correct
        )
        
        # Llamar a OpenAI con stream=True
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "Eres un tutor experto en educación para estudiantes de PAES/PSU."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=settings.OPENAI_TEMPERATURE,
            max_tokens=settings.OPENAI_MAX_TOKENS,
            stream=True
        )
        
        for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                # Sanitizar nuevas líneas para SSE
                content = chunk.choices[0].delta.content.replace('\\n', '\n')
                # Enviar como JSON simple escapado manual para evitar malformaciones
                yield f"data: {content}\n\n"

        yield "data: [DONE]\n\n"
        
    except Exception as e:
        logger.warning(f"Error llamando OpenAI Stream: {str(e)}. Usando fallback.")
        yield f"data: {fallback_text or f'Error interconectando con LLM: {str(e)}'}\n\n"
        yield "data: [DONE]\n\n"


def generate_llm_hint(
    question: Question,
    user_level: str = "intermedio"
) -> dict:
    """
    Genera un hint específico para ayudar sin revelar la respuesta.
    """
    
    if not settings.AI_ENABLE_LLM or not settings.OPENAI_API_KEY:
        return {
            "hint": "",
            "model": "rule_based_fallback",
            "success": False
        }
    
    client = _get_openai_client()
    if not client:
        return {"hint": "", "model": "rule_based_fallback", "success": False}
    
    try:
        topic_context = question.topic.name if question.topic else "este tema"
        difficulty = {1: "fácil", 2: "intermedia", 3: "difícil"}.get(question.difficulty, "intermedia")
        
        prompt = f"""
Pregunta de {difficulty} dificultad sobre {topic_context}:
{question.prompt}

Genera un hint BREVE (máximo 1 línea) que ayude a un estudiante de nivel {user_level} 
sin revelar la respuesta. El hint debe ser:
- Provocador (hacer pensar)
- Específico del concepto
- No la respuesta
"""
        
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "Eres un tutor que genera hints útiles."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=100
        )
        
        hint = response.choices[0].message.content.strip()
        
        return {
            "hint": hint,
            "model": f"openai/{settings.OPENAI_MODEL}",
            "success": True
        }
    
    except Exception as e:
        logger.warning(f" Error generando hint con OpenAI: {str(e)}")
        return {
            "hint": "",
            "model": "rule_based_fallback",
            "success": False,
            "error": str(e)
        }


# ============================================================================
# HEALTH CHECK
# ============================================================================

def check_openai_connection() -> dict:
    """Verifica que la conexión con OpenAI sea válida."""
    
    if not settings.OPENAI_API_KEY:
        return {
            "status": "not_configured",
            "message": "OPENAI_API_KEY no está configurada"
        }
    
    client = _get_openai_client()
    if not client:
        return {
            "status": "error",
            "message": "No se pudo inicializar cliente OpenAI"
        }
    
    try:
        # Hacer una llamada mínima para verificar
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{"role": "user", "content": "Hi"}],
            max_tokens=1
        )
        
        return {
            "status": "ok",
            "message": f"Conexión exitosa con {settings.OPENAI_MODEL}",
            "model": settings.OPENAI_MODEL
        }
    
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error verificando conexión: {str(e)}"
        }
