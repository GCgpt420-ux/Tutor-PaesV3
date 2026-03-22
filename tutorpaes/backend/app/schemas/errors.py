from pydantic import BaseModel, Field
from typing import Optional


class ErrorOut(BaseModel):
    """
    Schema formal para respuestas de error en toda la API.
    
    esto es mejor - contrato explícito y validado para errores
    
    Propósito:
    Todos los endpoints que lanzan excepciones generan respuestas ErrorOut
    automáticamente. Esto asegura consistencia absoluta en manejo de errores.
    
    Ejemplo de flujo:
        1. Endpoint valida algo: if not topic: raise not_found("topic", detail)
        2. not_found() retorna HTTPException con detail como dict ErrorOut
        3. FastAPI convierte a JSON y valida contra este schema
        4. Cliente recibe JSON con estructura garantizada
    
    Campos:
    
    error (str):
        - Identificador único del error en snake_case
        - Ejemplos: topic_not_found, exam_not_seeded, invalid_choice
        - Propósito: Cliente puede hacer "if error == 'topic_not_found'" sin parsear
        - Patrón: "{entity}_not_found" para 404, "{action}_failed" para 500, etc
    
    detail (Optional[str]):
        - Información contextual específica del error
        - Ejemplos: "topic_code=ALG", "user_id=42 no existe"
        - Propósito: Debugging, logs estructurados, mensajes específicos al usuario
        - Pauta: Incluir parámetros que llevaron al error
    
    code (Optional[str]):
        - Código HTTP semántico redundante (mayorúsculas)
        - Valores válidos: NOT_FOUND, BAD_REQUEST, CONFLICT, INTERNAL_ERROR
        - Propósito: Compatibilidad, monitoreo, documentación
        - Ventaja: Información en el body si headers HTTP se pierden
    
    Ejemplo de respuesta completa:
    {
        "error": "topic_not_found",
        "detail": "topic_code=ALG no existe en subject_code=M1",
        "code": "NOT_FOUND"
    }
    
    Cómo se genera:
    1. Endpoint: raise not_found("topic", "topic_code=ALG")
    2. Función: devuelve HTTPException(status_code=404, detail={...})
    3. FastAPI: convierte a JSON y valida contra ErrorOut
    4. Cliente: recibe JSON con error="topic_not_found"
    
    Beneficios arquitectónicos:
    1. Validación: Pydantic rechaza respuestas que no cumplan la estructura
    2. Documentación: Swagger muestra automáticamente el schema
    3. Consistencia: Sin excepciones, todos los errores son idénticos
    4. Frontend: Puede usar el campo "error" para lógica condicional
    5. Monitoreo: Logs estructurados (no parsear strings)
    6. Testing: Fácil de validar respuestas de error
    
    Patrón DDD (Domain-Driven Design):
    - not_found(), bad_request(), conflict(), internal_error()
    - Estos no son HTTPExceptions genéricas
    - Son excepciones del dominio que mapean a HTTP
    - El schema ErrorOut es el contrato entre API e cliente
    """
    
    error: str = Field(
        ...,
        description="Identificador único del error en snake_case"
    )
    detail: Optional[str] = Field(
        None,
        description="Contexto adicional: parámetros, valores, por qué falló"
    )
    code: Optional[str] = Field(
        None,
        description="Código HTTP semántico redundante: NOT_FOUND, BAD_REQUEST, etc"
    )

    class Config:
        # Swagger usa este ejemplo para mostrar respuestas de error
        example = {
            "error": "topic_not_found",
            "detail": "topic_code=ALG en subject_code=M1",
            "code": "NOT_FOUND"
        }

