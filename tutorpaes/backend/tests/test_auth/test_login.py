from types import SimpleNamespace

from sqlalchemy.exc import OperationalError

from app.core.auth import get_password_hash
from app.db.session import get_db


def test_login_success(client):
    from app.main import app

    hashed_password = get_password_hash("StrongPass123")
    user = SimpleNamespace(
        id=10,
        email="student@example.com",
        name="Student",
        is_admin=False,
        is_active=True,
        hashed_password=hashed_password,
    )

    class FakeDB:
        def scalar(self, _query):
            return user

    def override_get_db():
        yield FakeDB()

    app.dependency_overrides[get_db] = override_get_db

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "student@example.com", "password": "StrongPass123"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["user_id"] == 10
    assert payload["access_token"]
    assert payload["refresh_token"]


def test_login_invalid_credentials(client):
    from app.main import app

    class FakeDB:
        def scalar(self, _query):
            return None

    def override_get_db():
        yield FakeDB()

    app.dependency_overrides[get_db] = override_get_db

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "student@example.com", "password": "StrongPass123"},
    )

    assert response.status_code == 401


def test_login_db_unavailable_returns_503(client):
    from app.main import app

    class FakeDB:
        def scalar(self, _query):
            raise OperationalError("SELECT", {}, Exception("db down"))

    def override_get_db():
        yield FakeDB()

    app.dependency_overrides[get_db] = override_get_db

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "student@example.com", "password": "StrongPass123"},
    )

    assert response.status_code == 503
