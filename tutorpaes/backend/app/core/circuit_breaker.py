import time
import logging
from typing import Callable, Any

logger = logging.getLogger(__name__)

class CircuitBreakerOpenException(Exception):
    """Lanzada cuando el circuito está abierto y bloquea solicitudes."""
    pass

class CircuitBreaker:
    def __init__(self, name: str, failure_threshold: int = 3, recovery_timeout: float = 10.0):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = "CLOSED"  # CLOSED, OPEN, HALF-OPEN
        self.failure_count = 0
        self.last_state_change = time.time()

    def __call__(self, func: Callable[..., Any]) -> Callable[..., Any]:
        def wrapper(*args, **kwargs):
            now = time.time()
            if self.state == "OPEN":
                if now - self.last_state_change > self.recovery_timeout:
                    self.state = "HALF-OPEN"
                    self.last_state_change = now
                    logger.warning(f"Circuit Breaker '{self.name}' transicionado a HALF-OPEN")
                else:
                    logger.error(f"Circuit Breaker '{self.name}' está abierto. Solicitud rechazada.")
                    raise CircuitBreakerOpenException(
                        f"Circuit Breaker '{self.name}' está abierto. Intenta más tarde."
                    )

            try:
                result = func(*args, **kwargs)
                if self.state == "HALF-OPEN":
                    self.state = "CLOSED"
                    self.failure_count = 0
                    self.last_state_change = now
                    logger.info(f"Circuit Breaker '{self.name}' transicionado a CLOSED (Recuperación exitosa)")
                return result
            except Exception as e:
                # Ignorar excepciones de cliente comunes
                if isinstance(e, (ValueError, KeyError, TypeError)):
                    raise e
                
                self.failure_count += 1
                if self.failure_count >= self.failure_threshold:
                    self.state = "OPEN"
                    self.last_state_change = now
                    logger.error(
                        f"Circuit Breaker '{self.name}' transicionado a OPEN. "
                        f"Umbral de fallas superado ({self.failure_count}). Error: {e}"
                    )
                raise e
        return wrapper
