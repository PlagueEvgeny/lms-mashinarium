from pydantic import BaseModel
from pydantic import validator
from pydantic import constr

from fastapi import HTTPException

from typing import Optional
from typing import List

from decimal import Decimal

from datetime import datetime

from api.v1.schemas.base_schema import TunedModel

from utils.letter_pattern import LETTER_MATCH_PATTERN


class ShowCourse(TunedModel):
    id: int
    name: str
    slug: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    price: Decimal
    status: List[str]
    display_order: int
    created_at: Optional[datetime] 
    updated_at: Optional[datetime]
    is_active: bool


class CourseCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    price: Decimal
    status: List[str]
    display_order: int

    @validator("name")
    def validate_last_name(cls, value):
        if not LETTER_MATCH_PATTERN.match(value):
            raise HTTPException(
                    status_code=422, detail="Name should contains only letters"
                    )
        return value


class DeleteCourseResponse(BaseModel):
    deleted_course_id: int


class UpdatedCourseResponse(BaseModel):
    updated_course_id: int | None


class UpdateCourseRequest(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    price: Optional[Decimal] = None
    status: Optional[List[str]] = None
    display_order: Optional[int] = None




