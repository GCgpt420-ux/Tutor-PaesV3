from types import SimpleNamespace

from app.api.v1.endpoints import ai as ai_endpoints
from app.core.auth import get_current_user
from app.db.session import get_db


def test_feedback_idor_protected(client, test_user, monkeypatch):
    from app.main import app

    class FakeDB:
        def scalar(self, _query):
            return None

    def override_get_db():
        yield FakeDB()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: test_user

    response = client.get("/api/v1/ai/feedback/123")

    assert response.status_code == 404


def test_feedback_owner_access_allowed(client, test_user, monkeypatch):
    from app.main import app

    fake_feedback = SimpleNamespace(id=50, attempt_id=1, question_id=1)

    class FakeDB:
        def scalar(self, _query):
            return fake_feedback

    def override_get_db():
        yield FakeDB()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: test_user

    monkeypatch.setattr(ai_endpoints, "generate_feedback", lambda fb, db, user: {"feedback_id": fb.id, "ok": True})

    response = client.get("/api/v1/ai/feedback/50")

    assert response.status_code == 200
    assert response.json()["ok"] is True
