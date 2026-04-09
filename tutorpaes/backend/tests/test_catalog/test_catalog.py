"""
Tests for catalog endpoints:
  GET /api/v1/catalog/exams/
  GET /api/v1/catalog/subjects/
  GET /api/v1/catalog/exams/{exam_id}
  GET /api/v1/catalog/topics/
"""
from types import SimpleNamespace

from app.db.session import get_db


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def _make_subject(sid: int, exam_id: int, topics=None):
    return SimpleNamespace(
        id=sid,
        exam_id=exam_id,
        code=f"SUBJ{sid}",
        name=f"Subject {sid}",
        topics=topics or [],
    )


def _make_topic(tid: int, subject_id: int):
    return SimpleNamespace(id=tid, subject_id=subject_id, code=f"TOP{tid}", name=f"Topic {tid}")


def _make_exam(eid: int, subjects=None):
    return SimpleNamespace(
        id=eid,
        code=f"EXAM{eid}",
        name=f"Exam {eid}",
        is_custom=False,
        subjects=subjects or [],
    )


# ---------------------------------------------------------------------------
# GET /catalog/exams/  — public endpoint, no auth required
# ---------------------------------------------------------------------------

class _ExamsDB:
    """FakeDB that returns a list of exams with eager-loaded subjects."""

    def __init__(self, exams):
        self._exams = exams

    def scalars(self, _query):
        return SimpleNamespace(all=lambda: self._exams)


def test_get_exams_returns_list(client):
    from app.main import app

    subj = _make_subject(1, exam_id=1)
    exam = _make_exam(1, subjects=[subj])
    app.dependency_overrides[get_db] = lambda: (yield _ExamsDB([exam]))

    response = client.get("/api/v1/catalog/exams/")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["exam_id"] == 1
    assert body[0]["code"] == "EXAM1"
    assert len(body[0]["subjects"]) == 1


def test_get_exams_empty(client):
    from app.main import app

    app.dependency_overrides[get_db] = lambda: (yield _ExamsDB([]))
    response = client.get("/api/v1/catalog/exams/")
    assert response.status_code == 200
    assert response.json() == []


# ---------------------------------------------------------------------------
# GET /catalog/exams/{exam_id}
# ---------------------------------------------------------------------------

class _ExamDetailDB:
    def __init__(self, exam=None, active_topic_ids=None):
        self._exam = exam
        self._active_topic_ids = active_topic_ids or []
        self._call = 0

    def scalar(self, _query):
        return self._exam

    def scalars(self, _query):
        self._call += 1
        # second scalars call = active topic ids
        return SimpleNamespace(all=lambda: self._active_topic_ids)


def test_get_exam_detail_found(client):
    from app.main import app

    topic = _make_topic(10, subject_id=1)
    subj = _make_subject(1, exam_id=1, topics=[topic])
    exam = _make_exam(1, subjects=[subj])

    app.dependency_overrides[get_db] = lambda: (yield _ExamDetailDB(exam=exam, active_topic_ids=[10]))

    response = client.get("/api/v1/catalog/exams/1")
    assert response.status_code == 200
    body = response.json()
    assert body["exam_id"] == 1
    assert len(body["subjects"]) == 1
    assert len(body["subjects"][0]["topics"]) == 1


def test_get_exam_detail_not_found(client):
    from app.main import app

    app.dependency_overrides[get_db] = lambda: (yield _ExamDetailDB(exam=None))
    response = client.get("/api/v1/catalog/exams/999")
    assert response.status_code == 404


def test_get_exam_filters_inactive_topics(client):
    """Topics not in active_topic_ids must be excluded from response."""
    from app.main import app

    topic1 = _make_topic(1, subject_id=1)
    topic2 = _make_topic(2, subject_id=1)  # inactive
    subj = _make_subject(1, exam_id=1, topics=[topic1, topic2])
    exam = _make_exam(1, subjects=[subj])

    # Only topic 1 is active
    app.dependency_overrides[get_db] = lambda: (yield _ExamDetailDB(exam=exam, active_topic_ids=[1]))

    response = client.get("/api/v1/catalog/exams/1")
    assert response.status_code == 200
    topics = response.json()["subjects"][0]["topics"]
    assert len(topics) == 1
    assert topics[0]["topic_id"] == 1


# ---------------------------------------------------------------------------
# GET /catalog/topics/
# ---------------------------------------------------------------------------

class _TopicsDB:
    def __init__(self, subject=None, topics=None):
        self._subject = subject
        self._topics = topics or []

    def scalar(self, _q):
        return self._subject

    def scalars(self, _q):
        return SimpleNamespace(all=lambda: self._topics)


def test_get_topics_for_subject(client):
    from app.main import app

    subj = _make_subject(1, exam_id=1)
    t1 = _make_topic(1, subject_id=1)
    t2 = _make_topic(2, subject_id=1)

    app.dependency_overrides[get_db] = lambda: (yield _TopicsDB(subject=subj, topics=[t1, t2]))

    response = client.get("/api/v1/catalog/topics/?subject_id=1")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert body[0]["topic_id"] == 1


def test_get_topics_subject_not_found(client):
    from app.main import app

    app.dependency_overrides[get_db] = lambda: (yield _TopicsDB(subject=None))
    response = client.get("/api/v1/catalog/topics/?subject_id=999")
    assert response.status_code == 404
