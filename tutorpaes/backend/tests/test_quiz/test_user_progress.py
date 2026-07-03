import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import select, create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB

from app.main import app
from app.db.session import get_db
from app.db.base import Base
from app.db.models import User, Exam, Subject, Topic, Question, QuestionChoice, UserProgress, Attempt
from app.core.auth import get_current_user

# SQLite no soporta nativamente el tipo JSONB de PostgreSQL, así que lo compilamos como JSON.
@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(element, compiler, **kw):
    return "JSON"

# Definir un engine y sessionmaker locales aislados para esta suite de integración
test_engine = create_engine(
    "sqlite+pysqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(autouse=True)
def setup_database_override():
    # Eliminar índices duplicados que causan colisiones en SQLite en memoria
    for table in Base.metadata.tables.values():
        seen = set()
        to_remove = []
        for idx in list(table.indexes):
            if idx.name in seen:
                to_remove.append(idx)
            else:
                seen.add(idx.name)
        for idx in to_remove:
            table.indexes.remove(idx)

    # Crear esquema en el engine local
    Base.metadata.create_all(bind=test_engine)
    
    # Sobrescribir dependencia get_db de forma limpia usando dependency_overrides
    def override_get_db():
        db = TestSessionLocal()
        try:
            yield db
        finally:
            db.close()
            
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides = {}
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def db_session():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def setup_data(db_session):
    # Sembrar entidades base
    user = User(id=1, email="alumno@tutorpaes.cl", name="Estudiante", hashed_password="hashed_pwd", is_active=True)
    db_session.add(user)

    exam = Exam(id=1, code="PAES", name="PAES Oficial", is_custom=False)
    db_session.add(exam)
    db_session.flush()

    subject = Subject(id=1, exam_id=1, code="M1", name="Matemática 1")
    db_session.add(subject)
    db_session.flush()

    topic = Topic(id=1, subject_id=1, code="ALG", name="Álgebra")
    db_session.add(topic)
    db_session.flush()

    # Pregunta 1
    q1 = Question(id=1, topic_id=1, prompt="Pregunta 1", difficulty="facil", is_active=True)
    db_session.add(q1)
    db_session.flush()

    c1_correct = QuestionChoice(id=1, question_id=1, label="A", text="Correcta", is_correct=True)
    c1_incorrect = QuestionChoice(id=2, question_id=1, label="B", text="Incorrecta", is_correct=False)
    db_session.add_all([c1_correct, c1_incorrect])

    # Pregunta 2
    q2 = Question(id=2, topic_id=1, prompt="Pregunta 2", difficulty="medio", is_active=True)
    db_session.add(q2)
    db_session.flush()

    c2_correct = QuestionChoice(id=3, question_id=2, label="A", text="Correcta", is_correct=True)
    c2_incorrect = QuestionChoice(id=4, question_id=2, label="B", text="Incorrecta", is_correct=False)
    db_session.add_all([c2_correct, c2_incorrect])

    db_session.commit()
    return user

def test_user_progress_sync_and_stats(client, setup_data, db_session):
    user = setup_data
    app.dependency_overrides[get_current_user] = lambda: user

    # 1. Enviar primera respuesta (Correcta)
    resp1 = client.post(
        "/api/v1/quiz/answer",
        json={"subject_code": "M1", "topic_code": "ALG", "question_id": 1, "selected_choice_id": 1}
    )
    assert resp1.status_code == 200
    assert resp1.json()["is_correct"] is True

    # Verificar que se creó el registro de UserProgress
    progress = db_session.scalar(
        select(UserProgress).where(UserProgress.user_id == user.id, UserProgress.topic_id == 1)
    )
    assert progress is not None
    assert progress.total_answered == 1
    assert progress.total_correct == 1
    assert progress.accuracy == 100

    # 2. Enviar segunda respuesta (Incorrecta)
    resp2 = client.post(
        "/api/v1/quiz/answer",
        json={"subject_code": "M1", "topic_code": "ALG", "question_id": 2, "selected_choice_id": 4}
    )
    assert resp2.status_code == 200
    assert resp2.json()["is_correct"] is False

    # Recargar progress
    db_session.refresh(progress)
    assert progress.total_answered == 2
    assert progress.total_correct == 1
    assert progress.accuracy == 50
    assert progress.last_activity_at is not None

    # 3. Consultar estadísticas
    stats_resp = client.get(f"/api/v1/users/{user.id}/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["overall_accuracy"] == 50.0
    
    # Validar que el payload contiene la estructura esperada por el frontend
    subjects = stats["subjects"]
    assert len(subjects) == 1
    assert subjects[0]["subject_code"] == "M1"
    
    topics = subjects[0]["topics"]
    assert len(topics) == 1
    assert topics[0]["topic_code"] == "ALG"
    assert topics[0]["accuracy"] == 50.0
    assert topics[0]["questions"] == 2
    assert topics[0]["correct"] == 1
    assert topics[0]["completed_at"] is not None

    # Limpiar override de auth
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]
