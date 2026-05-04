"""
Endpoints de autenticación - Grado Producción
Maneja el registro seguro de usuarios y la validación de contraseñas mediante Bcrypt.
"""

from typing import Optional
import re
from pydantic import BaseModel, EmailStr, field_validator
from fastapi import APIRouter, Depends, HTTPException, status, Cookie, Request, Header
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import OperationalError

from app.db.session import get_db
from app.db.models import User
from app.core.config import settings
from app.core.auth import (
    create_access_token, 
    create_refresh_token,
    decode_token,
    get_current_user, 
    get_password_hash, 
    verify_password,
    is_token_revoked,
    revoke_token,
)
from app.core.rate_limiter import limiter

router = APIRouter(prefix="/auth", tags=["auth"])


COMMON_WEAK_PASSWORDS = {
    "password",
    "password123",
    "qwerty",
    "qwerty123",
    "admin123",
    "12345678",
    "123456789",
}


def validate_password_strength(password: str) -> str:
    if len(password) < 8:
        raise ValueError("La contraseña debe tener al menos 8 caracteres")
    if len(password) > 14:
        raise ValueError("La contraseña debe tener como máximo 14 caracteres")
    if not re.search(r"[A-Z]", password):
        raise ValueError("La contraseña debe incluir al menos una letra mayúscula")
    if not re.search(r"[a-z]", password):
        raise ValueError("La contraseña debe incluir al menos una letra minúscula")
    if not re.search(r"\d", password):
        raise ValueError("La contraseña debe incluir al menos un número")
    if not re.search(r"[^A-Za-z0-9]", password):
        raise ValueError("La contraseña debe incluir al menos un carácter especial")

    normalized = password.lower()
    if normalized in COMMON_WEAK_PASSWORDS:
        raise ValueError("La contraseña es demasiado común")
    if any(pattern in normalized for pattern in ("12345", "qwerty", "abcdef", "password")):
        raise ValueError("La contraseña no puede contener secuencias triviales")
    if len(set(password)) < 6:
        raise ValueError("La contraseña debe contener más variedad de caracteres")

    return password

# -------------------------------------------------------------------
# 1. MODELOS PYDANTIC (Entrada y Salida documentada para Next.js)
# -------------------------------------------------------------------

class UserRegisterIn(BaseModel):
    email: EmailStr
    name: str
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str):
        return validate_password_strength(value)

class UserLoginIn(BaseModel):
    email: EmailStr
    password: str

class AuthTokenOut(BaseModel):
    access_token: str
    refresh_token: str
    user_id: int
    email: str
    name: str
    is_admin: bool

class UserMeOut(BaseModel):
    user_id: int
    email: str
    name: str
    is_admin: bool
    age: Optional[int] = None
    academic_level: Optional[str] = None
    target_university: Optional[str] = None
    target_degree: Optional[str] = None
    target_score: Optional[int] = None

class UserMeUpdateIn(BaseModel):
    name: str
    email: str
    age: Optional[int] = None
    academic_level: Optional[str] = None
    target_university: Optional[str] = None
    target_degree: Optional[str] = None
    target_score: Optional[int] = None

class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class ChangePasswordOut(BaseModel):
    message: str

class ForgotPasswordIn(BaseModel):
    email: EmailStr

class ResetPasswordIn(BaseModel):
    token: str
    new_password: str
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, value: str):
        return validate_password_strength(value)
# -------------------------------------------------------------------
# 2. ENDPOINTS (El flujo real de autenticación)
# -------------------------------------------------------------------

@router.post("/register", response_model=AuthTokenOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
def register(request: Request, payload: UserRegisterIn, db: Session = Depends(get_db)):
    """Registra un nuevo usuario encriptando su contraseña."""
    email_clean = payload.email.strip().lower()
    
    try:
        # 1. Verificar si el correo ya existe
        existing_user = db.scalar(select(User).where(User.email == email_clean))
    except OperationalError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Base de datos no disponible. Intenta de nuevo en unos momentos."
        )
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya está registrado."
        )
    
    # 2. Encriptar la contraseña (¡Magia de Bcrypt!)
    hashed_pwd = get_password_hash(payload.password)
    
    # 3. Guardar el usuario en la BD
    new_user = User(
        email=email_clean,
        name=payload.name.strip(),
        hashed_password=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 4. Generar token para que entre directamente
    token = create_access_token(new_user.id)
    
    return {
        "access_token": token,
        "refresh_token": create_refresh_token(new_user.id),
        "user_id": new_user.id,
        "email": new_user.email,
        "name": new_user.name,
        "is_admin": new_user.is_admin
    }


@router.post("/login", response_model=AuthTokenOut)
@limiter.limit("20/minute")
def login(request: Request, payload: UserLoginIn, db: Session = Depends(get_db)):
    """Inicia sesión validando el correo y la contraseña."""
    email_clean = payload.email.strip().lower()
    
    try:
        # 1. Buscar al usuario por correo
        user = db.scalar(select(User).where(User.email == email_clean))
    except OperationalError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Base de datos no disponible. Intenta de nuevo en unos momentos."
        )
    
    # 2. Verificar que el usuario exista y tenga contraseña
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas."
        )
        
    # 3. Verificar si la contraseña coincide con el hash
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas."
        )
        
    # 4. Generar token de acceso
    token = create_access_token(user.id)
    
    return {
        "access_token": token,
        "refresh_token": create_refresh_token(user.id),
        "user_id": user.id,
        "email": user.email,
        "name": user.name,
        "is_admin": user.is_admin
    }


@router.post("/refresh", response_model=AuthTokenOut)
@limiter.limit("30/minute")
def refresh_session(
    request: Request,
    refresh_token: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token no proporcionado",
        )

    user_id = decode_token(refresh_token, expected_type="refresh")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido o expirado",
        )

    if is_token_revoked(user_id["jti"], db):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión revocada. Por favor inicia sesión de nuevo.",
        )

    try:
        user = db.scalar(select(User).where(User.id == user_id["user_id"], User.is_active == True))
    except OperationalError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Base de datos no disponible. Intenta de nuevo en unos momentos.",
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )

    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "user_id": user.id,
        "email": user.email,
        "name": user.name,
        "is_admin": user.is_admin,
    }


@router.post("/logout", status_code=204)
@limiter.limit("20/minute")
def logout(
    request: Request,
    authorization: str = Header(None),
    access_token: Optional[str] = Cookie(default=None),
    refresh_token: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db),
):
    """
    Invalida el access_token y refresh_token del usuario.
    Ambos JTIs se escriben en la blacklist revoked_tokens.
    El frontend debe borrar sus cookies después de llamar este endpoint.
    """
    raw_access = None
    if authorization:
        try:
            scheme, raw_access = authorization.split(" ")
            if scheme.lower() != "bearer":
                raw_access = None
        except ValueError:
            pass
    if not raw_access:
        raw_access = access_token

    if raw_access:
        token_data = decode_token(raw_access, expected_type="access")
        if token_data and token_data.get("jti"):
            revoke_token(token_data["jti"], token_data["exp"], db)

    if refresh_token:
        refresh_data = decode_token(refresh_token, expected_type="refresh")
        if refresh_data and refresh_data.get("jti"):
            revoke_token(refresh_data["jti"], refresh_data["exp"], db)


@router.get("/me", response_model=UserMeOut)
def me(current_user: User = Depends(get_current_user)):
    """Retorna datos del usuario actual para rehidratar la sesión del frontend."""
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "is_admin": current_user.is_admin,
        "age": current_user.age,
        "academic_level": current_user.academic_level,
        "target_university": current_user.target_university,
        "target_degree": current_user.target_degree,
        "target_score": current_user.target_score,
    }


@router.put("/me", response_model=UserMeOut)
def update_me(
    request: UserMeUpdateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Actualiza los datos del perfil del usuario actual."""
    # Actualizar campos del perfil
    current_user.name = request.name.strip()
    
    # Actualizar email si cambió
    new_email = request.email.strip().lower()
    if new_email != current_user.email:
        # Verificar que el nuevo email no exista
        existing = db.scalar(select(User).where(User.email == new_email, User.id != current_user.id))
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo ya está en uso por otro usuario"
            )
        current_user.email = new_email
    
    # Actualizar campos opcionales del perfil académico
    current_user.age = request.age
    current_user.academic_level = request.academic_level
    current_user.target_university = request.target_university
    current_user.target_degree = request.target_degree
    current_user.target_score = request.target_score
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "is_admin": current_user.is_admin,
        "age": current_user.age,
        "academic_level": current_user.academic_level,
        "target_university": current_user.target_university,
        "target_degree": current_user.target_degree,
        "target_score": current_user.target_score,
    }


@router.post("/change-password", response_model=ChangePasswordOut)
@limiter.limit("10/minute")
def change_password(
    request: Request,
    payload: ChangePasswordIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permite al usuario cambiar su contraseña."""
    
    # Validar que las nuevas contraseñas coincidan
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las nuevas contraseñas no coinciden"
        )
    
    # Validar que la nueva contraseña es diferente
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe ser diferente a la actual"
        )
    
    # Validar política de seguridad para la nueva contraseña
    try:
        validate_password_strength(payload.new_password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    
    # Verificar contraseña actual
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña actual incorrecta"
        )
    
    # Actualizar contraseña
    current_user.hashed_password = get_password_hash(payload.new_password)
    db.add(current_user)
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}


@router.post("/forgot-password")
@limiter.limit("5/minute")
async def forgot_password(request: Request, payload: ForgotPasswordIn, db: Session = Depends(get_db)):
    """Envía un token de recuperación al correo (vía EmailService)."""
    email_clean = payload.email.strip().lower()
    
    try:
        user = db.scalar(select(User).where(User.email == email_clean))
    except OperationalError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Error de conexión."
        )

    if not user:
        # Por seguridad no revelamos que no existe, pero respondemos ok
        return {"message": "Si tu correo existe, recibirás un enlace de recuperación."}

    from app.core.auth import create_reset_password_token
    from app.services.email import send_reset_password_email
    import logging
    
    logger = logging.getLogger(__name__)
    reset_token = create_reset_password_token(user.id)
    
    reset_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/auth/update-password?token={reset_token}"
    
    # Despachar el email de forma asíncrona
    await send_reset_password_email(email_clean, reset_url)
    
    logger.info(f"Triggered password reset email for user {user.id}")

    return {"message": "Si tu correo existe, recibirás un enlace de recuperación."}


@router.post("/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, payload: ResetPasswordIn, db: Session = Depends(get_db)):
    """Cambia la contraseña utilizando el token JWT temporal."""
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las nuevas contraseñas no coinciden."
        )

    token_data = decode_token(payload.token, expected_type="reset_password")
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace de recuperación es inválido o ha expirado (30 min)."
        )

    user = db.scalar(select(User).where(User.id == token_data["user_id"]))
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    user.hashed_password = get_password_hash(payload.new_password)
    db.add(user)
    db.commit()

    return {"message": "Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión."}