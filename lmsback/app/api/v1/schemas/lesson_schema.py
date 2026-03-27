from typing import Optional, List, Any, Union, Annotated, Literal
from pydantic import Field
from datetime import datetime
from db.models.lesson import LessonType

from api.v1.schemas.base_schema import TunedModel


class LessonMaterialResponse(TunedModel):
    id: int
    title: str
    file_url: str
    file_type: str
    display_order: int
    created_at: datetime


class LessonBaseSchema(TunedModel):
    module_id: int
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    display_order: int = Field(..., ge=0)


class LectureCreate(LessonBaseSchema):
    lesson_type: Literal[LessonType.LECTURE] = LessonType.LECTURE
    content: str = Field(..., min_length=1)
    images: Optional[List[Any]] = None


class VideoCreate(LessonBaseSchema):
    lesson_type: Literal[LessonType.VIDEO] = LessonType.VIDEO
    video_url: str = Field(..., min_length=1)
    duration: Optional[int] = None


class PracticaCreate(LessonBaseSchema):
    lesson_type: Literal[LessonType.PRACTICA] = LessonType.PRACTICA
    content: str = Field(..., min_length=1)
    attachments: Optional[List[Any]] = None
    max_score: Optional[int] = Field(default=100, ge=0)
    deadline_days: Optional[int] = Field(default=None, ge=0)


class TestQuestion(TunedModel):
    prompt: str = Field(..., min_length=1)
    options: List[str] = Field(..., min_length=2)


class TestCreate(LessonBaseSchema):
    lesson_type: Literal[LessonType.TEST] = LessonType.TEST
    questions: List[TestQuestion] = Field(..., min_length=1)


LessonCreate = Annotated[
    Union[LectureCreate, VideoCreate, PracticaCreate, TestCreate],
    Field(discriminator="lesson_type")
]


class LessonBaseResponse(LessonBaseSchema):
    id: int
    lesson_type: LessonType
    is_active: bool
    created_at: datetime
    updated_at: datetime
    materials: Optional[List[LessonMaterialResponse]] = None


class LectureResponse(LessonBaseResponse):
    lesson_type: Literal[LessonType.LECTURE] = LessonType.LECTURE
    content: str
    images: Optional[List[Any]] = None


class VideoResponse(LessonBaseResponse):
    lesson_type: Literal[LessonType.VIDEO] = LessonType.VIDEO
    video_url: str
    duration: Optional[int] = None


class PracticaResponse(LessonBaseResponse):
    lesson_type: Literal[LessonType.PRACTICA] = LessonType.PRACTICA
    content: str
    attachments: Optional[List[Any]] = None
    max_score: int
    deadline_days: Optional[int] = None


class TestResponse(LessonBaseResponse):
    lesson_type: Literal[LessonType.TEST] = LessonType.TEST
    questions: List[TestQuestion]


class DeleteResponse(TunedModel):
    deleted_lesson_id: int


LessonResponse = Annotated[
    Union[LectureResponse, VideoResponse, PracticaResponse, TestResponse],
    Field(discriminator="lesson_type")
]
