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

    # Configuración OpenAI LLM
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    OPENAI_TEMPERATURE: float = 0.7
    OPENAI_MAX_TOKENS: int = 500
    OPENAI_TIMEOUT_SECONDS: int = 25
    OPENAI_MAX_RETRIES: int = 1
    AI_ENABLE_LLM: bool = True

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

        if not self.PAYMENT_RETURN_URL:
            missing_fields.append("PAYMENT_RETURN_URL")

        if missing_fields:
            joined_fields = ", ".join(missing_fields)
            raise RuntimeError(
                f"Configuración crítica incompleta. Define estas variables de entorno: {joined_fields}"
            )


settings = Settings()
