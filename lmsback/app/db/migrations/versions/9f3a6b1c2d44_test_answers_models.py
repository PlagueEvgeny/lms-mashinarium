"""test answers models

Revision ID: 9f3a6b1c2d44
Revises: 0bcd82618746
Create Date: 2026-03-27 21:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9f3a6b1c2d44'
down_revision: Union[str, Sequence[str], None] = '0bcd82618746'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'test_correct_answers',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('test_lesson_id', sa.Integer(), nullable=False),
        sa.Column('question_index', sa.Integer(), nullable=False),
        sa.Column('question_type', sa.String(), nullable=False),
        sa.Column('correct_option', sa.Integer(), nullable=True),
        sa.Column('correct_options', sa.JSON(), nullable=True),
        sa.Column('correct_text', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['test_lesson_id'], ['test_lessons.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('test_lesson_id', 'question_index', name='uq_test_correct_answer'),
    )

    op.create_table(
        'test_submissions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('test_lesson_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('total_questions', sa.Integer(), nullable=False),
        sa.Column('checked_questions', sa.Integer(), nullable=False),
        sa.Column('total_score', sa.Float(), nullable=False),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['test_lesson_id'], ['test_lessons.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('test_lesson_id', 'user_id', name='uq_user_test_submission'),
    )

    op.create_table(
        'test_submission_answers',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('submission_id', sa.Integer(), nullable=False),
        sa.Column('question_index', sa.Integer(), nullable=False),
        sa.Column('question_type', sa.String(), nullable=False),
        sa.Column('selected_option', sa.Integer(), nullable=True),
        sa.Column('selected_options', sa.JSON(), nullable=True),
        sa.Column('text_answer', sa.Text(), nullable=True),
        sa.Column('is_correct', sa.Boolean(), nullable=True),
        sa.Column('score', sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(['submission_id'], ['test_submissions.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('submission_id', 'question_index', name='uq_test_submission_answer'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('test_submission_answers')
    op.drop_table('test_submissions')
    op.drop_table('test_correct_answers')
