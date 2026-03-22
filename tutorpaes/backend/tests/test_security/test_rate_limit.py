from app.db.session import get_db


def test_login_rate_limit_returns_429(client):
    from app.main import app

    class FakeDB:
        def scalar(self, _query):
            return None

    def override_get_db():
        yield FakeDB()

    app.dependency_overrides[get_db] = override_get_db

    last_status_code = None
    for _ in range(25):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "rate@example.com", "password": "StrongPass123"},
        )
        last_status_code = response.status_code

    assert last_status_code == 429
