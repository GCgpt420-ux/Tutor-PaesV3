"""
Pruebas para endpoints de catalogo:
    GET /api/v1/catalog/exams/
    GET /api/v1/catalog/subjects/
    GET /api/v1/catalog/exams/{exam_id}
    GET /api/v1/catalog/topics/
"""
from types import SimpleNamespace

from app.db.session import get_db


# ---------------------------------------------------------------------------
# utilidades
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
# GET /catalog/exams/  — endpoint publico, sin autenticacion
# ---------------------------------------------------------------------------

class _ExamsDB:
    """DB simulada que devuelve examenes con asignaturas precargadas."""

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
        # Segunda llamada a scalars: IDs de topicos activos
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
    """Los topicos fuera de active_topic_ids deben excluirse de la respuesta."""
    from app.main import app

    topic1 = _make_topic(1, subject_id=1)
    topic2 = _make_topic(2, subject_id=1)  # inactivo
    subj = _make_subject(1, exam_id=1, topics=[topic1, topic2])
    exam = _make_exam(1, subjects=[subj])

    # Solo el topico 1 esta activo
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


# ---------------------------------------------------------------------------
# GET /catalog/subjects-with-topics
# ---------------------------------------------------------------------------

class _SubjectsWithTopicsDB:
    def __init__(self, exam=None, subjects=None, active_topic_ids=None):
        self._exam = exam
        self._subjects = subjects or []
        self._active_topic_ids = active_topic_ids or []
        self.scalars_calls = 0

    def scalar(self, _q):
        return self._exam

    def scalars(self, _q):
        self.scalars_calls += 1
        if self.scalars_calls == 1:
            return SimpleNamespace(all=lambda: self._subjects)
        if self.scalars_calls == 2:
            return SimpleNamespace(all=lambda: self._active_topic_ids)
        raise AssertionError("Patron de consultas extra inesperado (posible regresion N+1)")


def test_get_subjects_with_topics_bulk_query_pattern(client):
    from app.main import app

    topic1 = _make_topic(1, subject_id=1)
    topic2 = _make_topic(2, subject_id=1)
    topic3 = _make_topic(3, subject_id=2)
    subj1 = _make_subject(1, exam_id=1, topics=[topic1, topic2])
    subj2 = _make_subject(2, exam_id=1, topics=[topic3])
    exam = _make_exam(1, subjects=[subj1, subj2])

    fake_db = _SubjectsWithTopicsDB(
        exam=exam,
        subjects=[subj1, subj2],
        active_topic_ids=[1, 3],
    )
    app.dependency_overrides[get_db] = lambda: (yield fake_db)

    response = client.get("/api/v1/catalog/subjects-with-topics?exam_id=1")
    assert response.status_code == 200

    body = response.json()
    assert len(body) == 2
    assert [t["topic_id"] for t in body[0]["topics"]] == [1]
    assert [t["topic_id"] for t in body[1]["topics"]] == [3]
    assert fake_db.scalars_calls == 2


def test_get_subjects_with_topics_exam_not_found(client):
    from app.main import app

    app.dependency_overrides[get_db] = lambda: (yield _SubjectsWithTopicsDB(exam=None))
    response = client.get("/api/v1/catalog/subjects-with-topics?exam_id=999")
    assert response.status_code == 404


def test_demre_subjects_priority_order(client):
    from app.main import app

    sub_hist = SimpleNamespace(id=5, exam_id=1, code="HIST", name="Historia", topics=[])
    sub_leng = SimpleNamespace(id=9, exam_id=1, code="LENG", name="Competencia Lectora", topics=[])
    sub_m1 = SimpleNamespace(id=1, exam_id=1, code="M1", name="Matemática 1", topics=[])
    sub_m2 = SimpleNamespace(id=4, exam_id=1, code="M2", name="Matemática 2", topics=[])
    sub_bio = SimpleNamespace(id=6, exam_id=1, code="BIO", name="Biología", topics=[])
    exam = _make_exam(1, subjects=[sub_hist, sub_leng, sub_bio, sub_m2, sub_m1])

    class FakeOrderingDB:
        def __init__(self):
            self.calls = 0

        def scalar(self, _q):
            return exam

        def scalars(self, _q):
            self.calls += 1
            if self.calls == 1:
                return SimpleNamespace(all=lambda: [sub_hist, sub_leng, sub_bio, sub_m2, sub_m1])
            return SimpleNamespace(all=lambda: [])

    app.dependency_overrides[get_db] = lambda: (yield FakeOrderingDB())

    response = client.get("/api/v1/catalog/subjects?exam_id=1")
    assert response.status_code == 200
    body = response.json()
    codes = [s["subject_code"] for s in body]
    # LENG (1) -> M1 (2) -> M2 (3) -> BIO (5) -> HIST (8)
    assert codes == ["LENG", "M1", "M2", "BIO", "HIST"]


def test_get_topic_study_notes(client):
    from app.main import app

    subj = SimpleNamespace(id=1, code="M1", name="Matemática 1")
    topic = SimpleNamespace(id=1, code="ALG", name="Álgebra y Funciones", subject_id=1, subject=subj)

    class FakeStudyDB:
        def scalar(self, _q):
            # First call returns topic, second scalar call returns count
            if not hasattr(self, "_call"):
                self._call = 1
                return topic
            return 16

    app.dependency_overrides[get_db] = lambda: (yield FakeStudyDB())

    response = client.get("/api/v1/catalog/topics/1/study-notes")
    assert response.status_code == 200
    data = response.json()
    assert data["topic_id"] == 1
    assert data["topic_code"] == "ALG"
    assert data["subject_code"] == "M1"
    assert len(data["key_concepts"]) >= 1
    assert len(data["demre_traps"]) >= 1
    assert len(data["recommended_strategies"]) >= 1
    assert data["available_questions_count"] == 16


def test_get_topic_study_notes_not_found(client):
    from app.main import app

    class FakeEmptyDB:
        def scalar(self, _q):
            return None

    app.dependency_overrides[get_db] = lambda: (yield FakeEmptyDB())

    response = client.get("/api/v1/catalog/topics/999/study-notes")
    assert response.status_code == 404

