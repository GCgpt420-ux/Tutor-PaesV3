import logging
import os
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional, Tuple

# Detect backend directory and setup sys.path
CURRENT_FILE = Path(__file__).resolve()
BACKEND_DIR = CURRENT_FILE.parent.parent
sys.path.insert(0, str(BACKEND_DIR))

def ensure_env_loaded():
    from dotenv import load_dotenv
    env_file = BACKEND_DIR / ".env"
    if env_file.exists():
        load_dotenv(env_file)

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.auth import get_password_hash, verify_password
from app.db.models import Attempt, Course, CourseEnrollment, Exam, Subject, Topic, User, UserProgress
from app.db.session import SessionLocal

logger = logging.getLogger("seed_pilot_users")

PILOT_PASSWORD = os.getenv("PILOT_PASSWORD", "paes2026")
TEACHER_EMAIL = "profesor.hermano@tutorpaes.cl"
TEACHER_NAME = "Profesor Hermano"
COURSE_NAME = "Curso Piloto PAES 2026"

# 20 Cuentas Universitarias
UNIVERSITY_NAMES = [
    "Patricio Aylwin", "Maximiliano del Río", "Joaquín Nonquepán", "Matías Osorio",
    "Isidora Pérez", "Lucas Soto", "Amanda Silva", "Tomás Contreras",
    "Martina Sepúlveda", "Joaquín Morales", "Camila Fuentes", "Agustín Valenzuela",
    "Catalina Araya", "Gaspar Carrasco", "Fernanda Herrera", "Vicente Jara",
    "Valentina Castro", "Maximiliano Núñez", "Constanza Reyes", "Alonso Guzmán",
]

UNIVERSITY_DEGREES = [
    "Ingeniería Civil", "Medicina", "Derecho", "Psicología", "Arquitectura",
    "Astronomía", "Bioquímica", "Ingeniería Comercial", "Enfermería", "Geología",
]

UNIVERSITIES = [
    "Universidad de Chile",
    "Pontificia Universidad Católica",
    "Universidad de Santiago",
    "Universidad de Concepción",
    "Universidad Técnica Federico Santa María",
]

UNIVERSITY_STUDENTS = [
    {
        "email": f"alumno{i:02d}@tutorpaes.cl",
        "name": UNIVERSITY_NAMES[i - 1],
        "role": "student",
        "academic_level": "Egresado",
        "target_university": UNIVERSITIES[(i - 1) % len(UNIVERSITIES)],
        "target_degree": UNIVERSITY_DEGREES[(i - 1) % len(UNIVERSITY_DEGREES)],
        "target_score": 750 + ((i * 11) % 180),
        "is_premium": True,
    }
    for i in range(1, 21)
]

# 10 Cuentas Escolares
SCHOOL_NAMES = [
    "Benjamín Silva", "Sofía Morales", "Vicente González", "Emilia Tapia",
    "Martín Rojas", "Florencia Espinoza", "Mateo Muñoz", "Josefa Bravo",
    "Diego Navarro", "Ignacia Pizarro",
]

SCHOOL_DEGREES = [
    "Ingeniería Comercial", "Medicina", "Odontología", "Periodismo", "Enfermería",
    "Diseño", "Kinesiología", "Derecho", "Pedagogía", "Publicidad",
]

SCHOOL_UNIVERSITIES = [
    "Pontificia Universidad Católica",
    "Universidad de Chile",
    "Universidad Adolfo Ibáñez",
    "Universidad de los Andes",
    "Universidad Diego Portales",
]

SCHOOL_STUDENTS = [
    {
        "email": f"escolar{i:02d}@tutorpaes.cl",
        "name": SCHOOL_NAMES[i - 1],
        "role": "student",
        "academic_level": "4to medio",
        "target_university": SCHOOL_UNIVERSITIES[(i - 1) % len(SCHOOL_UNIVERSITIES)],
        "target_degree": SCHOOL_DEGREES[(i - 1) % len(SCHOOL_DEGREES)],
        "target_score": 670 + ((i * 19) % 210),
        "is_premium": True,
    }
    for i in range(1, 11)
]


def sync_teacher(db: Session, email: str, password: str, name: str) -> User:
    """Crea o actualiza de forma idempotente la cuenta docente."""
    teacher = db.scalar(select(User).where(User.email == email))
    if not teacher:
        hashed = get_password_hash(password)
        teacher = User(
            email=email,
            hashed_password=hashed,
            name=name,
            role="teacher",
            is_premium=True,
            is_active=True,
            is_admin=False,
            created_at=datetime.now(timezone.utc) - timedelta(days=60),
        )
        db.add(teacher)
        db.flush()
        print(f"[Docente] Cuenta creada: {email} ({name})")
    else:
        changed = False
        if teacher.role != "teacher":
            teacher.role = "teacher"
            changed = True
        if teacher.name != name:
            teacher.name = name
            changed = True
        if not teacher.is_active:
            teacher.is_active = True
            changed = True
        if not teacher.hashed_password or not verify_password(password, teacher.hashed_password):
            teacher.hashed_password = get_password_hash(password)
            changed = True
        if changed:
            db.flush()
            print(f"[Docente] Cuenta actualizada: {email}")
        else:
            print(f"[Docente] Cuenta verificada al día: {email}")
    return teacher


def sync_course(db: Session, teacher_id: int, course_name: str) -> Course:
    """Crea o reutiliza de forma idempotente el curso asignado al profesor."""
    course = db.scalar(
        select(Course).where(Course.name == course_name, Course.teacher_id == teacher_id)
    )
    if not course:
        course = Course(
            name=course_name,
            teacher_id=teacher_id,
            created_at=datetime.now(timezone.utc) - timedelta(days=30),
        )
        db.add(course)
        db.flush()
        print(f"[Curso] Curso creado: '{course_name}' (ID: {course.id})")
    else:
        print(f"[Curso] Curso existente confirmado: '{course_name}' (ID: {course.id})")
    return course


def sync_students(db: Session, student_defs: List[dict], default_password: str) -> List[User]:
    """Crea o actualiza de forma idempotente la lista de estudiantes."""
    students = []
    hashed_pwd = get_password_hash(default_password)

    for item in student_defs:
        email = item["email"]
        student = db.scalar(select(User).where(User.email == email))
        if not student:
            student = User(
                email=email,
                hashed_password=hashed_pwd,
                name=item["name"],
                role=item.get("role", "student"),
                is_premium=item.get("is_premium", True),
                is_active=True,
                is_admin=False,
                academic_level=item.get("academic_level"),
                target_university=item.get("target_university"),
                target_degree=item.get("target_degree"),
                target_score=item.get("target_score"),
                created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(15, 45)),
            )
            db.add(student)
            db.flush()
            print(f"  [Estudiante] Creado: {email} - {item['name']}")
        else:
            changed = False
            if student.role != "student":
                student.role = "student"
                changed = True
            if not student.is_active:
                student.is_active = True
                changed = True
            if not student.is_premium:
                student.is_premium = True
                changed = True
            if not student.hashed_password or not verify_password(default_password, student.hashed_password):
                student.hashed_password = hashed_pwd
                changed = True
            if changed:
                db.flush()
        students.append(student)

    return students


def sync_enrollments(db: Session, course_id: int, student_ids: List[int]) -> int:
    """Matricula a los estudiantes en el curso si aún no están inscritos."""
    existing_enrollments = set(
        db.scalars(
            select(CourseEnrollment.student_id).where(CourseEnrollment.course_id == course_id)
        ).all()
    )

    new_enrolled = 0
    for s_id in student_ids:
        if s_id not in existing_enrollments:
            enrollment = CourseEnrollment(
                course_id=course_id,
                student_id=s_id,
                enrolled_at=datetime.now(timezone.utc) - timedelta(days=random.randint(5, 20)),
            )
            db.add(enrollment)
            new_enrolled += 1

    if new_enrolled > 0:
        db.flush()
        print(f"[Matrícula] {new_enrolled} nuevos estudiantes matriculados en curso ID {course_id}.")
    else:
        print(f"[Matrícula] Los {len(student_ids)} estudiantes ya se encuentran matriculados.")
    return new_enrolled


def sync_pilot_dashboard_metrics(db: Session, course_id: int, student_ids: List[int]):
    """
    Genera métricas realistas en UserProgress y Attempt para alimentar TeacherDashboardView.
    - Temas críticos (< 50% asertividad) como M2 Álgebra y Física.
    - Alumnos en riesgo (< 60% asertividad) para alertar al docente.
    - Intentos completados con puntaje oficial PAES (100 a 1000).
    """
    # Buscar tópicos disponibles para asignar métricas pedagógicas
    topic_m1_alg = db.scalar(select(Topic).where(Topic.code == "ALG", Topic.subject_id == 1))
    topic_m1_geo = db.scalar(select(Topic).where(Topic.code == "GEO", Topic.subject_id == 1))
    topic_m2_alg = db.scalar(select(Topic).where(Topic.code == "ALG", Topic.subject_id == 4))
    topic_m2_geo = db.scalar(select(Topic).where(Topic.code == "GEO", Topic.subject_id == 4))
    topic_bio_gen = db.scalar(select(Topic).where(Topic.code == "GEN", Topic.subject_id == 6))
    topic_fis_gen = db.scalar(select(Topic).where(Topic.code == "GEN", Topic.subject_id == 7))
    topic_qui_gen = db.scalar(select(Topic).where(Topic.code == "GEN", Topic.subject_id == 8))
    topic_leng_gen = db.scalar(select(Topic).where(Topic.code == "GEN", Topic.subject_id == 9))

    configured_topics = [
        (topic_m1_alg, (55.0, 72.0)),      # M1 Álgebra
        (topic_m1_geo, (60.0, 75.0)),      # M1 Geometría
        (topic_m2_alg, (28.0, 44.0)),      # M2 Álgebra Avanzada -> CRÍTICO (<50%)
        (topic_m2_geo, (35.0, 48.0)),      # M2 Geometría Avanzada -> CRÍTICO (<50%)
        (topic_fis_gen, (40.0, 49.0)),     # Física -> CRÍTICO (<50%)
        (topic_bio_gen, (70.0, 88.0)),     # Biología -> SÓLIDO
        (topic_qui_gen, (65.0, 82.0)),     # Química -> SÓLIDO
        (topic_leng_gen, (75.0, 92.0)),    # Lectora -> DESTACADO
    ]
    # Filtrar solo los existentes en la base de datos
    valid_topics = [(t, acc_range) for t, acc_range in configured_topics if t is not None]

    if not valid_topics:
        print("[Métricas] No se encontraron tópicos para métricas de progreso.")
        return

    random.seed(2026)  # Determinismo para reproducibilidad

    # Identificar 3 alumnos "en riesgo" para poblar studentsAtRisk del dashboard
    at_risk_student_ids = set(student_ids[3:6])  # alumno04, alumno05, alumno06

    created_progress = 0
    updated_progress = 0
    created_attempts = 0

    for s_id in student_ids:
        is_at_risk = s_id in at_risk_student_ids

        # 1. UserProgress por tópico
        for topic, (min_acc, max_acc) in valid_topics:
            target_acc = random.uniform(min_acc, max_acc)
            if is_at_risk:
                target_acc = max(20.0, target_acc - 22.0)

            total_answered = random.randint(12, 35)
            total_correct = int(round((target_acc / 100.0) * total_answered))
            actual_accuracy = round((total_correct / total_answered) * 100.0, 1)

            existing_p = db.scalar(
                select(UserProgress).where(
                    UserProgress.user_id == s_id, UserProgress.topic_id == topic.id
                )
            )
            if not existing_p:
                p_obj = UserProgress(
                    user_id=s_id,
                    topic_id=topic.id,
                    total_answered=total_answered,
                    total_correct=total_correct,
                    accuracy=actual_accuracy,
                    streak=random.randint(0, 5),
                    last_activity_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 10)),
                    updated_at=datetime.now(timezone.utc),
                )
                db.add(p_obj)
                created_progress += 1
            else:
                existing_p.total_answered = total_answered
                existing_p.total_correct = total_correct
                existing_p.accuracy = actual_accuracy
                existing_p.updated_at = datetime.now(timezone.utc)
                updated_progress += 1

        # 2. Intentos (Attempts) completados
        existing_attempts_count = db.scalar(
            select(Attempt.id).where(Attempt.user_id == s_id, Attempt.status == "completed")
        )
        if not existing_attempts_count:
            # Intento M1 (Matemática 1)
            total_q_m1 = 15
            acc_m1 = 0.52 if is_at_risk else random.uniform(0.65, 0.85)
            correct_m1 = int(round(total_q_m1 * acc_m1))
            score_m1 = int(100 + (correct_m1 / total_q_m1) * 900)  # Escala oficial 100 - 1000

            att1 = Attempt(
                user_id=s_id,
                exam_id=1,
                subject_id=1,  # M1
                topic_id=None,
                status="completed",
                total_questions=total_q_m1,
                correct_count=correct_m1,
                incorrect_count=total_q_m1 - correct_m1,
                omitted_count=0,
                score=score_m1,
                started_at=datetime.now(timezone.utc) - timedelta(days=random.randint(3, 8)),
                completed_at=datetime.now(timezone.utc) - timedelta(days=random.randint(3, 8)) + timedelta(minutes=random.randint(25, 45)),
            )
            db.add(att1)
            created_attempts += 1

            # Intento LENG (Competencia Lectora)
            total_q_leng = 12
            acc_leng = 0.58 if is_at_risk else random.uniform(0.70, 0.90)
            correct_leng = int(round(total_q_leng * acc_leng))
            score_leng = int(100 + (correct_leng / total_q_leng) * 900)

            att2 = Attempt(
                user_id=s_id,
                exam_id=1,
                subject_id=9,  # LENG
                topic_id=None,
                status="completed",
                total_questions=total_q_leng,
                correct_count=correct_leng,
                incorrect_count=total_q_leng - correct_leng,
                omitted_count=0,
                score=score_leng,
                started_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 4)),
                completed_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 4)) + timedelta(minutes=random.randint(20, 40)),
            )
            db.add(att2)
            created_attempts += 1

    db.flush()
    print(
        f"[Métricas] Progreso generado: {created_progress} nuevos, {updated_progress} actualizados. "
        f"Intentos completados: {created_attempts} creados."
    )


def seed_pilot_users(db: Optional[Session] = None) -> dict:
    """Punto de entrada principal para sembrar usuarios piloto, curso y datos pedagógicos."""
    ensure_env_loaded()
    should_close_db = False
    if db is None:
        db = SessionLocal()
        should_close_db = True

    print("=" * 70)
    print("SEMBRANDO USUARIOS PILOTO Y CURSO - TUTOR PAES V3")
    print(f"Docente: {TEACHER_EMAIL}")
    print(f"Estudiantes Universitarios: {len(UNIVERSITY_STUDENTS)}")
    print(f"Estudiantes Escolares: {len(SCHOOL_STUDENTS)}")
    print(f"Curso Piloto: '{COURSE_NAME}'")
    print(f"Clave Unificada: '{PILOT_PASSWORD}'")
    print("=" * 70)

    try:
        # 1. Sembrar docente
        teacher = sync_teacher(db, TEACHER_EMAIL, PILOT_PASSWORD, TEACHER_NAME)

        # 2. Sembrar curso piloto
        course = sync_course(db, teacher.id, COURSE_NAME)

        # 3. Sembrar estudiantes universitarios (20)
        print("\nSincronizando 20 estudiantes universitarios...")
        uni_students = sync_students(db, UNIVERSITY_STUDENTS, PILOT_PASSWORD)

        # 4. Sembrar estudiantes escolares (10)
        print("\nSincronizando 10 estudiantes escolares...")
        sch_students = sync_students(db, SCHOOL_STUDENTS, PILOT_PASSWORD)

        all_students = uni_students + sch_students
        student_ids = [s.id for s in all_students]

        # 5. Matricular en el curso piloto
        print("\nMatriculando estudiantes en el curso piloto...")
        new_enrollments = sync_enrollments(db, course.id, student_ids)

        # 6. Sembrar datos para TeacherDashboardView
        print("\nGenerando métricas pedagógicas para TeacherDashboardView...")
        sync_pilot_dashboard_metrics(db, course.id, student_ids)

        db.commit()

        print("\n" + "=" * 70)
        print("SEED DE USUARIOS PILOTO FINALIZADO CON ÉXITO")
        print(f"Total Cuentas Estudiante: {len(all_students)} (20 universitarios + 10 escolares)")
        print(f"Total Docentes: 1 ({TEACHER_EMAIL})")
        print(f"Curso Activo: '{COURSE_NAME}' (ID: {course.id})")
        print(f"Alumnos Matriculados en Curso: {len(student_ids)}")
        print("=" * 70)

        return {
            "teacher_id": teacher.id,
            "teacher_email": teacher.email,
            "course_id": course.id,
            "total_students": len(all_students),
            "new_enrollments": new_enrollments,
        }

    except Exception as e:
        print(f"[Error Crítico] Falló la siembra de usuarios piloto: {e}")
        db.rollback()
        raise
    finally:
        if should_close_db:
            db.close()


if __name__ == "__main__":
    seed_pilot_users()
