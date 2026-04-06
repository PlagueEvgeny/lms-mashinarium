import uuid
from pydantic import BaseModel
from pydantic import EmailStr
from pydantic import validator

from fastapi import HTTPException

from typing import Optional
from typing import List

from decimal import Decimal

from datetime import date

from api.v1.schemas.base_schema import TunedModel

from db.models.user import PortalRole
from utils.letter_pattern import LETTER_MATCH_PATTERN
from utils.letter_pattern import PHONE_MATCH_PATTERN

class ListCourse(TunedModel):
    id: int
    name: str
    slug: str
    short_description: str
    image: str
    price: Decimal
    display_order: int

class ShowUserAdmin(TunedModel):
    user_id: uuid.UUID
    last_name: str
    first_name: str
    patronymic: Optional[str] = None
    about: Optional[str] = None
    avatar: Optional[str] = None
    telegram: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    gender: List[str]
    roles: List[str]
    date_of_birth: Optional[date] = None
    balance: Decimal
    is_active: bool

    student_courses: List[ListCourse] = []
    teacher_courses: List[ListCourse] = []

class DeleteUserResponse(BaseModel):
    deleted_user_id: uuid.UUID

class UpdatedUserResponse(BaseModel):
    updated_user_id: uuid.UUID
