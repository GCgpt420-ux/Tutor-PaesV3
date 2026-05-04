from app.core.auth import get_current_user


def test_transcribe_returns_503_when_groq_not_configured(client, test_user, monkeypatch):
    from app.main import app
    from app.api.v1.endpoints import voice as voice_endpoint

    app.dependency_overrides[get_current_user] = lambda: test_user
    monkeypatch.setattr(voice_endpoint.settings, "GROQ_API_KEY", "")

    response = client.post(
        "/api/v1/voice/transcribe",
        files={"file": ("recording.webm", b"fake-audio", "audio/webm")},
    )

    assert response.status_code == 503
    payload = response.json()
    assert payload["error"] == "request_error"
    assert payload["detail"]["code"] == "VOICE_STT_UNAVAILABLE"
