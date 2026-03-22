from datetime import timezone
"""
JWT Authentication Module

Maneja la creación y validación de tokens JWT para autenticación.
Se utiliza HS256 con expiración de 24 horas.
Incluye encriptación y verificación de contraseñas con Bcrypt.
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError, ExpiredSignatureError
from fastapi import Depends, HTTPException, status, Header, Cookie
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from passlib.context import CryptContext

from app.core.config import settings
from app.db.session import get_db
from app.db.models import User
from sqlalchemy import select

# ---------------------------------------------------------
# CONFIGURACIÓN DEL MOTOR CRIPTOGRÁFICO (Bcrypt)
# ---------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si una contraseña en texto plano coincide con su hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Toma una contraseña en texto plano y retorna su hash encriptado."""
    return pwd_context.hash(password)

# ---------------------------------------------------------
# MANEJO DE TOKENS JWT
# ---------------------------------------------------------

def _create_token(user_id: int, expires_delta: timedelta, token_type: str) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + expires_delta,
        "iat": datetime.now(timezone.utc),
        "type": token_type,
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def create_access_token(user_id: int) -> str:
    """
    Crea un token JWT con expiración de 24 horas.
    
    Args:
        user_id: ID del usuario
        
    Returns:
        Token JWT como string
    """
    return _create_token(
        user_id=user_id,
        expires_delta=timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS),
        token_type="access",
    )


def create_refresh_token(user_id: int) -> str:
    return _create_token(
        user_id=user_id,
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        token_type="refresh",
    )


def create_reset_password_token(user_id: int) -> str:
    """Crea un token JWT corto (30 min) para recuperación de contraseña."""
    return _create_token(
        user_id=user_id,
        expires_delta=timedelta(minutes=30),
        token_type="reset_password",
    )


def decode_token(token: str, expected_type: str = "access") -> Optional[int]:
    """
    Decodifica y valida un token JWT.
    
    Args:
        token: Token JWT
        
    Returns:
        user_id si es válido, None si no lo es
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        if payload.get("type") != expected_type:
            return None

        user_id: int = int(payload.get("sub"))
        return user_id
    except (ExpiredSignatureError, JWTError, ValueError, TypeError):
        return None


def get_current_user(
    authorization: str = Header(None),
    access_token: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependencia que valida el token JWT y retorna el usuario.
    
    Args:
        authorization: Header Authorization: "Bearer <token>"
        db: Sesión de base de datos
        
    Returns:
        Usuario autenticado
        
    Raises:
        HTTPException 401: Token inválido o expirado
    """
    token = None

    if authorization:
        try:
            scheme, token = authorization.split(" ")
            if scheme.lower() != "bearer":
                raise ValueError()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Formato de Authorization inválido. Use: Bearer <token>",
                headers={"WWW-Authenticate": "Bearer"},
            )

    if not token and access_token:
        token = access_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no proporcionado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = decode_token(token)
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Obtener usuario de la base de datos
    try:
        user = db.scalar(select(User).where(User.id == user_id))
    except OperationalError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Base de datos no disponible. Intenta de nuevo en unos momentos."
        )
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


def require_admin_user(
    user: User = Depends(get_current_user),
) -> User:
    """Guard de admin basado en el estado persistido (is_admin) del usuario."""

    if not getattr(user, "is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "forbidden",
                "detail": "Requiere permisos de administrador",
                "code": "ADMIN_REQUIRED",
            },
        )
    return user