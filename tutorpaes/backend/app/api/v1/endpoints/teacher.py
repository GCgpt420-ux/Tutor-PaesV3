from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.core.auth import get_current_user
from app.db.session import get_db
from app.db.models import User, Course, CourseEnrollment, Attempt, UserProgress, Subject, Topic, Exam
from app.schemas.teacher import CourseOut, CourseDetailOut, StudentOut, TopicPerformanceOut
from app.schemas.users import UserStatsOut

router = APIRouter(prefix="/teacher", tags=["teacher"])

def require_teacher_user(current_user: User = Depends(get_current_user)):
    if current_user.role not in ("teacher", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de profesor o administrador para esta sección",
        )
    return current_user


@router.get("/courses", response_model=List[CourseOut], dependencies=[Depends(require_teacher_user)])
def list_teacher_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/teacher/courses
    Obtiene la lista de cursos del profesor autenticado.
    """
    # Si es admin, puede ver todos los cursos. Si es profesor, solo los suyos.
    query = select(Course)
    if current_user.role != "admin":
        query = query.where(Course.teacher_id == current_user.id)
    
    courses = db.scalars(query).all()
    
    result = []
    for c in courses:
        student_count = db.scalar(
            select(func.count(CourseEnrollment.id))
            .where(CourseEnrollment.course_id == c.id)
        ) or 0
        
        result.append(
            CourseOut(
                course_id=c.id,
                name=c.name,
                student_count=student_count,
                created_at=c.created_at
            )
        )
    return result


@router.get("/courses/{course_id}", response_model=CourseDetailOut, dependencies=[Depends(require_teacher_user)])
def get_course_detail(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/teacher/courses/{course_id}
    Obtiene la lista de alumnos en el curso, con su promedio de puntaje e intentos.
    """
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curso no encontrado")
        
    # Verificar propiedad del curso
    if current_user.role != "admin" and course.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes acceso a este curso")
        
    # 1. Obtener todos los alumnos inscritos en 1 sola consulta JOIN (sin N+1)
    students = db.scalars(
        select(User)
        .join(CourseEnrollment, CourseEnrollment.student_id == User.id)
        .where(CourseEnrollment.course_id == course_id)
    ).all()
    
    if not students:
        return CourseDetailOut(course_id=course.id, name=course.name, students=[])
        
    student_ids = [s.id for s in students]
    
    # 2. Obtener estadísticas agregadas por estudiante en 1 sola consulta agrupada
    stats_rows = db.execute(
        select(
            Attempt.user_id,
            func.count(Attempt.id).label("total_attempts"),
            func.avg(Attempt.score).label("avg_score"),
            func.sum(Attempt.total_questions).label("sum_questions"),
            func.sum(Attempt.correct_count).label("sum_correct")
        )
        .where(Attempt.user_id.in_(student_ids), Attempt.status == "completed")
        .group_by(Attempt.user_id)
    ).all()
    
    stats_by_user = {
        row.user_id: {
            "total_attempts": row.total_attempts or 0,
            "avg_score": float(row.avg_score or 0.0),
            "sum_questions": row.sum_questions or 0,
            "sum_correct": row.sum_correct or 0,
        }
        for row in stats_rows
    }
    
    students_payload = []
    for student in students:
        s_stats = stats_by_user.get(student.id)
        if s_stats and s_stats["total_attempts"] > 0:
            total_attempts = s_stats["total_attempts"]
            average_score = round(s_stats["avg_score"], 1)
            total_questions = s_stats["sum_questions"]
            total_correct = s_stats["sum_correct"]
            average_accuracy = round((total_correct / total_questions) * 100, 1) if total_questions else 0.0
        else:
            total_attempts = 0
            average_score = 0.0
            average_accuracy = 0.0
            
        students_payload.append(
            StudentOut(
                student_id=student.id,
                name=student.name,
                email=student.email or "",
                total_attempts=total_attempts,
                average_score=average_score,
                average_accuracy=average_accuracy
            )
        )
        
    # Ordenar por puntaje promedio descendente
    students_payload.sort(key=lambda x: x.average_score, reverse=True)
        
    return CourseDetailOut(
        course_id=course.id,
        name=course.name,
        students=students_payload
    )


@router.get("/courses/{course_id}/performance", response_model=List[TopicPerformanceOut], dependencies=[Depends(require_teacher_user)])
def get_course_topics_performance(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/teacher/courses/{course_id}/performance
    Calcula el rendimiento promedio del curso por tópico y materia para identificar debilidades.
    """
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curso no encontrado")
        
    if current_user.role != "admin" and course.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes acceso a este curso")
        
    # Obtener IDs de estudiantes en el curso
    student_ids = db.scalars(
        select(CourseEnrollment.student_id).where(CourseEnrollment.course_id == course_id)
    ).all()
    
    if not student_ids:
        return []
        
    # Obtener el progreso de todos los estudiantes
    progress_records = db.scalars(
        select(UserProgress).where(UserProgress.user_id.in_(student_ids))
    ).all()
    
    # Agrupar por topic_id
    topic_data = {}
    for p in progress_records:
        topic_data.setdefault(p.topic_id, []).append(p)
        
    # Cargar tópicos y materias asociadas en 1 sola consulta con joinedload (sin N+1)
    topic_ids = list(topic_data.keys())
    topics = db.scalars(
        select(Topic).options(joinedload(Topic.subject)).where(Topic.id.in_(topic_ids))
    ).all()
    topics_by_id = {t.id: t for t in topics}
    
    result = []
    for topic_id, progress_list in topic_data.items():
        topic = topics_by_id.get(topic_id)
        if not topic:
            continue
            
        subject_name = topic.subject.name if topic.subject else "General"
        avg_accuracy = round(sum(p.accuracy for p in progress_list) / len(progress_list), 1)
        
        result.append(
            TopicPerformanceOut(
                topic_id=topic.id,
                topic_code=topic.code,
                topic_name=topic.name,
                subject_name=subject_name,
                average_accuracy=avg_accuracy,
                students_attempted=len(progress_list)
            )
        )
        
    # Ordenar por precisión de menor a mayor (para mostrar primero las dificultades)
    result.sort(key=lambda x: x.average_accuracy)
    
    return result


@router.get("/students/{student_id}/stats", response_model=UserStatsOut, dependencies=[Depends(require_teacher_user)])
def get_student_stats(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    GET /api/v1/teacher/students/{student_id}/stats
    Permite al profesor ver las estadísticas detalladas de un estudiante del curso.
    """
    # Verificar si el estudiante está en al menos un curso del profesor
    if current_user.role != "admin":
        is_enrolled_in_teachers_course = db.scalar(
            select(CourseEnrollment.id)
            .join(Course, Course.id == CourseEnrollment.course_id)
            .where(Course.teacher_id == current_user.id, CourseEnrollment.student_id == student_id)
        )
        if not is_enrolled_in_teachers_course:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="El estudiante no pertenece a ninguno de tus cursos")
            
    # Si la validación es correcta, reutilizar lógica de estadísticas del estudiante
    user = db.get(User, student_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estudiante no encontrado")
        
    exam = db.scalar(select(Exam).where(Exam.code == "PAES"))
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Examen PAES no configurado")
        
    subjects = db.scalars(select(Subject).where(Subject.exam_id == exam.id).order_by(Subject.id.asc())).all()
    subject_ids = [s.id for s in subjects]
    
    topic_rows = db.execute(
        select(Topic.id, Topic.code, Topic.name, Topic.subject_id)
        .where(Topic.subject_id.in_(subject_ids) if subject_ids else False)
        .order_by(Topic.id.asc())
    ).all()
    
    progress_rows = db.scalars(
        select(UserProgress).where(UserProgress.user_id == student_id)
    ).all()
    
    progress_by_topic = {p.topic_id: p for p in progress_rows}
    
    total_questions = sum(p.total_answered for p in progress_rows)
    total_correct = sum(p.total_correct for p in progress_rows)
    overall_accuracy = round((total_correct / total_questions) * 100, 2) if total_questions else 0.0
    
    topics_by_subject = {}
    for t in topic_rows:
        topics_by_subject.setdefault(t.subject_id, []).append(t)
        
    completed_subjects = 0
    subjects_payload = []
    
    for subject in subjects:
        topics_payload = []
        subject_topics = topics_by_subject.get(subject.id, [])
        subject_completed = True if subject_topics else False
        
        for topic in subject_topics:
            progress = progress_by_topic.get(topic.id)
            if progress:
                questions = progress.total_answered
                correct = progress.total_correct
                accuracy = float(progress.accuracy)
                completed_at = progress.last_activity_at
            else:
                questions = 0
                correct = 0
                accuracy = 0.0
                completed_at = None
                
            if not completed_at:
                subject_completed = False
                
            topics_payload.append(
                {
                    "topic_name": topic.name,
                    "topic_code": topic.code,
                    "accuracy": accuracy,
                    "questions": questions,
                    "correct": correct,
                    "completed_at": completed_at.isoformat() if completed_at else None,
                }
            )
            
        if subject_completed:
            completed_subjects += 1
            
        subjects_payload.append(
            {
                "subject_code": subject.code,
                "subject_name": subject.name,
                "topics": topics_payload
            }
        )
        
    return {
        "user_id": student_id,
        "total_subjects": len(subjects),
        "completed_subjects": completed_subjects,
        "overall_accuracy": overall_accuracy,
        "subjects": subjects_payload
    }
