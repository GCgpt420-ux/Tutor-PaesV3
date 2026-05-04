from pydantic_settings import BaseSettings
from pydantic import field_validator, ConfigDict, Field
from typing import List, Optional


class Settings(BaseSettings):
    # Metadatos de la aplicación
    APP_NAME: str = "TutorPAES API"
    VERSION: str = "2.0.0"
    DEBUG: bool = False

    # Configuración de base de datos
    # CRÍTICO: Debe definirse por variable de entorno (sin valor por defecto inseguro)
    DATABASE_URL: str = Field(
        default="",
        description="URL de conexión PostgreSQL (requerida en producción)"
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str):
        if not isinstance(value, str):
            return value
        url = value.strip()
        if not url:
            return url

        # En Railway/Heroku la URL puede venir como `postgres://` o `postgresql://`.
        # SQLAlchemy + psycopg v3 espera `postgresql+psycopg://`.
        if url.startswith("postgresql+psycopg://"):
            return url
        if url.startswith("postgres://"):
            return "postgresql+psycopg://" + url[len("postgres://") :]
        if url.startswith("postgresql://"):
            return "postgresql+psycopg://" + url[len("postgresql://") :]
        return url

    # Configuración CORS
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000",
        description="Orígenes CORS permitidos separados por coma"
    )
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: str = "GET,POST,PUT,DELETE,OPTIONS"
    CORS_HEADERS: str = "Content-Type,Authorization"

    # Autenticación JWT
    # CRÍTICO: Debe generarse y definirse por variable de entorno
    SECRET_KEY: str = Field(
        default="",
        description="Clave de firma JWT (generar con: openssl rand -hex 32)"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Datos demo (seed)
    DEMO_EMAIL: str = "demo@example.com"
    DEMO_PASSWORD: str = "demo123"
    PAES_CODE: str = "PAES"

    # Configuración API
    API_V1_PREFIX: str = "/api/v1"

    # Quiz
    QUIZ_TOPIC_MAX_QUESTIONS: int = 15

    # Configuración LLM - Proveedor actual (openai, groq, cerebras)
    LLM_PROVIDER: str = "openai"
    LLM_TEMPERATURE: float = 0.7
    LLM_MAX_TOKENS: int = 500
    LLM_TIMEOUT_SECONDS: int = 25
    LLM_MAX_RETRIES: int = 1
    AI_ENABLE_LLM: bool = True

    # Configuración OpenAI (proveedor: openai)
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-3.5-turbo"

    # Configuración Groq (proveedor: groq) - Modelos gratuitos con cuotas
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "mixtral-8x7b-32768"

    # Voz (STT/TTS)
    TTS_PROVIDER: str = "openai"  # "openai" o "elevenlabs"
    
    # Configuración ElevenLabs
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_VOICE_ID: str = "Xb7hH8MSUJpSbSDYk0k2"
    ELEVENLABS_MODEL_ID: str = "eleven_multilingual_v2"
    ELEVENLABS_STABILITY: float = 0.5
    ELEVENLABS_SIMILARITY_BOOST: float = 0.75
    ELEVENLABS_STYLE: float = 0.0
    ELEVENLABS_SPEED: float = 1.0
    ELEVENLABS_USE_SPEAKER_BOOST: bool = True

    # Configuración OpenAI TTS
    OPENAI_TTS_VOICE: str = "nova"  # alloy, echo, fable, onyx, nova, shimmer
    OPENAI_TTS_MODEL: str = "tts-1" # tts-1 (rápido) o tts-1-hd (alta calidad)

    # Configuración Cerebras (proveedor: cerebras) - Modelos gratuitos con cuotas
    CEREBRAS_API_KEY: str = ""
    CEREBRAS_MODEL: str = "llama-3.1-70b"

    # Inicialización de DB (solo desarrollo)
    AUTO_CREATE_TABLES: bool = False

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "app.log"
    
    # Pasarela de pagos Transbank
    TBK_COMMERCE_CODE: str = Field(
        default="",
        description="Código de comercio Transbank (requerido)"
    )
    TBK_API_KEY: str = Field(
        default="",
        description="Clave API Transbank (requerido)"
    )
    TBK_ENVIRONMENT: str = "integration"

    # Credenciales de integración/sandbox de Transbank (solo para guardrail de seguridad).
    # En producción, estas deben ser diferentes a TBK_COMMERCE_CODE y TBK_API_KEY.
    # Valores públicos del SDK de Transbank (documentación oficial).
    TBK_INTEGRATION_COMMERCE_CODE: str = Field(
        default="597055555532",
        description="Código de comercio de sandbox Transbank (valor público de SDK)"
    )
    TBK_INTEGRATION_API_KEY: str = Field(
        default="<TRANSBANK_INTEGRATION_API_KEY>",
        description="API key de sandbox Transbank (valor público de SDK)"
    )
    
    # URL de retorno de pago
    PAYMENT_RETURN_URL: Optional[str] = Field(
        default=None,
        description="URL de redirección para confirmación de pago Transbank"
    )

    # URL pública del frontend (para enlaces transaccionales como reset de contraseña)
    FRONTEND_BASE_URL: str = Field(
        default="http://localhost:3000",
        description="URL base del frontend para construir enlaces de usuario"
    )

    # Configuración de Correo (SMTP)
    SMTP_HOST: Optional[str] = Field(default=None, description="Host del servidor SMTP (ej: smtp.sendgrid.net)")
    SMTP_PORT: int = Field(default=587, description="Puerto SMTP (usualmente 587 para TLS)")
    SMTP_USER: Optional[str] = Field(default=None, description="Usuario SMTP")
    SMTP_PASSWORD: Optional[str] = Field(default=None, description="Contraseña SMTP")
    SMTP_FROM_EMAIL: str = Field(default="noreply@tutorpaes.cl", description="Correo remitente por defecto")

    # Opcional: seguimiento de errores con Sentry
    SENTRY_DSN: Optional[str] = Field(
        default=None,
        description="DSN de Sentry para seguimiento de errores"
    )
    SENTRY_TRACES_SAMPLE_RATE: float = Field(
        default=0.1,
        description="Porcentaje de requests a trazar en Sentry (0.0 a 1.0)"
    )
    SENTRY_PROFILES_SAMPLE_RATE: float = Field(
        default=0.1,
        description="Porcentaje de perfiles de rendimiento para Sentry (0.0 a 1.0)"
    )

    # Connection pool (tune per number of Gunicorn/Uvicorn workers)
    DB_POOL_SIZE: int = Field(
        default=10,
        description="Conexiones base del pool por worker (recomendado: max_pg_connections / num_workers)"
    )
    DB_POOL_MAX_OVERFLOW: int = Field(
        default=20,
        description="Conexiones extra permitidas sobre pool_size (burst)"
    )

    # Opcional: caché Redis
    REDIS_URL: Optional[str] = Field(
        default=None,
        description="URL de Redis para caché y rate limiting"
    )

    # Detección de entorno
    ENVIRONMENT: str = "development"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if value is None or value == "":
            return "http://localhost:3000"
        return str(value)

    @field_validator("SECRET_KEY", mode="before")
    @classmethod
    def validate_secret_key(cls, value: str):
        """Asegura que SECRET_KEY esté configurada de forma segura para producción."""
        if not value or value == "change-me-in-production-use-openssl-rand-hex-32":
            import warnings
            warnings.warn(
                "  ADVERTENCIA: SECRET_KEY no está configurada correctamente. "
                "Para producción, define SECRET_KEY por variable de entorno: "
                "openssl rand -hex 32",
                UserWarning
            )
        return value

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    def validate_runtime_requirements(self) -> None:
        missing_fields = []

        if not self.DATABASE_URL:
            missing_fields.append("DATABASE_URL")

        if not self.SECRET_KEY:
            missing_fields.append("SECRET_KEY")

        if missing_fields:
            joined_fields = ", ".join(missing_fields)
            raise RuntimeError(
                f"Configuración crítica incompleta. Define estas variables de entorno: {joined_fields}"
            )

        # Guardrail crítico: evita mezclar credenciales de integración en producción.
        env = (self.ENVIRONMENT or "").strip().lower()
        tbk_env = (self.TBK_ENVIRONMENT or "").strip().lower()

        if env == "production":
            if tbk_env != "production":
                raise RuntimeError(
                    "Configuración insegura: ENVIRONMENT=production requiere TBK_ENVIRONMENT=production."
                )

            if (
                self.TBK_COMMERCE_CODE == self.TBK_INTEGRATION_COMMERCE_CODE
                or self.TBK_API_KEY == self.TBK_INTEGRATION_API_KEY
            ):
                raise RuntimeError(
                    "Configuración insegura: se detectaron credenciales Transbank de integración en producción."
                )


settings = Settings()
