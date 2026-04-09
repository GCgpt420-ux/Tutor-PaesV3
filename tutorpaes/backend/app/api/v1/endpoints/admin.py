from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.auth import require_admin_user
from app.db.models import User
from app.db.session import get_db

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin_user)])


class AdminUserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_admin: bool
    is_active: bool


class AdminUserUpdateIn(BaseModel):
    role: Optional[str] = None
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None


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
