from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from slowapi.errors import RateLimitExceeded

from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.ai import router as ai_router
from app.api.v1.endpoints.ai_chat import router as ai_chat_router
from app.api.v1.endpoints.catalog import router as catalog_router
from app.api.v1.endpoints.quiz import router as quiz_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.questions import router as questions_router
from app.api.v1.endpoints.payments import router as payments_router
from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.voice import router as voice_router
from app.core.config import settings
from app.core.rate_limiter import limiter
from app.core.request_context import get_request_id, reset_request_id, set_request_id
from app.core.logging_config import setup_logging
from app.core.auth import cleanup_expired_revoked_tokens
from app.db.base import Base
from app.db.session import engine, SessionLocal

settings.validate_runtime_requirements()

logger = setup_logging()
logger.info("Starting TutorPAES API...")

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        integrations=[FastApiIntegration(), SqlalchemyIntegration()],
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        profiles_sample_rate=settings.SENTRY_PROFILES_SAMPLE_RATE,
    )


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        if settings.AUTO_CREATE_TABLES:
            logger.warning("AUTO_CREATE_TABLES enabled: running Base.metadata.create_all()")
            Base.metadata.create_all(bind=engine)
        else:
            logger.info("AUTO_CREATE_TABLES disabled: relying on Alembic migrations")
    except Exception:
        logger.exception("Database not ready during startup")
        raise

    # Limpiar tokens revocados expirados al arrancar. Mantiene la tabla pequeña
    # sin necesitar un scheduler externo. Si la DB no está lista, se loguea y continúa.
    try:
        with SessionLocal() as db:
            deleted = cleanup_expired_revoked_tokens(db)
            if deleted:
                logger.info("Startup cleanup: %s expired revoked tokens deleted", deleted)
    except Exception:
        logger.warning("Could not cleanup expired revoked tokens at startup (non-fatal)")

    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",")],
    allow_credentials=settings.CORS_CREDENTIALS,
    allow_methods=[method.strip() for method in settings.CORS_METHODS.split(",")],
    allow_headers=[header.strip() for header in settings.CORS_HEADERS.split(",")],
)

app.state.limiter = limiter


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Agrega HTTP security headers a todas las respuestas."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    return response


@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid4())
    request.state.request_id = request_id
    token = set_request_id(request_id)
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Error no controlado en middleware")
        response = JSONResponse(
            status_code=500,
            content={
                "error": "internal_server_error",
                "detail": "Error interno del servidor",
                "request_id": get_request_id(),
            },
        )
    finally:
        reset_request_id(token)

    response.headers["X-Request-ID"] = request_id
    return response


@app.exception_handler(RateLimitExceeded)
async def rate_limit_exception_handler(_request: Request, _exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "detail": "Demasiadas solicitudes. Intenta nuevamente en unos minutos.",
            "request_id": get_request_id(),
        },
    )


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(_request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "detail": "Solicitud inválida",
            "issues": [
                {
                    "loc": list(err.get("loc", [])),
                    "msg": str(err.get("msg", "Valor inválido")),
                    "type": str(err.get("type", "validation_error")),
                }
                for err in exc.errors()
            ],
            "request_id": get_request_id(),
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    is_server_error = exc.status_code >= 500
    if is_server_error:
        detail = "Error interno del servidor"
    else:
        detail = exc.detail

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "server_error" if is_server_error else "request_error",
            "detail": detail,
            "request_id": get_request_id(),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    logger.exception("Error no controlado en la API")
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "detail": "Error interno del servidor",
            "request_id": get_request_id(),
        },
    )

app.include_router(health_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")
app.include_router(catalog_router, prefix="/api/v1")
app.include_router(quiz_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(questions_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(ai_chat_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(voice_router, prefix="/api/v1")