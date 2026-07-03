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
