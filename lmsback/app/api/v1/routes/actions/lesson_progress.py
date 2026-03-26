from loguru import logger
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from services.lesson_service import LessonDAL
from services.course_service import CourseDAL


async def _complete_lesson(
        lesson_slug: str,
        user_id: UUID,
        session: AsyncSession,
) -> dict:
    logger.info(f"Завершение урока {lesson_slug} пользователем {user_id}")
    async with session.begin():
        lesson_dal   = LessonDAL(session)

        lesson = await lesson_dal.get_lesson_by_slug(lesson_slug)
        if lesson is None:
            raise ValueError(f"Урок с slug '{lesson_slug}' не найден")

        await lesson_dal.complete_lesson(user_id, lesson.id)
        logger.info(f"Урок {lesson_slug} отмечен как завершённый")
        return {"status": "ok"}


async def _get_course_progress(
        course_slug: str,
        user_id: UUID,
        session: AsyncSession,
) -> list[int]:
    logger.info(f"Получение прогресса по курсу {course_slug} для пользователя {user_id}")
    async with session.begin():
        course_dal   = CourseDAL(session)
        lesson_dal   = LessonDAL(session)

        course = await course_dal.get_course_by_slug(course_slug)
        if course is None:
            raise ValueError(f"Курс с slug '{course_slug}' не найден")

        ids = await lesson_dal.get_completed_lesson_ids(user_id, course.id)
        logger.info(f"Найдено {len(ids)} завершённых уроков по курсу {course_slug}")
        return ids
