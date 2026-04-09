"""Fix scalability: partial unique index on attempts + pool settings noted

Revision ID: c7e2a1f3b8d9
Revises: f37af5091e6a
Create Date: 2026-03-30 00:00:00

Changes:
  - Partial unique index on attempts(user_id, exam_id, subject_id, topic_id)
    WHERE status = 'in_progress' to prevent race condition creating duplicate
    in-progress attempts concurrently.
  - DB pool settings are applied at engine level (no schema change needed).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c7e2a1f3b8d9'
down_revision: Union[str, Sequence[str], None] = 'f37af5091e6a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Partial unique index: solo un attempt in_progress por usuario/topic.
    # Previene la race condition de crear dos attempts simultáneos.
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS uq_attempts_one_active_per_user_topic
        ON attempts (user_id, exam_id, subject_id, topic_id)
        WHERE status = 'in_progress'
        """
    )
    # Nota: ix_revoked_tokens_expires se crea en a1b2c3d4e5f6_add_revoked_tokens_blacklist.
    # No se duplica aquí para evitar error de dependencia de orden entre ramas paralelas.


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_attempts_one_active_per_user_topic")
