from datetime import timezone
from datetime import datetime, timedelta
from types import SimpleNamespace

from jose import jwt

from app.core.auth import create_access_token
from app.core.config import settings
from app.db.session import get_db
from app.db.models import RevokedToken


def test_protected_route_with_valid_token(client):
    from app.main import app

    user = SimpleNamespace(
        id=10,
        email="student@example.com",
        name="Student",
        is_admin=False,
        is_active=True,
        age=None,
        academic_level=None,
        target_university=None,
        target_degree=None,
        target_score=None,
    )

    class FakeDB:
        def scalar(self, query):
            # Return None for blacklist checks, user for everything else
            try:
                entity = query.column_descriptions[0]["entity"]
                if entity is RevokedToken:
                    return None
            except (AttributeError, IndexError, KeyError):
                pass
            return user

    def override_get_db():
        yield FakeDB()

    app.dependency_overrides[get_db] = override_get_db

    access_token = create_access_token(user.id)

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert response.status_code == 200
    assert response.json()["user_id"] == user.id


def test_protected_route_with_expired_token(client):
    expired_payload = {
        "sub": "10",
        "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
        "iat": datetime.now(timezone.utc) - timedelta(days=1),
        "type": "access",
    }
    expired_token = jwt.encode(expired_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )

    assert response.status_code == 401
