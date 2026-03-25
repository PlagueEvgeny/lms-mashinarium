from typing import Optional, List, Any, Union, Annotated, Literal
from pydantic import Field
from datetime import datetime
from db.models.lesson import LessonType

from api.v1.schemas.base_schema import TunedModel

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


LessonCreate = Annotated[
    Union[LectureCreate, VideoCreate, PracticaCreate],
    Field(discriminator="lesson_type")
]


class LessonBaseResponse(LessonBaseSchema):
    id: int
    lesson_type: LessonType
    is_active: bool
    created_at: datetime
    updated_at: datetime


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


class DeleteResponse(TunedModel):
    deleted_lesson_id: int


LessonResponse = Annotated[
    Union[LectureResponse, VideoResponse, PracticaResponse],
    Field(discriminator="lesson_type")
]
