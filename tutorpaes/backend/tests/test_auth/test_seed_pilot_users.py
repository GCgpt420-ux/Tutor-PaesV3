import pytest
from app.core.auth import verify_password
from scripts.seed_pilot_users import (
    PILOT_PASSWORD,
    TEACHER_EMAIL,
    UNIVERSITY_STUDENTS,
    SCHOOL_STUDENTS,
    COURSE_NAME,
    sync_teacher,
    sync_students,
    sync_course,
)


def test_pilot_user_definitions_match_specification():
    # 20 cuentas universitarias: alumno01@tutorpaes.cl a alumno20@tutorpaes.cl
    assert len(UNIVERSITY_STUDENTS) == 20
    for i, s in enumerate(UNIVERSITY_STUDENTS, start=1):
        expected_email = f"alumno{i:02d}@tutorpaes.cl"
        assert s["email"] == expected_email
        assert s["role"] == "student"

    # 10 cuentas escolares: escolar01@tutorpaes.cl a escolar10@tutorpaes.cl
    assert len(SCHOOL_STUDENTS) == 10
    for i, s in enumerate(SCHOOL_STUDENTS, start=1):
        expected_email = f"escolar{i:02d}@tutorpaes.cl"
        assert s["email"] == expected_email
        assert s["role"] == "student"

    # Docente
    assert TEACHER_EMAIL == "profesor.hermano@tutorpaes.cl"
    assert PILOT_PASSWORD == "paes2026"
    assert COURSE_NAME == "Curso Piloto PAES 2026"


class FakeSession:
    def __init__(self):
        self.objects = []
        self.commit_count = 0
        self.flush_count = 0

    def add(self, obj):
        if not hasattr(obj, "id") or obj.id is None:
            obj.id = len(self.objects) + 1
        self.objects.append(obj)

    def scalar(self, query):
        # Fake lookup: iterate objects and return matching if found
        return None

    def scalars(self, query):
        class Result:
            def all(self):
                return []
        return Result()

    def flush(self):
        self.flush_count += 1

    def commit(self):
        self.commit_count += 1


def test_sync_teacher_creates_teacher_account():
    db = FakeSession()
    teacher = sync_teacher(db, TEACHER_EMAIL, PILOT_PASSWORD, "Profesor Hermano")

    assert teacher.email == "profesor.hermano@tutorpaes.cl"
    assert teacher.role == "teacher"
    assert teacher.name == "Profesor Hermano"
    assert teacher.is_active is True
    assert teacher.is_admin is False
    assert verify_password("paes2026", teacher.hashed_password)


def test_sync_students_creates_student_accounts():
    db = FakeSession()
    students = sync_students(db, UNIVERSITY_STUDENTS[:3], PILOT_PASSWORD)

    assert len(students) == 3
    for s in students:
        assert s.role == "student"
        assert s.is_premium is True
        assert verify_password("paes2026", s.hashed_password)
