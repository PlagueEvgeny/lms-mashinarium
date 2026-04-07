import uuid
from pydantic import BaseModel
from pydantic import EmailStr


from datetime import datetime
from typing import Optional
from typing import List

from decimal import Decimal

from datetime import date

from api.v1.schemas.base_schema import TunedModel


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

class DeleteCourseResponse(BaseModel):
    deleted_course_id: int

class UpdatedCourseResponse(BaseModel):
    updated_course_id: int

class PlatformSettingsResponse(TunedModel):
    id: int
    site_name: Optional[str] = None
    site_description: Optional[str] = None
    support_email: Optional[str] = None
    logo_url: Optional[str] = None
    logo_horizontal_url: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_from: Optional[str] = None
    # smtp_password намеренно не возвращаем

class UpdateSettingsRequest(TunedModel):
    site_name: Optional[str] = None
    site_description: Optional[str] = None
    support_email: Optional[str] = None
    logo_url: Optional[str] = None
    logo_horizontal_url: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from: Optional[str] = None
