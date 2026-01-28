from pydantic import BaseModel
from uuid import UUID

from typing import Optional
from typing import List

from decimal import Decimal

from datetime import datetime

from api.v1.schemas.base_schema import TunedModel


class LessonShowBase(TunedModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    display_order: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    is_active: bool


class ShortLesson(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None



