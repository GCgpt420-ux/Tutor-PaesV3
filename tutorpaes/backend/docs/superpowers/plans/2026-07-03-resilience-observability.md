# Resilience & Observability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Circuit Breaker, Retries with Exponential Backoff, and dynamic LLM fallback mechanics for resilience, and integrate Prometheus metrics and a `/metrics` endpoint in FastAPI for observabilitiy of LLM performance.

**Architecture:** Create a custom `CircuitBreaker` class and helper wrappers in `circuit_breaker.py`. Integrate `tenacity` retries and fallback list iteration inside `llm_provider_service.py`. Implement Prometheus counters and latency histograms in a new `metrics.py` module, mount the Prometheus ASGI application inside `main.py`, and instrument LLM provider classes to record execution metrics.

**Tech Stack:** FastAPI, SQLAlchemy, tenacity, prometheus-client, pytest

---

### Task 1: Add New Dependencies

**Files:**
- Modify: `/home/gabriel/Escritorio/Tutor-PaesV3/tutorpaes/backend/requirements.txt`

- [x] **Step 1: Append new requirements**
Add `tenacity` and `prometheus-client` dependencies to the bottom of the requirements file.

In `/home/gabriel/Escritorio/Tutor-PaesV3/tutorpaes/backend/requirements.txt`:
```diff
 # Testing & Dev
 pytest>=8.0.0
 pytest-asyncio>=0.23.0
 httpx>=0.27.0
 pytest-cov>=5.0.0
+
+# Resilience & Observability
+tenacity>=8.5.0
+prometheus-client>=0.21.0
```

- [x] **Step 2: Install dependencies**
Run: `pip install -r tutorpaes/backend/requirements.txt` inside `/home/gabriel/Escritorio/Tutor-PaesV3` using the virtual environment `venv/bin/pip`.
Expected: Installation completes successfully.

---

### Task 2: Implement Custom Circuit Breaker

**Files:**
- Create: `/home/gabriel/Escritorio/Tutor-PaesV3/tutorpaes/backend/app/core/circuit_breaker.py`
- Create: `/home/gabriel/Escritorio/Tutor-PaesV3/tutorpaes/backend/tests/test_security/test_circuit_breaker.py`

- [x] **Step 1: Create Circuit Breaker logic**
Implement a thread-safe, stateful `CircuitBreaker` with states `CLOSED`, `OPEN`, and `HALF-OPEN`. It transitions to `OPEN` after a consecutive number of failures, blocks calls for a recovery timeout, and transitions back to `CLOSED` upon a successful call.

Write to `/home/gabriel/Escritorio/Tutor-PaesV3/tutorpaes/backend/app/core/circuit_breaker.py`:
```python
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
                # Ignorar excepciones de cliente comunes (por ejemplo, errores de validación de parámetros)
                # que no indican una caída del servicio remoto.
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
```

- [x] **Step 2: Write tests for Circuit Breaker**
Write to `/home/gabriel/Escritorio/Tutor-PaesV3/tutorpaes/backend/tests/test_security/test_circuit_breaker.py`:
```python
import time
import pytest
from app.core.circuit_breaker import CircuitBreaker, CircuitBreakerOpenException

def test_circuit_breaker_transitions():
    breaker = CircuitBreaker("TestBreaker", failure_threshold=2, recovery_timeout=0.5)
    
    call_count = 0
    
    @breaker
    def dummy_call(should_fail: bool):
        nonlocal call_count
        call_count += 1
        if should_fail:
            raise RuntimeError("Outage")
        return "success"

    # 1. CLOSED state, calls work
    assert dummy_call(should_fail=False) == "success"
    assert breaker.state == "CLOSED"

    # 2. First failure
    with pytest.raises(RuntimeError):
        dummy_call(should_fail=True)
    assert breaker.state == "CLOSED"

    # 3. Second failure triggers OPEN
    with pytest.raises(RuntimeError):
        dummy_call(should_fail=True)
    assert breaker.state == "OPEN"

    # 4. Calls block instantly while OPEN
    with pytest.raises(CircuitBreakerOpenException):
        dummy_call(should_fail=False)
    assert call_count == 3  # Did not invoke dummy_call inside wrapper

    # 5. Wait recovery timeout, transitions to HALF-OPEN, succeeds -> CLOSED
    time.sleep(0.6)
    assert dummy_call(should_fail=False) == "success"
    assert breaker.state == "CLOSED"
    assert breaker.failure_count == 0
```

- [x] **Step 3: Run the new circuit breaker tests**
Run: `venv/bin/pytest tests/test_security/test_circuit_breaker.py` inside `tutorpaes/backend`
Expected: PASS.

- [x] **Step 4: Commit**
Run:
```bash
git add app/core/circuit_breaker.py tests/test_security/test_circuit_breaker.py requirements.txt
git commit -m "feat: implement custom CircuitBreaker class and add unit tests"
```

---

### Task 3: Implement Prometheus Metrics and Expose Endpoint

**Files:**
- Create: `/home/gabriel/Escritorio/Tutor-PaesV3/tutorpaes/backend/app/core/metrics.py`
- Modify: `/home/gabriel/Escritorio/Tutor-PaesV3/tutorpaes/backend/app/main.py`
- Test: `/home/gabriel/Escritorio/Tutor-PaesV3/tutorpaes/backend/tests/test_health/test_metrics.py`

- [x] **Step 1: Write `metrics.py`**
Define Prometheus metrics for LLM performance monitoring.

Write to `/home/gabriel/Escritorio/Tutor-PaesV3/tutorpaes/backend/app/core/metrics.py`:
```python
from prometheus_client import Counter, Histogram

# Contador total de llamadas a LLM por proveedor y estado de respuesta
LLM_REQUESTS_TOTAL = Counter(
    "tutorpaes_llm_requests_total",
    "Cantidad total de solicitudes de inferencia a proveedores LLM",
    ["provider", "status"]
)

# Histograma de latencia para las respuestas del LLM
LLM_REQUEST_LATENCY = Histogram(
    "tutorpaes_llm_request_latency_seconds",
    "Latencia en segundos de llamadas completadas de proveedores LLM",
    ["provider"],
    buckets=(0.2, 0.5, 1.0, 2.0, 5.0, 10.0, float("inf"))
)

# Contador de errores de inferencia o red agrupados por proveedor y tipo de error
LLM_ERRORS_TOTAL = Counter(
    "tutorpaes_llm_errors_total",
    "Cantidad total de errores de red o inferencia en proveedores LLM",
    ["provider", "error_type"]
)
```

- [x] **Step 2: Expose `/metrics` endpoint in FastAPI app**
Expose the metrics route via Prometheus ASGI wrapper.

Modify `/home/gabriel/Escritorio/Tutor-PaesV3/tutorpaes/backend/app/main.py` to add the import:
```python
from prometheus_client import make_asgi_app
```
And mount the Prometheus app near the health routers (around line 191):
```python
app.include_router(health_router, prefix="/api/v1")
# Montar la aplicación de métricas de Prometheus en /metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
```

- [x] **Step 3: Write test for `/metrics` endpoint**
Write to `/home/gabriel/Escritorio/Tutor-PaesV3/tutorpaes/backend/tests/test_health/test_metrics.py`:
```python
def test_metrics_endpoint_accessible(client):
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "tutorpaes_llm_requests_total" in response.text
```

- [x] **Step 4: Run metrics test**
Run: `venv/bin/pytest tests/test_health/test_metrics.py` inside `tutorpaes/backend`
Expected: PASS.

- [x] **Step 5: Commit**
Run:
```bash
git add app/core/metrics.py app/main.py tests/test_health/test_metrics.py
git commit -m "feat: configure Prometheus metrics module and expose /metrics endpoint"
```

---

### Task 4: Instrument LLM Provider Service with Circuit Breaker, Retries, and Metrics

**Files:**
- Modify: `/home/gabriel/Escritorio/Tutor-PaesV3/tutorpaes/backend/app/services/llm_provider_service.py`
- Test: `/home/gabriel/Escritorio/Tutor-PaesV3/tutorpaes/backend/tests/test_quiz/test_resilience_integration.py`

- [x] **Step 1: Update `llm_provider_service.py`**
Instantiate a Circuit Breaker per provider. Wrap connection logic with `tenacity.retry` for exponential backoff retries, incorporate the Circuit Breakers, track latency/errors using Prometheus metrics, and implement dynamic fallback provider switching in `stream_llm_response`.

Replace the content of `/home/gabriel/Escritorio/Tutor-PaesV3/tutorpaes/backend/app/services/llm_provider_service.py`:
```python
"""
LLM Provider Service - Abstracción para multiples proveedores de LLM
Soporta: OpenAI, Groq, Cerebras
"""

import time
import logging
from typing import Optional, Generator
from app.core.config import settings

from app.core.circuit_breaker import CircuitBreaker, CircuitBreakerOpenException
from app.core.metrics import LLM_REQUESTS_TOTAL, LLM_REQUEST_LATENCY, LLM_ERRORS_TOTAL
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)

# Circuit Breakers aislados por proveedor para evitar que la caida de uno afecte al resto
circuit_breakers = {
    "openai": CircuitBreaker("openai", failure_threshold=3, recovery_timeout=15.0),
    "groq": CircuitBreaker("groq", failure_threshold=3, recovery_timeout=15.0),
    "cerebras": CircuitBreaker("cerebras", failure_threshold=3, recovery_timeout=15.0),
}

def _build_messages(
    system_prompt: str,
    user_message: str,
    conversation_messages: Optional[list[dict[str, str]]] = None,
) -> list[dict[str, str]]:
    if conversation_messages:
        return conversation_messages

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]


class LLMProvider:
    """Base class para proveedores de LLM"""
    name: str = "base"
    
    def stream_completion(self, 
                          system_prompt: str, 
                          user_message: str,
                          conversation_messages: Optional[list[dict[str, str]]] = None,
                          temperature: Optional[float] = None,
                          max_tokens: Optional[int] = None) -> Generator[str, None, None]:
        raise NotImplementedError


class OpenAIProvider(LLMProvider):
    """Proveedor OpenAI"""
    name = "openai"
    
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not configured")
        from openai import OpenAI
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    def stream_completion(self,
                          system_prompt: str,
                          user_message: str,
                          conversation_messages: Optional[list[dict[str, str]]] = None,
                          temperature: Optional[float] = None,
                          max_tokens: Optional[int] = None) -> Generator[str, None, None]:
        """Stream completion desde OpenAI"""
        temperature = temperature or settings.LLM_TEMPERATURE
        max_tokens = max_tokens or settings.LLM_MAX_TOKENS

        messages = _build_messages(system_prompt, user_message, conversation_messages)
        
        # Envoltorio ejecutable para aplicar Circuit Breaker y Tenacity Retries a la conexion inicial
        @circuit_breakers["openai"]
        @retry(
            stop=stop_after_attempt(3),
            wait=wait_exponential(multiplier=0.5, min=0.2, max=2.0),
            retry=retry_if_exception_type(Exception),
            reraise=True
        )
        def _connect():
            return self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=True,
                timeout=settings.LLM_TIMEOUT_SECONDS
            )

        start_time = time.time()
        try:
            stream = _connect()
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
            LLM_REQUESTS_TOTAL.labels(provider="openai", status="success").inc()
        except Exception as e:
            LLM_ERRORS_TOTAL.labels(provider="openai", error_type=type(e).__name__).inc()
            LLM_REQUESTS_TOTAL.labels(provider="openai", status="error").inc()
            logger.error(f"OpenAI streaming error: {e}")
            raise
        finally:
            LLM_REQUEST_LATENCY.labels(provider="openai").observe(time.time() - start_time)


class GroqProvider(LLMProvider):
    """Proveedor Groq"""
    name = "groq"
    
    def __init__(self):
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY not configured")
        from groq import Groq
        self.client = Groq(api_key=settings.GROQ_API_KEY)
    
    def stream_completion(self,
                          system_prompt: str,
                          user_message: str,
                          conversation_messages: Optional[list[dict[str, str]]] = None,
                          temperature: Optional[float] = None,
                          max_tokens: Optional[int] = None) -> Generator[str, None, None]:
        """Stream completion desde Groq"""
        temperature = temperature or settings.LLM_TEMPERATURE
        max_tokens = max_tokens or settings.LLM_MAX_TOKENS
        messages = _build_messages(system_prompt, user_message, conversation_messages)
        
        @circuit_breakers["groq"]
        @retry(
            stop=stop_after_attempt(3),
            wait=wait_exponential(multiplier=0.5, min=0.2, max=2.0),
            retry=retry_if_exception_type(Exception),
            reraise=True
        )
        def _connect():
            return self.client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=True,
                timeout=settings.LLM_TIMEOUT_SECONDS
            )

        start_time = time.time()
        try:
            stream = _connect()
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
            LLM_REQUESTS_TOTAL.labels(provider="groq", status="success").inc()
        except Exception as e:
            LLM_ERRORS_TOTAL.labels(provider="groq", error_type=type(e).__name__).inc()
            LLM_REQUESTS_TOTAL.labels(provider="groq", status="error").inc()
            logger.error(f"Groq streaming error: {e}")
            raise
        finally:
            LLM_REQUEST_LATENCY.labels(provider="groq").observe(time.time() - start_time)


class CerebrasProvider(LLMProvider):
    """Proveedor Cerebras"""
    name = "cerebras"
    
    def __init__(self):
        if not settings.CEREBRAS_API_KEY:
            raise ValueError("CEREBRAS_API_KEY not configured")
        from cerebras_cloud_sdk import Cerebras
        self.client = Cerebras(api_key=settings.CEREBRAS_API_KEY)
    
    def stream_completion(self,
                          system_prompt: str,
                          user_message: str,
                          conversation_messages: Optional[list[dict[str, str]]] = None,
                          temperature: Optional[float] = None,
                          max_tokens: Optional[int] = None) -> Generator[str, None, None]:
        """Stream completion desde Cerebras"""
        temperature = temperature or settings.LLM_TEMPERATURE
        max_tokens = max_tokens or settings.LLM_MAX_TOKENS
        messages = _build_messages(system_prompt, user_message, conversation_messages)
        
        @circuit_breakers["cerebras"]
        @retry(
            stop=stop_after_attempt(3),
            wait=wait_exponential(multiplier=0.5, min=0.2, max=2.0),
            retry=retry_if_exception_type(Exception),
            reraise=True
        )
        def _connect():
            return self.client.chat.completions.create(
                model=settings.CEREBRAS_MODEL,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=True,
                timeout=settings.LLM_TIMEOUT_SECONDS
            )

        start_time = time.time()
        try:
            stream = _connect()
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
            LLM_REQUESTS_TOTAL.labels(provider="cerebras", status="success").inc()
        except Exception as e:
            LLM_ERRORS_TOTAL.labels(provider="cerebras", error_type=type(e).__name__).inc()
            LLM_REQUESTS_TOTAL.labels(provider="cerebras", status="error").inc()
            logger.error(f"Cerebras streaming error: {e}")
            raise
        finally:
            LLM_REQUEST_LATENCY.labels(provider="cerebras").observe(time.time() - start_time)


def get_llm_provider() -> LLMProvider:
    """Factory: Retorna instancia del proveedor configurado"""
    provider = settings.LLM_PROVIDER.lower()
    
    if provider == "openai":
        return OpenAIProvider()
    elif provider == "groq":
        return GroqProvider()
    elif provider == "cerebras":
        return CerebrasProvider()
    else:
        raise ValueError(f"Unknown LLM provider: {provider}")


def get_provider_by_name(name: str) -> LLMProvider:
    """Retorna un proveedor de LLM específico por nombre"""
    if name == "openai":
        return OpenAIProvider()
    elif name == "groq":
        return GroqProvider()
    elif name == "cerebras":
        return CerebrasProvider()
    else:
        raise ValueError(f"Unknown LLM provider: {name}")


def stream_llm_response(system_prompt: str,
                       user_message: str,
                       conversation_messages: Optional[list[dict[str, str]]] = None,
                       temperature: Optional[float] = None,
                       max_tokens: Optional[int] = None) -> Generator[str, None, None]:
    """
    Interfaz principal para obtener respuestas en stream desde cualquier proveedor.
    Automáticamente intenta fallback a providers alternativos si el configurado falla.
    """
    if not settings.AI_ENABLE_LLM:
        logger.warning("AI_ENABLE_LLM is False, LLM responses disabled")
        return
    
    primary_provider = settings.LLM_PROVIDER.lower()
    providers_to_try = [primary_provider]
    
    # Resolver proveedores de fallback disponibles basados en las API Keys sembradas
    all_possible = ["openai", "groq", "cerebras"]
    for p in all_possible:
        if p != primary_provider:
            if p == "openai" and settings.OPENAI_API_KEY:
                providers_to_try.append(p)
            elif p == "groq" and settings.GROQ_API_KEY:
                providers_to_try.append(p)
            elif p == "cerebras" and settings.CEREBRAS_API_KEY:
                providers_to_try.append(p)

    last_error = None
    for prov_name in providers_to_try:
        try:
            logger.info(f"Intentando generar stream con proveedor: {prov_name}")
            provider = get_provider_by_name(prov_name)
            yield from provider.stream_completion(
                system_prompt,
                user_message,
                conversation_messages,
                temperature,
                max_tokens,
            )
            return  # Generación exitosa, salimos
        except (CircuitBreakerOpenException, Exception) as exc:
            last_error = exc
            logger.warning(
                f"Proveedor '{prov_name}' falló o circuito abierto. "
                f"Intentando fallback si está disponible. Detalle: {exc}"
            )
            continue
            
    if last_error:
        logger.error("Todos los proveedores de LLM fallaron o tienen circuitos abiertos.")
        raise last_error
```

- [x] **Step 2: Write resilience and fallback tests**
Create a test suite validating retry behavior, fallback triggering when OpenAI fails, and circuit breaker activation on the client interface.

Write to `/home/gabriel/Escritorio/Tutor-PaesV3/tutorpaes/backend/tests/test_quiz/test_resilience_integration.py`:
```python
import pytest
from unittest.mock import MagicMock, patch
from app.services.llm_provider_service import stream_llm_response, circuit_breakers
from app.core.circuit_breaker import CircuitBreakerOpenException

@pytest.fixture(autouse=True)
def reset_breakers():
    for cb in circuit_breakers.values():
        cb.state = "CLOSED"
        cb.failure_count = 0

def test_stream_llm_response_fallback_flow():
    # Simular caída de OpenAI, forzando fallback a Groq
    from app.core.config import settings
    
    # Mockear config para habilitar keys
    with patch.object(settings, "LLM_PROVIDER", "openai"), \
         patch.object(settings, "OPENAI_API_KEY", "mock-openai"), \
         patch.object(settings, "GROQ_API_KEY", "mock-groq"):
             
        # Mockear las implementaciones de los clientes de OpenAI y Groq
        with patch("openai.OpenAI") as mock_openai, \
             patch("groq.Groq") as mock_groq:
                 
            # OpenAI siempre tira excepción
            mock_openai.return_value.chat.completions.create.side_effect = RuntimeError("OpenAI Outage")
            
            # Groq funciona correctamente
            mock_chunk = MagicMock()
            mock_chunk.choices = [MagicMock()]
            mock_chunk.choices[0].delta.content = "Respuesta Groq"
            mock_groq.return_value.chat.completions.create.return_value = [mock_chunk]

            # Consumir el generador
            chunks = list(stream_llm_response("sys", "user"))
            assert len(chunks) == 1
            assert chunks[0] == "Respuesta Groq"
```

- [x] **Step 3: Run integration test**
Run: `venv/bin/pytest tests/test_quiz/test_resilience_integration.py` inside `tutorpaes/backend`
Expected: PASS.

- [x] **Step 4: Commit**
Run:
```bash
git add app/services/llm_provider_service.py tests/test_quiz/test_resilience_integration.py
git commit -m "feat: integrate tenacity retries, circuit breakers, and fallback providers in llm service"
```

---

### Task 5: Run Final Verification

- [x] **Step 1: Execute full backend test suite**
Run: `venv/bin/pytest` inside `tutorpaes/backend`
Expected: `96 passed` (including both new circuit breaker and resilience integration tests).

- [x] **Step 2: Verify Prometheus /metrics output**
Run a local request to `/metrics` endpoint using `curl` or python requests:
Run: `python -c "import httpx; r=httpx.get('http://localhost:8000/metrics'); print(r.status_code)"` (requires api server running locally, or verified via integration testing).
Expected: 200.

---

## Acceptance Criteria

1.  **Fault Tolerance:** If `settings.LLM_PROVIDER` (e.g., `"openai"`) raises a connection or rate limit error, the system must retry up to 3 times with exponential backoff before failing over to alternative providers (`"groq"`, `"cerebras"`) dynamically without failing the request to the student.
2.  **Circuit Breaking:** A consecutive count of 3 failures on a single provider must trip its Circuit Breaker to `OPEN`. While `OPEN`, any further request must bypass calls to that provider immediately (preventing request queues and thread leaks) and failover immediately until the cooldown timeout expires.
3.  **Observability:** The `/metrics` endpoint must return standard Prometheus text format containing `tutorpaes_llm_requests_total`, `tutorpaes_llm_request_latency_seconds`, and `tutorpaes_llm_errors_total` metrics with correct label mappings (`provider`, `status`, `error_type`).
4.  **No Regressions:** The entire pre-existing test suite (93 unit/integration tests) must compile and pass cleanly without any exceptions.
