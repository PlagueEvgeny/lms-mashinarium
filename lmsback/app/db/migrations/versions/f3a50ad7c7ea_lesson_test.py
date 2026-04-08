"""lesson test

Revision ID: f3a50ad7c7ea
Revises: 9f3a6b1c2d44
Create Date: 2026-03-29 18:24:07.725756

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3a50ad7c7ea'
down_revision: Union[str, Sequence[str], None] = '9f3a6b1c2d44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('test_submissions', sa.Column(
        'is_draft',
        sa.Boolean(),
        nullable=False,
        server_default=sa.false()
    ))
    op.alter_column('test_submissions', 'is_draft', server_default=None)

    op.drop_constraint(op.f('uq_user_test_submission'), 'test_submissions', type_='unique')
    op.create_unique_constraint(
        'uq_user_test_submission_draft',
        'test_submissions',
        ['test_lesson_id', 'user_id', 'is_draft']
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('uq_user_test_submission_draft', 'test_submissions', type_='unique')
    op.create_unique_constraint(
        op.f('uq_user_test_submission'),
        'test_submissions',
        ['test_lesson_id', 'user_id'],
        postgresql_nulls_not_distinct=False
    )
    op.drop_column('test_submissions', 'is_draft')