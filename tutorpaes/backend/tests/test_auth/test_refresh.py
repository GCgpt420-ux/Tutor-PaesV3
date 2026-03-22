from datetime import timezone
from jose import jwt
from datetime import datetime, timedelta
from types import SimpleNamespace

from app.core.config import settings
from app.core.auth import create_refresh_token
from app.db.session import get_db


def test_refresh_token_valid(client):
    from app.main import app

    user = SimpleNamespace(id=10, email="student@example.com", name="Student", is_admin=False, is_active=True)

    class FakeDB:
        def scalar(self, _query):
            return user

    def override_get_db():
        yield FakeDB()

    app.dependency_overrides[get_db] = override_get_db

    refresh_token = create_refresh_token(user.id)

    response = client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": refresh_token},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["user_id"] == user.id
    assert payload["access_token"]
    assert payload["refresh_token"]


def test_refresh_token_expired(client):
    expired_payload = {
        "sub": "10",
        "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
        "iat": datetime.now(timezone.utc) - timedelta(days=1),
        "type": "refresh",
    }
    expired_token = jwt.encode(expired_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    response = client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": expired_token},
    )

    assert response.status_code == 401


def test_refresh_token_revoked_user_not_found(client):
    from app.main import app

    class FakeDB:
        def scalar(self, _query):
            return None

    def override_get_db():
        yield FakeDB()

    app.dependency_overrides[get_db] = override_get_db

    refresh_token = create_refresh_token(999)

    response = client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": refresh_token},
    )

    assert response.status_code == 401
