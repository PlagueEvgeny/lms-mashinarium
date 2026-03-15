from pydantic import BaseModel
from uuid import UUID

from typing import Optional
from typing import List

from decimal import Decimal

from datetime import datetime

from api.v1.schemas.base_schema import TunedModel
from api.v1.schemas.lesson_schema import ShortLesson

class ShowModule(TunedModel):
    id: int
    course_id: int 
    name: str
    slug: str
    description: str
    display_order: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    is_active: bool

    lessons: List[ShortLesson] = []

class ShortModule(TunedModel):
    id: int
    course_id: int 
    name: str
    slug: str
    description: str

class ModuleCreate(BaseModel):
    course_id: int
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    display_order: int


class DeleteModuleResponse(BaseModel):
    deleted_module_id: int


class UpdatedModuleResponse(BaseModel):
    updated_module_id: int | None


class UpdateModuleRequest(BaseModel):
    course_id: int
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    display_order: int
