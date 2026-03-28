from loguru import logger
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from services.lesson_service import LessonDAL
from services.course_service import CourseDAL


async def _get_course_progress_full(
    course_slug: str,
    user_id: UUID,
    session: AsyncSession,
) -> dict:
    logger.info(f"Агрегированный прогресс по курсу {course_slug} для {user_id}")
    async with session.begin():
        course_dal = CourseDAL(session)
        lesson_dal = LessonDAL(session)

        course_id = await course_dal.get_student_course_id_by_slug(user_id, course_slug)
        if course_id is None:
            raise ValueError(f"Курс с slug '{course_slug}' не найден или нет доступа")

        completed = await lesson_dal.get_completed_lesson_ids(user_id, course_id)
        rows = await lesson_dal.list_lesson_slug_and_type_for_course(course_id)

        practica_ids = [lid for lid, _slug, lt in rows if lt == "practica"]
        test_ids = [lid for lid, _slug, lt in rows if lt == "test"]

        practica_submitted = await lesson_dal.get_user_practica_submitted_practica_ids(user_id, practica_ids)
        test_submitted = await lesson_dal.get_user_test_submitted_test_lesson_ids(user_id, test_ids)

        practica_map = {slug: (lid in practica_submitted) for lid, slug, lt in rows if lt == "practica"}
        tests_map = {slug: (lid in test_submitted) for lid, slug, lt in rows if lt == "test"}

        return {
            "completed_lesson_ids": completed,
            "practica": practica_map,
            "tests": tests_map,
        }


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
