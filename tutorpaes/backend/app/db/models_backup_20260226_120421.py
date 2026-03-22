from __future__ import annotations
from datetime import timezone

from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    String, Integer, Boolean, DateTime, ForeignKey,
    SmallInteger, Text, UniqueConstraint, Index, Table, Column, Numeric
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Enum as SAEnum

from app.db.base import Base


# ============================================================================
# ENUMS - Definiciones de tipos seguros para columnas ENUM en PostgreSQL
# ============================================================================

AttemptStatus = SAEnum(
    "in_progress", "completed", "abandoned",
    name="attempt_status",
)

EntitlementPlan = SAEnum(
    "free", "pro", "school",
    name="entitlement_plan",
)

SessionSource = SAEnum(
    "pwa", "whatsapp", "web",
    name="session_source",
)

PaymentStatus = SAEnum(
    "pending", "authorized", "failed", "cancelled",
    name="payment_status",
)

ChatRole = SAEnum(
    "user", "assistant",
    name="chat_role",
)

AIActionType = SAEnum(
    "explanation", "hint", "chat", "feedback",
    name="ai_action_type",
)


# ============================================================================
# ASSOCIATION TABLES - Tablas de relación many-to-many
# ============================================================================

# Tabla puente: Exam <-> Question (para ensayos personalizados)
exam_questions = Table(
    "exam_questions",
    Base.metadata,
    Column("exam_id", Integer, ForeignKey("exams.id", ondelete="CASCADE"), primary_key=True),
    Column("question_id", Integer, ForeignKey("questions.id", ondelete="CASCADE"), primary_key=True),
    Index("ix_exam_questions_exam", "exam_id"),
    Index("ix_exam_questions_question", "question_id"),
)


# ============================================================================
# CORE CATALOG - Exámenes, Materias, Temas
# ============================================================================ 
class Exam(Base):
    """
    Representa un examen o ensayo. Puede ser:
    - Oficial: PAES 2024, Demre 2025
    - Personalizado: creado por el usuario mezclando preguntas
    """
    __tablename__ = "exams"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)  # ej: "PAES2024"
    name: Mapped[str] = mapped_column(String(120))
    
    # Si es True, fue creado por un usuario. Si es False, es un examen oficial.
    is_custom: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relaciones
    subjects: Mapped[List["Subject"]] = relationship(
        back_populates="exam", 
        cascade="all, delete-orphan",
        lazy="selectinload"  # Evita N+1 queries al cargar subjects con el exam
    )
    
    # Relación many-to-many con preguntas (para ensayos personalizados)
    questions: Mapped[List["Question"]] = relationship(
        secondary=exam_questions,
        back_populates="exams",
        lazy="selectinload"
    )


class Subject(Base):
    """Representa una materia dentro de un examen (ej: Matemática 1, Lenguaje)"""
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id", ondelete="CASCADE"), index=True)
    code: Mapped[str] = mapped_column(String(32), index=True)  # ej: "M1", "LENG"
    name: Mapped[str] = mapped_column(String(120))

    # Relaciones
    exam: Mapped["Exam"] = relationship(back_populates="subjects")
    topics: Mapped[List["Topic"]] = relationship(
        back_populates="subject", 
        cascade="all, delete-orphan",
        lazy="selectinload"
    )

    __table_args__ = (
        UniqueConstraint("exam_id", "code", name="uq_subject_exam_code"),
        Index("ix_subject_exam_code", "exam_id", "code"),
    )


class Topic(Base):
    """Representa un tema dentro de una materia (ej: Álgebra, Geometría)"""
    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), index=True)
    code: Mapped[str] = mapped_column(String(32), index=True)  # ej: "ALG", "GEO"
    name: Mapped[str] = mapped_column(String(120))

    # Relaciones
    subject: Mapped["Subject"] = relationship(back_populates="topics")
    questions: Mapped[List["Question"]] = relationship(
        back_populates="topic", 
        cascade="all, delete-orphan",
        lazy="selectinload"
    )

    __table_args__ = (
        UniqueConstraint("subject_id", "code", name="uq_topic_subject_code"),
        Index("ix_topic_subject_code", "subject_id", "code"),
    )


#  Users / Entitlements 
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # WhatsApp-friendly (puedes usar phone como “identifier” al inicio)
    phone: Mapped[Optional[str]] = mapped_column(String(32), unique=True, index=True, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)

    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    name: Mapped[str] = mapped_column(String(120))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    attempts: Mapped[List["Attempt"]] = relationship(back_populates="user")
    study_sessions: Mapped[List["StudySession"]] = relationship(back_populates="user")
    progress: Mapped[List["UserProgress"]] = relationship(back_populates="user")
    entitlements: Mapped[List["UserEntitlement"]] = relationship(back_populates="user")
    payments: Mapped[List["Payment"]] = relationship(back_populates="user")


class UserEntitlement(Base):
    __tablename__ = "user_entitlements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    plan: Mapped[str] = mapped_column(EntitlementPlan, default="free", index=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    meta: Mapped[dict] = mapped_column(JSONB, default=dict)

    user: Mapped["User"] = relationship(back_populates="entitlements")

    __table_args__ = (
        Index("ix_entitlements_user_active", "user_id", "is_active"),
    )


#  Questions 
class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"), index=True)

    prompt: Mapped[str] = mapped_column(Text)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reading_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 1=facil,2=medio,3=dificil
    difficulty: Mapped[int] = mapped_column(SmallInteger, default=1, index=True)

    # futuro: "mcq", "open_text", etc.
    question_type: Mapped[str] = mapped_column(String(32), default="mcq", index=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    topic: Mapped["Topic"] = relationship(back_populates="questions")
    choices: Mapped[List["QuestionChoice"]] = relationship(back_populates="question", cascade="all, delete-orphan")


class QuestionChoice(Base):
    __tablename__ = "question_choices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"), index=True)

    # "A" "B" "C" "D"
    label: Mapped[str] = mapped_column(String(1))
    text: Mapped[str] = mapped_column(Text)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)

    question: Mapped["Question"] = relationship(back_populates="choices")

    __table_args__ = (
        UniqueConstraint("question_id", "label", name="uq_choice_question_label"),
    )


#  Attempts / Feedback 
class Attempt(Base):
    __tablename__ = "attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id", ondelete="RESTRICT"), index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="RESTRICT"), index=True)
    topic_id: Mapped[Optional[int]] = mapped_column(ForeignKey("topics.id", ondelete="SET NULL"), index=True, nullable=True)

    status: Mapped[str] = mapped_column(AttemptStatus, default="in_progress", index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    total_questions: Mapped[int] = mapped_column(Integer, default=0)
    correct_count: Mapped[int] = mapped_column(Integer, default=0)
    score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # futuro: puntaje PAES u otro

    user: Mapped["User"] = relationship(back_populates="attempts")
    feedback_items: Mapped[List["AttemptFeedback"]] = relationship(back_populates="attempt", cascade="all, delete-orphan")


class AttemptFeedback(Base):
    __tablename__ = "attempt_feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    attempt_id: Mapped[int] = mapped_column(ForeignKey("attempts.id", ondelete="CASCADE"), index=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id", ondelete="RESTRICT"), index=True)

    # la alternativa elegida (si fue MCQ)
    selected_choice_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("question_choices.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # feedback “humano”/reglas (hoy)
    feedback_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # feedback IA (futuro), guardado como JSON
    ai_payload: Mapped[dict] = mapped_column(JSONB, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    attempt: Mapped["Attempt"] = relationship(back_populates="feedback_items")


#  Study sessions / Progress 
class StudySession(Base):
    __tablename__ = "study_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    source: Mapped[str] = mapped_column(SessionSource, default="pwa", index=True)

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    meta: Mapped[dict] = mapped_column(JSONB, default=dict)

    user: Mapped["User"] = relationship(back_populates="study_sessions")


class UserProgress(Base):
    __tablename__ = "user_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"), index=True)

    # métricas simples, extensibles
    accuracy: Mapped[int] = mapped_column(Integer, default=0)  # 0-100
    streak: Mapped[int] = mapped_column(Integer, default=0)

    last_activity_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship(back_populates="progress")

    __table_args__ = (
        UniqueConstraint("user_id", "topic_id", name="uq_progress_user_topic"),
    )


#  Payments (Transbank)
class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    # Transbank identifiers
    buy_order: Mapped[str] = mapped_column(String(255), unique=True, index=True)  # ID de la orden
    token_ws: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)  # Token de Transbank

    # Payment details
    amount: Mapped[int] = mapped_column(Integer)  # Monto en pesos chilenos (CLP)
    plan: Mapped[str] = mapped_column(String(32))  # "monthly" o "annual"
    status: Mapped[str] = mapped_column(PaymentStatus, default="pending", index=True)

    # Transbank response data (stored as JSON)
    transbank_response: Mapped[dict] = mapped_column(JSONB, default=dict)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    authorized_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="payments")

    __table_args__ = (
        Index("ix_payments_user_status", "user_id", "status"),
    )
