"""
Tests for quiz endpoints:
  GET  /api/v1/quiz/next-question
  POST /api/v1/quiz/answer
"""
from types import SimpleNamespace

from app.core.auth import get_current_user
from app.db.session import get_db


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def _override_auth(app, user):
    app.dependency_overrides[get_current_user] = lambda: user


class _NullDB:
    """FakeDB that returns None for everything — triggers not-found paths."""

    def scalar(self, _q):
        return None

    def scalars(self, _q):
        return SimpleNamespace(all=lambda: [])

    def get(self, model, pk):
        return None


# ---------------------------------------------------------------------------
# GET /quiz/next-question  — auth guard
# ---------------------------------------------------------------------------

def test_next_question_requires_auth(client):
    response = client.get("/api/v1/quiz/next-question?subject_code=M1&topic_code=ALG")
    assert response.status_code == 401


def test_next_question_exam_not_seeded(client, test_user):
    from app.main import app

    _override_auth(app, test_user)
    app.dependency_overrides[get_db] = lambda: (yield _NullDB())

    response = client.get("/api/v1/quiz/next-question?subject_code=M1&topic_code=ALG")
    # exam not found → 400 bad_request
    assert response.status_code == 400
    assert "exam_not_seeded" in response.text


def test_next_question_subject_not_found(client, test_user, monkeypatch):
    from app.main import app
    from app.core.config import settings

    _override_auth(app, test_user)

    class _DB(_NullDB):
        _call = 0

        def scalar(self, _q):
            self._call += 1
            # first scalar = exam (found), second = subject (not found)
            if self._call == 1:
                return SimpleNamespace(id=1, code=settings.PAES_CODE)
            return None

    app.dependency_overrides[get_db] = lambda: (yield _DB())

    response = client.get("/api/v1/quiz/next-question?subject_code=INVALID&topic_code=ALG")
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# POST /quiz/answer  — auth guard + basic validation
# ---------------------------------------------------------------------------

def test_answer_requires_auth(client):
    response = client.post(
        "/api/v1/quiz/answer",
        json={"subject_code": "M1", "topic_code": "ALG", "question_id": 1, "selected_choice_id": 1},
    )
    assert response.status_code == 401


def test_answer_missing_body_fields(client, test_user):
    from app.main import app

    _override_auth(app, test_user)

    response = client.post(
        "/api/v1/quiz/answer",
        json={"subject_code": "M1"},  # missing required fields
    )
    assert response.status_code == 422


def test_answer_question_not_found(client, test_user, monkeypatch):
    from app.main import app
    from app.core.config import settings

    _override_auth(app, test_user)

    class _DB(_NullDB):
        _call = 0

        def scalar(self, _q):
            self._call += 1
            if self._call == 1:  # exam
                return SimpleNamespace(id=1, code=settings.PAES_CODE)
            if self._call == 2:  # subject
                return SimpleNamespace(id=1, code="M1", exam_id=1)
            if self._call == 3:  # topic
                return SimpleNamespace(id=1, code="ALG", subject_id=1)
            return None  # question not found

    app.dependency_overrides[get_db] = lambda: (yield _DB())

    response = client.post(
        "/api/v1/quiz/answer",
        json={"subject_code": "M1", "topic_code": "ALG", "question_id": 9999, "selected_choice_id": 1},
    )
    assert response.status_code == 404
