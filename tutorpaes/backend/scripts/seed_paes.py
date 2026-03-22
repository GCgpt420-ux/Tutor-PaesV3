from sqlalchemy import select
from app.core.config import settings
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.db.models import Exam, Subject, Topic, Question

# Crear tablas si no existen
Base.metadata.create_all(bind=engine)

PAES_CODE = settings.PAES_CODE

SUBJECTS = [
    ("LECT", "Competencia Lectora"),
    ("M1", "Matemática 1"),
    ("M2", "Matemática 2"),
    ("CIEN", "Ciencias"),
    ("HIST", "Historia y Ciencias Sociales"),
]

def get_or_create_exam(db):
    exam = db.scalar(select(Exam).where(Exam.code == PAES_CODE))
    if exam:
        return exam
    exam = Exam(code=PAES_CODE, name="PAES")
    db.add(exam)
    db.flush()
    return exam

def get_or_create_subject(db, exam_id: int, code: str, name: str):
    subj = db.scalar(select(Subject).where(Subject.exam_id == exam_id, Subject.code == code))
    if subj:
        return subj
    subj = Subject(exam_id=exam_id, code=code, name=name)
    db.add(subj)
    db.flush()
    return subj

def get_or_create_topic(db, subject_id: int, code: str, name: str):
    topic = db.scalar(select(Topic).where(Topic.subject_id == subject_id, Topic.code == code))
    if topic:
        return topic
    topic = Topic(subject_id=subject_id, code=code, name=name)
    db.add(topic)
    db.flush()
    return topic

def deactivate_demo_questions(db):
    """Desactiva preguntas demo antiguas para evitar ruido en ambientes ya seed-eados."""
    demo_prompts = {
        "¿Cuánto es 2 + 2?",
        "¿Cuál es el resultado de 2 + 2?",
        "¿Cuánto es 2+2?",
    }
    demos = db.scalars(select(Question).where(Question.prompt.in_(demo_prompts))).all()
    for q in demos:
        q.is_active = False

def main():
    db = SessionLocal()
    try:
        exam = get_or_create_exam(db)

        # subjects + topics placeholder
        for code, name in SUBJECTS:
            subj = get_or_create_subject(db, exam.id, code, name)
            # topic placeholder "GEN" por si aún no definimos temario
            get_or_create_topic(db, subj.id, "GEN", "General")

        # M1 -> ALG (ya lo estás usando como base)
        m1 = db.scalar(select(Subject).where(Subject.exam_id == exam.id, Subject.code == "M1"))
        alg = get_or_create_topic(db, m1.id, "ALG", "Álgebra")

        # Compat: si en DB existe una pregunta demo histórica, la desactivamos.
        deactivate_demo_questions(db)

        db.commit()
        print(" Seed PAES listo: exam+subjects+topics placeholder (sin pregunta demo).")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
