from typing import Union
from loguru import logger
from uuid import UUID
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


async def _get_lesson(lesson_id: int, session: AsyncSession) -> Union[LectureResponse, VideoResponse]:
    logger.info(f"Получение урока {lesson_id}")
    async with session.begin():
        lesson_dal = LessonDAL(session)
        lesson = await lesson_dal.get_lesson_by_id(lesson_id)

        if lesson is None:
            raise ValueError(f"Урок {lesson_id} не найден")

        response_class = LESSON_RESPONSE_MAP.get(LessonType(lesson.lesson_type))
        if response_class is None:
            raise ValueError(f"Неизвестный тип урока: {lesson.lesson_type}")

        return response_class.model_validate(lesson)


async def _get_lesson_by_slug(slug: str, session: AsyncSession) -> Union[LectureResponse, VideoResponse]:
    logger.info(f"Получение урока по slug: {slug}")
    async with session.begin():
        lesson_dal = LessonDAL(session)
        lesson = await lesson_dal.get_lesson_by_slug(slug)

        if lesson is None:
            raise ValueError(f"Урок с slug '{slug}' не найден")

        response_class = LESSON_RESPONSE_MAP.get(LessonType(lesson.lesson_type))
        if response_class is None:
            raise ValueError(f"Неизвестный тип урока: {lesson.lesson_type}")

        return response_class.model_validate(lesson)


async def _get_lesson_by_slug_for_student(
        slug: str,
        user_id: UUID,
        session: AsyncSession,
) -> Union[LectureResponse, VideoResponse]:
    logger.info(f"Получение урока {slug} для студента {user_id}")
    async with session.begin():
        lesson_dal = LessonDAL(session)
        lesson = await lesson_dal.get_lesson_by_slug_for_student(slug, user_id)

        if lesson is None:
            raise ValueError(f"Урок с slug '{slug}' не найден или нет доступа к курсу")

        response_class = LESSON_RESPONSE_MAP.get(LessonType(lesson.lesson_type))
        if response_class is None:
            raise ValueError(f"Неизвестный тип урока: {lesson.lesson_type}")

        return response_class.model_validate(lesson)


async def _delete_lesson(lesson_id: int, session: AsyncSession) -> int:
    logger.info(f"Удаление урока {lesson_id}")
    async with session.begin():
        lesson_dal = LessonDAL(session)
        deleted_id = await lesson_dal.delete_lesson(lesson_id)

        if deleted_id is None:
            raise ValueError(f"Урок {lesson_id} не найден или уже удалён")

        logger.info(f"Урок {deleted_id} успешно удалён")
        return deleted_id
