"""add deleted_at to users and admin_activity_log table

Revision ID: a7b8c9d0e1f2
Revises: 5d72963c4bf1
Create Date: 2025-11-03 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a7b8c9d0e1f2'
down_revision: Union[str, Sequence[str], None] = '5d72963c4bf1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add deleted_at column to users for soft-delete support
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted_at', sa.DateTime(), nullable=True))
        batch_op.create_index(batch_op.f('ix_users_deleted_at'), ['deleted_at'], unique=False)

    # Create admin_activity_log table
    op.create_table(
        'admin_activity_log',
        sa.Column('id', sa.BigInteger(), autoincrement=True, primary_key=True, nullable=False),
        sa.Column('admin_id', sa.String(), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('target_user_id', sa.String(), nullable=True),
        sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['admin_id'], ['users.id'], ),
    )

    with op.batch_alter_table('admin_activity_log', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_admin_activity_log_admin_id'), ['admin_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_admin_activity_log_created_at'), ['created_at'], unique=False)


def downgrade() -> None:
    # Drop admin_activity_log table
    with op.batch_alter_table('admin_activity_log', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_admin_activity_log_created_at'))
        batch_op.drop_index(batch_op.f('ix_admin_activity_log_admin_id'))
    op.drop_table('admin_activity_log')

    # Remove deleted_at from users
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_users_deleted_at'))
        batch_op.drop_column('deleted_at')
