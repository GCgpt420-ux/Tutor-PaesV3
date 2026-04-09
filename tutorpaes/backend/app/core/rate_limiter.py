from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings


def _build_limiter() -> Limiter:
    """
    Crea el limiter con backend Redis si REDIS_URL está configurado.
    Sin Redis, usa memoria local — SOLO válido para instancia única (dev/test).
    En producción multi-worker, Redis es obligatorio para que los límites sean globales.
    """
    if settings.REDIS_URL:
        return Limiter(
            key_func=get_remote_address,
            headers_enabled=True,
            storage_uri=settings.REDIS_URL,
        )

    import warnings
    if settings.ENVIRONMENT == "production":
        warnings.warn(
            "REDIS_URL no está configurado. El rate limiting opera en memoria local "
            "y NO es efectivo en despliegues multi-worker. Configura REDIS_URL.",
            RuntimeWarning,
        )
    return Limiter(key_func=get_remote_address, headers_enabled=False)


limiter = _build_limiter()
