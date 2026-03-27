from pydantic import BaseModel
from uuid import UUID

from typing import Optional
from typing import List

from decimal import Decimal

from datetime import datetime

from api.v1.schemas.base_schema import TunedModel
from api.v1.schemas.category_schema import ShowCategory
from api.v1.schemas.user_schema import ShowUserShort
from api.v1.schemas.module_schema import ShortModule
from api.v1.schemas.lesson_schema import LessonStudentResponse


class ShowCourse(TunedModel):
    id: int
    name: str
    slug: str
    short_description: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    price: Decimal
    status: List[str]
    display_order: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    is_active: bool
    categories: List[ShowCategory]
    teachers: List[ShowUserShort]
    modules: List[ShortModule] = []
    students: List[ShowUserShort] = []

class ListCourse(TunedModel):
    id: int
    name: str
    slug: str
    short_description: str
    image: str
    price: Decimal
    display_order: int
    categories: List[ShowCategory]

class ListTeacherCourse(TunedModel):
    id: int
    name: str
    slug: str
    short_description: str
    image: str
    price: Decimal
    display_order: int
    # Для списка курсов преподавателя не тянем уроки (иначе может быть lazy-load/async issues)
    modules: List[ShortModule] = []
    students: List[ShowUserShort] = []
    categories: List[ShowCategory]


class ShowTeacherCourse(TunedModel):
    id: int
    name: str
    slug: str
    short_description: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    price: Decimal
    status: List[str]
    display_order: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    is_active: bool
    categories: List[ShowCategory]
    teachers: List[ShowUserShort]
    # Для детальной страницы преподавателя модули достаточно без уроков,
    # уроки запрашиваем отдельно через /module (иначе возможны async lazy-load проблемы)
    modules: List[ShortModule] = []
    students: List[ShowUserShort] = []


class ShowModuleStudent(TunedModel):
    id: int
    course_id: int
    name: str
    slug: str
    description: Optional[str]
    display_order: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    is_active: bool
    lessons: List[LessonStudentResponse] = []


class ShowUserCourse(TunedModel):
    id: int
    name: str
    slug: str
    short_description: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    is_active: bool
    categories: List[ShowCategory]
    teachers: List[ShowUserShort]
    modules: List[ShowModuleStudent] = []
    students: List[ShowUserShort] = []

class CourseCreate(BaseModel):
    name: str
    slug: str
    short_description: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    price: Decimal
    status: List[str]
    display_order: int
    category_ids: List[int]
    teacher_ids: List[UUID]
    
class DeleteCourseResponse(BaseModel):
    deleted_course_id: int


class UpdatedCourseResponse(BaseModel):
    updated_course_id: int | None


class UpdateCourseRequest(BaseModel):
    name: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    price: Optional[Decimal] = None
    status: Optional[List[str]] = None
    display_order: Optional[int] = None
    category_ids: Optional[List[int]] = None


class AddTeachersToCourse(BaseModel):
    teacher_ids: List[UUID]

class AddStudentsToCourse(BaseModel):
    student_ids: List[UUID]

class RemoveTeachersFromCourse(BaseModel):
    teacher_ids: List[UUID]

class RemoveStudentsFromCourse(BaseModel):
    student_ids: List[UUID]

