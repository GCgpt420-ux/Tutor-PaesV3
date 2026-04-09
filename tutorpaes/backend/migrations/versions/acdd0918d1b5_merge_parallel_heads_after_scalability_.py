"""merge parallel heads after scalability migration

Revision ID: acdd0918d1b5
Revises: a1b2c3d4e5f6, c7e2a1f3b8d9
Create Date: 2026-03-30 20:54:18.793978

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'acdd0918d1b5'
down_revision: Union[str, Sequence[str], None] = ('a1b2c3d4e5f6', 'c7e2a1f3b8d9')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
