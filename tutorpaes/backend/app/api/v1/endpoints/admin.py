from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.auth import require_admin_user
from app.db.models import Attempt, AttemptFeedback, User, UserProgress
from app.db.session import get_db
from app.schemas.admin import (
    AdminUserOut,
    AdminUserUpdateIn,
    PilotAuditResponse,
    PilotAuditSummary,
    PilotUserAuditOut,
)

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin_user)])


@router.get("/users", response_model=List[AdminUserOut])
def list_users(
    search: Optional[str] = Query(None, description="Buscar por email o nombre"),
    role: Optional[str] = Query(None, description="Filtrar por rol"),
    is_active: Optional[bool] = Query(None, description="Filtrar por estado"),
    db: Session = Depends(get_db),
):
    query = select(User)

    if search:
        search_like = f"%{search.strip().lower()}%"
        query = query.where(
            or_(
                User.email.ilike(search_like),
                User.name.ilike(search_like),
            )
        )

    if role:
        if role == "admin":
            query = query.where(or_(User.is_admin == True, User.role == "admin"))  # noqa: E712
        else:
            query = query.where(User.role == role)

    if is_active is not None:
        query = query.where(User.is_active == is_active)

    users = db.scalars(query.order_by(User.created_at.desc())).all()

    return [
        {
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "role": u.role,
            "is_admin": u.is_admin,
            "is_active": u.is_active,
        }
        for u in users
    ]


@router.patch("/users/{user_id}", response_model=AdminUserOut)
def update_user(
    user_id: int,
    payload: AdminUserUpdateIn,
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    # Mantener is_admin y role SIEMPRE sincronizados para evitar estado inconsistente.
    # Regla única: is_admin == True <=> role == "admin".
    if payload.role is not None:
        user.role = payload.role
        user.is_admin = payload.role == "admin"

    if payload.is_admin is not None:
        user.is_admin = payload.is_admin
        user.role = "admin" if payload.is_admin else (payload.role or "student")

    if payload.is_active is not None:
        user.is_active = payload.is_active

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "is_admin": user.is_admin,
        "is_active": user.is_active,
    }


def _classify_cohort(email: Optional[str], role: str) -> str:
    if not email:
        return "Sin Email"
    e = email.lower().strip()
    if role == "admin" or e in {"demo@example.com", "g.cuevas@gmail.com"}:
        return "Administrador"
    if role == "teacher" or "profesor" in e:
        return "Profesor"
    if e.startswith("alumno0"):
        return "Egresado DEMRE 2026"
    if e.startswith("escolar"):
        return "Escolar Piloto"
    if any(e == f"alumno{i}@tutorpaes.cl" for i in range(1, 21)):
        return "Escolar Cohorte 1"
    if e == "estudiante@example.com":
        return "Estudiante Demo"
    return "Estudiante General"


@router.get("/pilot-audit", response_model=PilotAuditResponse)
@router.get("/users/audit", response_model=PilotAuditResponse)
def get_pilot_users_audit(db: Session = Depends(get_db)):
    """
    GET /api/v1/admin/pilot-audit
    GET /api/v1/admin/users/audit

    Audita y reporta el estado de todos los usuarios registrados para el piloto PAES:
    ID, Email, Rol, Nombre, Status Activo, Intentos Completados y Preguntas Respondidas.
    """
    users = db.query(User).order_by(User.id).all()
    user_records = []
    by_cohort: dict[str, int] = {}
    total_completed = 0
    total_questions = 0

    for u in users:
        cohort = _classify_cohort(u.email, u.role)
        by_cohort[cohort] = by_cohort.get(cohort, 0) + 1

        completed_att = (
            db.query(func.count(Attempt.id))
            .filter(Attempt.user_id == u.id, Attempt.completed_at.isnot(None))
            .scalar()
            or 0
        )
        total_att = (
            db.query(func.count(Attempt.id))
            .filter(Attempt.user_id == u.id)
            .scalar()
            or 0
        )
        attempt_q = (
            db.query(func.sum(Attempt.total_questions))
            .filter(Attempt.user_id == u.id)
            .scalar()
            or 0
        )
        prog_q = (
            db.query(func.sum(UserProgress.total_answered))
            .filter(UserProgress.user_id == u.id)
            .scalar()
            or 0
        )
        fb_q = (
            db.query(func.count(AttemptFeedback.id))
            .join(Attempt, Attempt.id == AttemptFeedback.attempt_id)
            .filter(Attempt.user_id == u.id)
            .scalar()
            or 0
        )
        q_ans = max(attempt_q, prog_q, fb_q)
        total_completed += completed_att
        total_questions += q_ans

        user_records.append(
            PilotUserAuditOut(
                id=u.id,
                email=u.email or "N/A",
                name=u.name,
                role=u.role,
                is_admin=u.is_admin,
                is_active=u.is_active,
                cohort=cohort,
                completed_attempts=completed_att,
                total_attempts=total_att,
                questions_answered=q_ans,
            )
        )

    return PilotAuditResponse(
        summary=PilotAuditSummary(
            total_users=len(users),
            active_users=sum(1 for u in user_records if u.is_active),
            by_cohort=by_cohort,
            total_completed_attempts=total_completed,
            total_questions_answered=total_questions,
        ),
        users=user_records,
    )

