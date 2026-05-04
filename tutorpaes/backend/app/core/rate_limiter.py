from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.validators import validate_redis_in_production


def _build_limiter() -> Limiter:
    """
    Create rate limiter with Redis backend (required for production).
    
    Production: REQUIRES Redis for distributed rate limiting across workers.
                Raises RuntimeError if REDIS_URL not configured.
    Staging: REQUIRES Redis for consistent limits across instances.
    Development: Optional - uses in-memory backend if Redis unavailable.
    """
    # Enforce Redis in production/staging
    if settings.ENVIRONMENT in ("production", "staging"):
        validate_redis_in_production(settings.REDIS_URL, settings.ENVIRONMENT)
        return Limiter(
            key_func=get_remote_address,
            headers_enabled=True,
            storage_uri=settings.REDIS_URL,
        )
    
    # Development: optional Redis with fallback warning
    if settings.REDIS_URL:
        return Limiter(
            key_func=get_remote_address,
            headers_enabled=True,
            storage_uri=settings.REDIS_URL,
        )
    
    print(
        "⚠️  WARNING: Rate limiter in-memory mode (development). "
        "Single worker only. Use REDIS_URL for production deployments."
    )
    return Limiter(key_func=get_remote_address, headers_enabled=False)


limiter = _build_limiter()
