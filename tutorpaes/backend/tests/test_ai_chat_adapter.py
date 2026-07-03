import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.db.models import User
from app.core.auth import get_current_user

# Mock database user
@pytest.fixture
def test_user():
    return User(id=1, email="alumno@tutorpaes.cl", name="Estudiante", role="student", academic_level="4to medio")

@pytest.fixture
def auth_override(test_user):
    app.dependency_overrides[get_current_user] = lambda: test_user
    yield
    app.dependency_overrides = {}

def test_ai_chat_stream_returns_sse_payload(auth_override):
    """
    Valida que el endpoint /api/v1/ai/chat entregue respuesta SSE
    y delegue el contenido al generador pedagógico.
    """
    client = TestClient(app)

    def dummy_generator(*args, **kwargs):
        yield "data: Excelente pregunta socrática.\n\n"
        yield "data: [DONE]\n\n"

    with patch("app.api.v1.endpoints.ai_chat.run_pedagogical_loop_stream") as mock_stream:
        mock_stream.return_value = dummy_generator()
        response = client.post("/api/v1/ai/chat", json={"message": "Necesito ayuda matematicas"})
    
    assert response.status_code == 200
    assert "data: Excelente" in response.text
    assert "text/event-stream" in response.headers["content-type"]
    mock_stream.assert_called_once()


def test_ai_chat_stream_fallback_is_returned(auth_override):
    """
    Garantiza que el fallback del generador pedagógico llegue al cliente vía SSE.
    """
    client = TestClient(app)

    with patch("app.api.v1.endpoints.ai_chat.run_pedagogical_loop_stream") as mock_stream:
        def dummy_generator(*args, **kwargs):
            yield "data: Python Fallback \n\n"

        mock_stream.return_value = dummy_generator()
        response = client.post("/api/v1/ai/chat", json={"message": "Duda Test Fallback"})

        assert response.status_code == 200
        assert "data: Python Fallback" in response.text
        mock_stream.assert_called_once()


import asyncio
from unittest.mock import AsyncMock, MagicMock

@pytest.mark.asyncio
async def test_ai_chat_stream_client_disconnect(auth_override):
    """
    Valida que si el cliente se desconecta (is_disconnected() -> True),
    el endpoint de chat detenga la iteración y salga de manera limpia.
    """
    from app.api.v1.endpoints.ai_chat import chat_with_tutor
    
    # Mock de Request de FastAPI
    mock_request = MagicMock()
    mock_request.is_disconnected = AsyncMock(side_effect=[False, True]) # Primer chunk pasa, segundo aborta

    # Mock de DB y Payload
    mock_db = MagicMock()
    mock_payload = MagicMock()
    mock_payload.message = "Test message"
    mock_payload.attempt_id = 1
    mock_payload.question_context = {}

    user = User(id=1, email="alumno@tutorpaes.cl", name="Estudiante")

    def dummy_generator(*args, **kwargs):
        yield "Excelente pregunta socrática 1."
        yield "Excelente pregunta socrática 2."

    with patch("app.api.v1.endpoints.ai_chat.run_pedagogical_loop_stream") as mock_stream:
        mock_stream.return_value = dummy_generator()
        response = await chat_with_tutor(
            payload=mock_payload,
            request=mock_request,
            user=user,
            db=mock_db
        )
        
        # Consumir el generador asíncrono retornado por StreamingResponse
        chunks = []
        async for chunk in response.body_iterator:
            chunks.append(chunk)
            
        # Debería contener solo el primer chunk porque en el segundo is_disconnected es True
        assert len(chunks) == 1
        assert "Excelente pregunta socrática 1." in chunks[0]

