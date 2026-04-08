"""Initial migrations

Revision ID: b53e68857d2d
Revises: ee1f9a2e79ad
Create Date: 2025-12-19 15:50:06.849494

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b53e68857d2d'
down_revision: Union[str, Sequence[str], None] = 'ee1f9a2e79ad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
