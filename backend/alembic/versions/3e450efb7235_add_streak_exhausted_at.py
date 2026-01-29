"""add_streak_exhausted_at

Revision ID: 3e450efb7235
Revises: 823286b57444
Create Date: 2026-01-29 10:49:50.223203

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3e450efb7235'
down_revision: Union[str, Sequence[str], None] = '823286b57444'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('streak_exhausted_at', sa.Date(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'streak_exhausted_at')
