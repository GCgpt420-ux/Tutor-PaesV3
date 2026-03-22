"""add reading_text to questions

Revision ID: 70130b097505
Revises: 1fe2ecfae783
Create Date: 2026-01-25 23:50:51.086820

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '70130b097505'
down_revision: Union[str, Sequence[str], None] = '1fe2ecfae783'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('questions', sa.Column('reading_text', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('questions', 'reading_text')
