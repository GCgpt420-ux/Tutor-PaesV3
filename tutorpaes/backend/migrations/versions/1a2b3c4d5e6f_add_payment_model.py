"""Add Payment model for Transbank payments

Revision ID: 1a2b3c4d5e6f
Revises: f1dc4a6dba14
Create Date: 2026-02-26 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '1a2b3c4d5e6f'
down_revision: Union[str, Sequence[str], None] = 'f1dc4a6dba14'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create payment_status enum
    # Note: create_type=False means it won't create the type if it doesn't exist
    # The enum is defined inline in the table definition below
    # payment_status_enum = postgresql.ENUM(
    #     'pending', 'authorized', 'failed', 'cancelled',
    #     name='payment_status',
    #     create_type=False
    # )
    # payment_status_enum.create(op.get_bind(), checkfirst=True)
    
    # Create payments table
    op.create_table('payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('buy_order', sa.String(255), nullable=False, unique=True),
        sa.Column('token_ws', sa.String(255), nullable=True),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('plan', sa.String(32), nullable=False),
        sa.Column('status', sa.Enum('pending', 'authorized', 'failed', 'cancelled', name='payment_status'), nullable=False, server_default='pending'),
        sa.Column('transbank_response', postgresql.JSONB(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('authorized_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_payments_buy_order', 'payments', ['buy_order'], unique=True)
    op.create_index('ix_payments_token_ws', 'payments', ['token_ws'])
    op.create_index('ix_payments_user_status', 'payments', ['user_id', 'status'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop indexes
    op.drop_index('ix_payments_user_status', table_name='payments')
    op.drop_index('ix_payments_token_ws', table_name='payments')
    op.drop_index('ix_payments_buy_order', table_name='payments')
    
    # Drop table
    op.drop_table('payments')
    
    # Note: Not dropping the enum since it might be used elsewhere
    # and create_type=False in upgrade means we didn't create it
    # payment_status_enum = postgresql.ENUM(
    #     'pending', 'authorized', 'failed', 'cancelled',
    #     name='payment_status',
    #     create_type=False
    # )
    # payment_status_enum.drop(op.get_bind(), checkfirst=True)
