"""
LLM Provider Service - Abstracción para multiples proveedores de LLM
Soporta: OpenAI, Groq, Cerebras
"""

import logging
from typing import Optional, Generator
from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMProvider:
    """Base class para proveedores de LLM"""
    
    def stream_completion(self, 
                         system_prompt: str, 
                         user_message: str,
                         temperature: Optional[float] = None,
                         max_tokens: Optional[int] = None) -> Generator[str, None, None]:
        raise NotImplementedError


class OpenAIProvider(LLMProvider):
    """Proveedor OpenAI"""
    
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not configured")
        from openai import OpenAI
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    def stream_completion(self,
                         system_prompt: str,
                         user_message: str,
                         temperature: Optional[float] = None,
                         max_tokens: Optional[int] = None) -> Generator[str, None, None]:
        """Stream completion desde OpenAI"""
        try:
            temperature = temperature or settings.LLM_TEMPERATURE
            max_tokens = max_tokens or settings.LLM_MAX_TOKENS
            
            with self.client.messages.stream(
                model=settings.OPENAI_MODEL,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
                timeout=settings.LLM_TIMEOUT_SECONDS
            ) as stream:
                for text in stream.text_stream:
                    yield text
        except Exception as e:
            logger.error(f"OpenAI streaming error: {e}")
            raise


class GroqProvider(LLMProvider):
    """Proveedor Groq - Modelos de código abierto rápidos y eficientes"""
    
    def __init__(self):
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY not configured")
        try:
            from groq import Groq
        except ImportError:
            raise ImportError("groq library not installed. Run: pip install groq")
        
        self.client = Groq(api_key=settings.GROQ_API_KEY)
    
    def stream_completion(self,
                         system_prompt: str,
                         user_message: str,
                         temperature: Optional[float] = None,
                         max_tokens: Optional[int] = None) -> Generator[str, None, None]:
        """Stream completion desde Groq"""
        try:
            temperature = temperature or settings.LLM_TEMPERATURE
            max_tokens = max_tokens or settings.LLM_MAX_TOKENS
            
            stream = self.client.chat.completions.create(
                model=settings.GROQ_MODEL,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
                stream=True,
                timeout=settings.LLM_TIMEOUT_SECONDS
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"Groq streaming error: {e}")
            raise


class CerebrasProvider(LLMProvider):
    """Proveedor Cerebras - Llama 3.1 con inferencia ultra-rápida"""
    
    def __init__(self):
        if not settings.CEREBRAS_API_KEY:
            raise ValueError("CEREBRAS_API_KEY not configured")
        try:
            from cerebras_cloud_sdk import Cerebras
        except ImportError:
            raise ImportError("cerebras-cloud-sdk library not installed. Run: pip install cerebras-cloud-sdk")
        
        self.client = Cerebras(api_key=settings.CEREBRAS_API_KEY)
    
    def stream_completion(self,
                         system_prompt: str,
                         user_message: str,
                         temperature: Optional[float] = None,
                         max_tokens: Optional[int] = None) -> Generator[str, None, None]:
        """Stream completion desde Cerebras"""
        try:
            temperature = temperature or settings.LLM_TEMPERATURE
            max_tokens = max_tokens or settings.LLM_MAX_TOKENS
            
            stream = self.client.chat.completions.create(
                model=settings.CEREBRAS_MODEL,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
                stream=True,
                timeout=settings.LLM_TIMEOUT_SECONDS
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"Cerebras streaming error: {e}")
            raise


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


def stream_llm_response(system_prompt: str,
                       user_message: str,
                       temperature: Optional[float] = None,
                       max_tokens: Optional[int] = None) -> Generator[str, None, None]:
    """
    Interfaz principal para obtener respuestas en stream desde cualquier proveedor.
    Automáticamente intenta fallback a providers alternativos si uno falla.
    """
    if not settings.AI_ENABLE_LLM:
        logger.warning("AI_ENABLE_LLM is False, LLM responses disabled")
        return
    
    try:
        provider = get_llm_provider()
        yield from provider.stream_completion(system_prompt, user_message, temperature, max_tokens)
    except Exception as e:
        logger.error(f"LLM streaming failed with {settings.LLM_PROVIDER}: {e}")
        # Aquí podrías implementar fallback a otro provider si quieres
        raise
