from app.db.session import get_db


def test_internal_errors_are_sanitized(client):
    from app.main import app

    class FailingDB:
        def scalar(self, _query):
            raise RuntimeError("db credentials leaked")

    def override_get_db():
        yield FailingDB()

    app.dependency_overrides[get_db] = override_get_db

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "student@example.com", "password": "StrongPass123"},
    )

    assert response.status_code == 500
    payload = response.json()
    assert payload["error"] == "internal_server_error"
    assert payload["detail"] == "Error interno del servidor"
    assert "request_id" in payload
