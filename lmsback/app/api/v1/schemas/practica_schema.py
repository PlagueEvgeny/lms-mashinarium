from __future__ import annotations

from typing import Optional, List
from uuid import UUID
from datetime import datetime

from pydantic import Field

from api.v1.schemas.base_schema import TunedModel


class PracticaGradeRequest(TunedModel):
    score: int = Field(..., ge=0)
    feedback: Optional[str] = Field(default=None, min_length=1)


class PracticaSubmissionResponse(TunedModel):
    id: int
    practica_id: int
    user_id: UUID
    user_email: Optional[str] = None
    lesson_slug: Optional[str] = None
    lesson_name: Optional[str] = None

    text_answer: Optional[str] = None
    files: Optional[List[str]] = None

    score: Optional[int] = None
    feedback: Optional[str] = None
    submitted_at: datetime
    updated_at: datetime
    is_graded: bool

