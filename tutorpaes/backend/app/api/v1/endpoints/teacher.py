from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

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
        
    # Obtener inscripciones
    enrollments = db.scalars(
        select(CourseEnrollment).where(CourseEnrollment.course_id == course_id)
    ).all()
    
    students_payload = []
    for enroll in enrollments:
        student = db.get(User, enroll.student_id)
        if not student:
            continue
            
        # Calcular estadísticas agregadas
        attempts = db.scalars(
            select(Attempt).where(Attempt.user_id == student.id, Attempt.status == "completed")
        ).all()
        
        total_attempts = len(attempts)
        average_score = 0.0
        average_accuracy = 0.0
        
        if total_attempts > 0:
            average_score = round(sum(a.score or 0 for a in attempts) / total_attempts, 1)
            # Calcular precisión promedio
            total_questions = sum(a.total_questions or 0 for a in attempts)
            total_correct = sum(a.correct_count or 0 for a in attempts)
            average_accuracy = round((total_correct / total_questions) * 100, 1) if total_questions else 0.0
            
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
        
    # Armar lista de resultados
    result = []
    for topic_id, progress_list in topic_data.items():
        topic = db.get(Topic, topic_id)
        if not topic:
            continue
            
        subject = db.get(Subject, topic.subject_id)
        subject_name = subject.name if subject else "General"
        
        # Promediar precisión
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
