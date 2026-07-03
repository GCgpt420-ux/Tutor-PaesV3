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
