"""add revoked_tokens blacklist

Revision ID: a1b2c3d4e5f6
Revises: 773a76f37290
Create Date: 2026-03-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '773a76f37290'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'revoked_tokens',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('jti', sa.String(length=36), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('jti', name='uq_revoked_tokens_jti'),
    )
    op.create_index('ix_revoked_tokens_jti', 'revoked_tokens', ['jti'], unique=True)
    op.create_index('ix_revoked_tokens_expires', 'revoked_tokens', ['expires_at'])


def downgrade() -> None:
    op.drop_index('ix_revoked_tokens_expires', table_name='revoked_tokens')
    op.drop_index('ix_revoked_tokens_jti', table_name='revoked_tokens')
    op.drop_table('revoked_tokens')
