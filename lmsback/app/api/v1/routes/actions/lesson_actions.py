from typing import Union
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from services.lesson_service import LessonDAL
from db.models.lesson import LessonType
from api.v1.schemas.lesson_schema import (
    LectureCreate, LectureResponse,
    VideoCreate, VideoResponse,
)

LESSON_TYPE_FIELDS = {
    LessonType.LECTURE: ["content", "images"],
    LessonType.VIDEO:   ["video_url", "duration"],
}

LESSON_RESPONSE_MAP = {
    LessonType.LECTURE: LectureResponse,
    LessonType.VIDEO:   VideoResponse,
}

async def _create_new_lesson(
        body: Union[LectureCreate, VideoCreate],
        session: AsyncSession,
) -> Union[LectureResponse, VideoResponse]:
    logger.info(f"Создание урока типа: {body.lesson_type}")
    async with session.begin():
        lesson_dal = LessonDAL(session)

        extra_fields = {
            field: getattr(body, field)
            for field in LESSON_TYPE_FIELDS.get(body.lesson_type, [])
            if getattr(body, field, None) is not None
        }

        lesson = await lesson_dal.create_lesson(
            module_id=body.module_id,
            name=body.name,
            slug=body.slug,
            display_order=body.display_order,
            lesson_type=body.lesson_type,
            **extra_fields,
        )

        response_class = LESSON_RESPONSE_MAP[body.lesson_type]
        return response_class.model_validate(lesson)


