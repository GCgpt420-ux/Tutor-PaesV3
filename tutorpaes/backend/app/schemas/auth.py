from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
import re

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
