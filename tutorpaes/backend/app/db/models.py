"""
SQLAlchemy Models - TutorPAES Production Schema
================================================
Modelos actualizados para escalar de 10 a 50,000 usuarios.
Incluye todas las tablas necesarias del antiguo esquema de Supabase.

NOTA IMPORTANTE: Se mantienen las PKs como Integer por compatibilidad con migraciones existentes.
En un despliegue completamente nuevo, se recomienda usar UUID como PK para mejor distribución.
"""
from __future__ import annotations
from datetime import timezone

from datetime import datetime
from typing import Optional, List
from decimal import Decimal

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
        lazy="selectin"  # Evita N+1 queries al cargar subjects con el exam
    )
    
    attempts: Mapped[List["Attempt"]] = relationship(
        back_populates="exam",
        cascade="all, delete-orphan"
    )
    
    # Relación many-to-many con preguntas (para ensayos personalizados)
    questions: Mapped[List["Question"]] = relationship(
        secondary=exam_questions,
        back_populates="exams",
        lazy="selectin"
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
        lazy="selectin"
    )
    attempts: Mapped[List["Attempt"]] = relationship(
        back_populates="subject",
        cascade="all, delete-orphan"
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
        lazy="selectin"
    )
    attempts: Mapped[List["Attempt"]] = relationship(
        back_populates="topic",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("subject_id", "code", name="uq_topic_subject_code"),
        Index("ix_topic_subject_code", "subject_id", "code"),
    )


# ============================================================================
# USERS & PROFILES - Usuarios, perfiles y datos académicos
# ============================================================================

class User(Base):
    """
    Usuario del sistema con perfil académico completo.
    Soporta autenticación por email/password o WhatsApp (phone).
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # Identificadores (al menos uno debe estar presente)
    phone: Mapped[Optional[str]] = mapped_column(String(32), unique=True, index=True, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Información básica
    name: Mapped[str] = mapped_column(String(120))
    avatar_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    
    # Perfil académico (para dashboard "Mi Progreso")
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    academic_level: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  # ej: "4to medio"
    target_university: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    target_degree: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)  # ej: "Ingeniería"
    target_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Puntaje PAES objetivo
    
    # Roles y estado
    role: Mapped[str] = mapped_column(String(32), default="student")  # student, teacher, admin
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relaciones
    # lazy="select" (default): carga bajo demanda. NO usar selectin aquí porque
    # get_current_user() corre en cada request y selectin cargaría TODOS los attempts
    # del usuario en memoria, lo que es costoso para usuarios activos.
    attempts: Mapped[List["Attempt"]] = relationship(back_populates="user", lazy="select")
    study_sessions: Mapped[List["StudySession"]] = relationship(back_populates="user")
    progress: Mapped[List["UserProgress"]] = relationship(back_populates="user")
    entitlements: Mapped[List["UserEntitlement"]] = relationship(back_populates="user")
    payments: Mapped[List["Payment"]] = relationship(back_populates="user")
    invoices: Mapped[List["Invoice"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    chat_messages: Mapped[List["ChatMessage"]] = relationship(back_populates="user")
    ai_usage_logs: Mapped[List["AIUsageLog"]] = relationship(back_populates="user")

    __table_args__ = (
        Index("ix_users_email_active", "email", "is_active"),
        Index("ix_users_premium", "is_premium"),
        Index("ix_users_role", "role"),
    )


class UserEntitlement(Base):
    """Control de planes y suscripciones del usuario"""
    __tablename__ = "user_entitlements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    plan: Mapped[str] = mapped_column(EntitlementPlan, default="free", index=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    meta: Mapped[dict] = mapped_column(JSONB, default=dict)

    user: Mapped["User"] = relationship(back_populates="entitlements")

    __table_args__ = (
        Index("ix_entitlements_user_active", "user_id", "is_active"),
    )


# ============================================================================
# QUESTIONS & ANSWERS - Preguntas, alternativas, respuestas
# ============================================================================

class Question(Base):
    """Pregunta de examen con texto opcional de lectura e imagen"""
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"), index=True)

    prompt: Mapped[str] = mapped_column(Text)  # Enunciado de la pregunta
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Explicación pedagógica
    reading_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Texto de lectura comprensiva
    image_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)  # URL a gráfico/imagen
    
    # 1=fácil, 2=medio, 3=difícil
    difficulty: Mapped[int] = mapped_column(SmallInteger, default=1)
    
    # "mcq" (multiple choice), "open_text", etc.
    question_type: Mapped[str] = mapped_column(String(32), default="mcq", index=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relaciones
    topic: Mapped["Topic"] = relationship(back_populates="questions")
    choices: Mapped[List["QuestionChoice"]] = relationship(
        back_populates="question", 
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    exams: Mapped[List["Exam"]] = relationship(
        secondary=exam_questions,
        back_populates="questions"
    )

    __table_args__ = (
        Index("ix_questions_topic_active", "topic_id", "is_active"),
        Index("ix_questions_difficulty", "difficulty"),
    )


class QuestionChoice(Base):
    """Alternativa de una pregunta de selección múltiple"""
    __tablename__ = "question_choices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"), index=True)

    label: Mapped[str] = mapped_column(String(1))  # "A", "B", "C", "D"
    text: Mapped[str] = mapped_column(Text)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)

    question: Mapped["Question"] = relationship(back_populates="choices")

    __table_args__ = (
        UniqueConstraint("question_id", "label", name="uq_choice_question_label"),
    )


# ============================================================================
# EXAM ATTEMPTS - Intentos de ensayo y feedback
# ============================================================================

class Attempt(Base):
    """Intento de examen o ensayo por un usuario"""
    __tablename__ = "attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id", ondelete="RESTRICT"), index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="RESTRICT"), index=True)
    topic_id: Mapped[Optional[int]] = mapped_column(ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)

    status: Mapped[str] = mapped_column(AttemptStatus, default="in_progress", index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    total_questions: Mapped[int] = mapped_column(Integer, default=0)
    correct_count: Mapped[int] = mapped_column(Integer, default=0)
    incorrect_count: Mapped[int] = mapped_column(Integer, default=0)
    omitted_count: Mapped[int] = mapped_column(Integer, default=0)
    score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Puntaje PAES u otro

    # Relaciones
    user: Mapped["User"] = relationship(back_populates="attempts")
    exam: Mapped["Exam"] = relationship(back_populates="attempts")
    subject: Mapped["Subject"] = relationship(back_populates="attempts")
    topic: Mapped[Optional["Topic"]] = relationship(back_populates="attempts")
    feedback_items: Mapped[List["AttemptFeedback"]] = relationship(
        back_populates="attempt", 
        cascade="all, delete-orphan"
    )
    chat_messages: Mapped[List["ChatMessage"]] = relationship(
        back_populates="attempt", 
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_attempts_user_status", "user_id", "status"),
        Index("ix_attempts_user_completed", "user_id", "completed_at"),
        # Partial unique index: solo un intento in_progress por usuario/exam/subject/topic.
        # Previene la race condition de crear dos attempts simultáneos.
        # NOTA: Requiere migración de Alembic para aplicarse en la DB.
        Index(
            "uq_attempts_one_active_per_user_topic",
            "user_id", "exam_id", "subject_id", "topic_id",
            unique=True,
            postgresql_where="status = 'in_progress'",
        ),
    )


class AttemptFeedback(Base):
    """Feedback individual por pregunta dentro de un intento"""
    __tablename__ = "attempt_feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    attempt_id: Mapped[int] = mapped_column(ForeignKey("attempts.id", ondelete="CASCADE"), index=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id", ondelete="RESTRICT"), index=True)

    # Alternativa elegida (si fue MCQ)
    selected_choice_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("question_choices.id", ondelete="SET NULL"),
        nullable=True,
    )

    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    time_spent_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Feedback "humano" / reglas
    feedback_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Feedback IA (guardado como JSON)
    ai_payload: Mapped[dict] = mapped_column(JSONB, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    attempt: Mapped["Attempt"] = relationship(back_populates="feedback_items")

    __table_args__ = (
        Index("ix_feedback_attempt_question", "attempt_id", "question_id"),
    )


# ============================================================================
# AI FEATURES - Chat, explicaciones y auditoría de uso
# ============================================================================

class ChatMessage(Base):
    """
    Mensajes del chat conversacional con el Tutor IA durante un ensayo.
    Permite que los alumnos hagan preguntas contextuales mientras resuelven.
    """
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    attempt_id: Mapped[int] = mapped_column(ForeignKey("attempts.id", ondelete="CASCADE"), index=True)

    role: Mapped[str] = mapped_column(ChatRole)  # "user" o "assistant"
    content: Mapped[str] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relaciones
    user: Mapped["User"] = relationship(back_populates="chat_messages")
    attempt: Mapped["Attempt"] = relationship(back_populates="chat_messages")

    __table_args__ = (
        Index("ix_chat_attempt_created", "attempt_id", "created_at"),
    )


class AIUsageLog(Base):
    """
    Registro de uso de funciones IA (explicaciones, chat, hints).
    Esencial para auditar costos de OpenAI y controlar límites por usuario.
    """
    __tablename__ = "ai_usage_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    action_type: Mapped[str] = mapped_column(AIActionType, index=True)  # explanation, hint, chat, feedback
    model: Mapped[str] = mapped_column(String(64))  # ej: "gpt-4o-mini", "gpt-4"
    
    # Métricas de OpenAI
    prompt_tokens: Mapped[int] = mapped_column(Integer)
    completion_tokens: Mapped[int] = mapped_column(Integer)
    total_cost: Mapped[Decimal] = mapped_column(Numeric(precision=10, scale=6))  # USD con 6 decimales
    latency_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relaciones
    user: Mapped["User"] = relationship(back_populates="ai_usage_logs")

    __table_args__ = (
        Index("ix_ai_logs_user_date", "user_id", "created_at"),
        Index("ix_ai_logs_action", "action_type"),
    )


class QuestionExplanation(Base):
    """
    Cache de explicaciones por pregunta y alternativa incorrecta.
    Se usa para el boton de Feedback Rapido.
    """
    __tablename__ = "question_explanations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"),
        index=True,
    )
    wrong_option: Mapped[str] = mapped_column(String(1), index=True)
    explanation_text: Mapped[str] = mapped_column(Text)
    times_used: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("question_id", "wrong_option", name="uq_explanation_question_option"),
        Index("ix_explanations_question_option", "question_id", "wrong_option"),
    )


# ============================================================================
# STUDY TRACKING - Sesiones y progreso por tema
# ============================================================================

class StudySession(Base):
    """Sesión de estudio del usuario (PWA, WhatsApp, Web)"""
    __tablename__ = "study_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    source: Mapped[str] = mapped_column(SessionSource, default="pwa", index=True)

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    meta: Mapped[dict] = mapped_column(JSONB, default=dict)

    user: Mapped["User"] = relationship(back_populates="study_sessions")

    __table_args__ = (
        Index("ix_sessions_user_started", "user_id", "started_at"),
    )


class UserProgress(Base):
    """
    Progreso acumulado del usuario por tema.
    Para el dashboard "Mi Progreso" - muestra accuracy, streak, última actividad.
    """
    __tablename__ = "user_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"), index=True)

    # Métricas acumuladas
    accuracy: Mapped[int] = mapped_column(Integer, default=0)  # 0-100
    streak: Mapped[int] = mapped_column(Integer, default=0)  # días consecutivos practicando
    total_answered: Mapped[int] = mapped_column(Integer, default=0)
    total_correct: Mapped[int] = mapped_column(Integer, default=0)

    last_activity_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship(back_populates="progress")

    __table_args__ = (
        UniqueConstraint("user_id", "topic_id", name="uq_progress_user_topic"),
        Index("ix_progress_user_activity", "user_id", "last_activity_at"),
    )


# ============================================================================
# PAYMENTS & SUBSCRIPTIONS - Transbank integration
# ============================================================================

class Payment(Base):
    """
    Registro de pagos a través de Transbank Webpay Plus.
    Incluye todos los datos necesarios para confirmar y auditar transacciones.
    """
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    # Transbank identifiers
    buy_order: Mapped[str] = mapped_column(String(255), unique=True, index=True)  # ID único de orden
    token_ws: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)  # Token Transbank

    # Payment details
    amount: Mapped[int] = mapped_column(Integer)  # Monto en pesos chilenos (CLP)
    plan: Mapped[str] = mapped_column(String(32))  # "monthly", "annual"
    status: Mapped[str] = mapped_column(PaymentStatus, default="pending", index=True)

    # Transbank response (almacenado como JSON)
    transbank_response: Mapped[dict] = mapped_column(JSONB, default=dict)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )
    authorized_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="payments")
    invoice: Mapped[Optional["Invoice"]] = relationship(back_populates="payment", uselist=False)

    __table_args__ = (
        Index("ix_payments_user_status", "user_id", "status"),
        Index("ix_payments_created", "created_at"),
    )


class Invoice(Base):
    """
    Boleta/Factura generada automáticamente cuando un pago es autorizado.
    Contiene toda la información tributaria requerida en Chile (PAES o SII).
    """
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    payment_id: Mapped[int] = mapped_column(ForeignKey("payments.id", ondelete="CASCADE"), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    # Invoice identifiers
    invoice_number: Mapped[str] = mapped_column(String(32), unique=True, index=True)  # Número secuencial
    folio: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Folio PAES (si aplica)

    # Amount breakdown
    subtotal: Mapped[int] = mapped_column(Integer)  # Monto antes de IVA (centavos)
    iva_amount: Mapped[int] = mapped_column(Integer, default=0)  # IVA 19% (si aplica en Chile)
    total_amount: Mapped[int] = mapped_column(Integer)  # Total incluyendo IVA

    # Dates
    issue_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))  # Fecha de vencimiento
    
    # Invoice state
    status: Mapped[str] = mapped_column(String(32), default="issued", index=True)  # issued, paid, cancelled
    
    # Document storage
    pdf_file_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)  # URL del PDF generado
    pdf_file_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)  # Ruta local relativa
    
    # IVA & Tax info (for audit)
    tax_info: Mapped[dict] = mapped_column(JSONB, default=dict)  # {"iva_rate": 0.19, "tax_id": "..."}

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    payment: Mapped["Payment"] = relationship(back_populates="invoice")
    user: Mapped["User"] = relationship(back_populates="invoices")

    __table_args__ = (
        Index("ix_invoices_user_status", "user_id", "status"),
        Index("ix_invoices_created", "created_at"),
        Index("ix_invoices_payment", "payment_id"),
    )


class RevokedToken(Base):
    """
    Blacklist de JTIs (JWT IDs) revocados.

    Cuando un usuario hace logout, el jti de su access_token y refresh_token
    se almacena aquí. get_current_user rechaza cualquier token cuyo jti esté presente.
    Un job periódico o trigger puede limpiar filas con expires_at < NOW().
    """
    __tablename__ = "revoked_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    jti: Mapped[str] = mapped_column(String(36), nullable=False, unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_revoked_tokens_expires", "expires_at"),
    )
