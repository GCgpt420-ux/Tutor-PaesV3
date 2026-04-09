"""add_invoice_model

Revision ID: d5f7c8b2e1a9
Revises: acdd0918d1b5
Create Date: 2026-04-06 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd5f7c8b2e1a9'
down_revision = 'acdd0918d1b5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create invoices table
    op.create_table(
        'invoices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('payment_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('invoice_number', sa.String(length=32), nullable=False),
        sa.Column('folio', sa.Integer(), nullable=True),
        sa.Column('subtotal', sa.Integer(), nullable=False),
        sa.Column('iva_amount', sa.Integer(), nullable=False),
        sa.Column('total_amount', sa.Integer(), nullable=False),
        sa.Column('issue_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('pdf_file_url', sa.String(length=512), nullable=True),
        sa.Column('pdf_file_path', sa.String(length=512), nullable=True),
        sa.Column('tax_info', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['payment_id'], ['payments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('invoice_number', name='uq_invoice_number'),
        sa.UniqueConstraint('payment_id', name='uq_invoice_payment'),
    )
    
    # Create indexes
    op.create_index('ix_invoices_user_status', 'invoices', ['user_id', 'status'])
    op.create_index('ix_invoices_created', 'invoices', ['created_at'])
    op.create_index('ix_invoices_payment', 'invoices', ['payment_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_invoices_payment', table_name='invoices')
    op.drop_index('ix_invoices_created', table_name='invoices')
    op.drop_index('ix_invoices_user_status', table_name='invoices')
    
    # Drop table
    op.drop_table('invoices')
