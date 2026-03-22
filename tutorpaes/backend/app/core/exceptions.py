from fastapi import HTTPException, status


def not_found(entity: str, detail: str = ""):
    """
    Excepción 404: Recurso no encontrado.
    
    esto es mejor - excepciones tipadas por dominio
    
    Args:
        entity: nombre del recurso (ej: "topic", "question", "user")
        detail: información contextual (ej: "topic_code=ALG")
    
    Retorna HTTPException con ErrorOut structure:
        {
            "error": "{entity}_not_found",
            "detail": "{detail}",
            "code": "NOT_FOUND"
        }
    
    Ejemplo:
        raise not_found("topic", f"topic_code={topic_code}")
    
    Beneficios:
    - Código coherente y reutilizable
    - Errores estructurados (no strings sueltos)
    - Validados con ErrorOut schema
    """
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={
            "error": f"{entity}_not_found",
            "detail": detail,
            "code": "NOT_FOUND",
        },
    )


def bad_request(error: str, detail: str = ""):
    """
    Excepción 400: Solicitud inválida.
    
    Usa cuando el cliente envía datos incorrrectos o falta validación.
    
    Args:
        error: nombre descriptivo del problema (ej: "exam_not_seeded")
        detail: descripción específica (ej: "PAES exam no inicializado")
    
    Retorna HTTPException con ErrorOut structure:
        {
            "error": "{error}",
            "detail": "{detail}",
            "code": "BAD_REQUEST"
        }
    
    Ejemplo:
        raise bad_request("invalid_choice", "choice_id no pertenece a question_id")
    """
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={
            "error": error,
            "detail": detail,
            "code": "BAD_REQUEST",
        },
    )


def internal_error(error: str, detail: str = ""):
    """
    Excepción 500: Error interno del servidor.
    
    Usa cuando hay errores en la lógica interna que el cliente no puede controlar.
    
    Args:
        error: nombre del error interno (ej: "seed_failed")
        detail: mensaje de error (ej: "Exception message")
    
    Retorna HTTPException con ErrorOut structure:
        {
            "error": "{error}",
            "detail": "{detail}",
            "code": "INTERNAL_ERROR"
        }
    
    Ejemplo:
        raise internal_error("seed_failed", "PAES exam not initialized")
    """
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail={
            "error": error,
            "detail": detail,
            "code": "INTERNAL_ERROR",
        },
    )


def conflict(entity: str, detail: str = ""):
    """
    Excepción 409: Conflicto (duplicado, constraint violation, etc).
    
    Usa cuando hay conflicto con datos existentes.
    
    Args:
        entity: nombre del recurso que genera conflicto (ej: "user", "email")
        detail: descripción del conflicto (ej: "email ya existe")
    
    Retorna HTTPException con ErrorOut structure:
        {
            "error": "{entity}_conflict",
            "detail": "{detail}",
            "code": "CONFLICT"
        }
    
    Ejemplo:
        raise conflict("user", "email ya existe en la BD")
    """
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail={
            "error": f"{entity}_conflict",
            "detail": detail,
            "code": "CONFLICT",
        },
    )

