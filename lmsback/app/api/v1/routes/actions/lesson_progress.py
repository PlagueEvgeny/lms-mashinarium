from loguru import logger
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from db.models.lesson import LessonType
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
    async with session.begin():
        course_dal   = CourseDAL(session)
        lesson_dal   = LessonDAL(session)

        course = await course_dal.get_course_by_slug(course_slug)
        if course is None:
            raise ValueError(f"Курс с slug '{course_slug}' не найден")

        ids = await lesson_dal.get_completed_lesson_ids(user_id, course.id)
        logger.info(f"Найдено {len(ids)} завершённых уроков по курсу {course_slug}")
        return ids


async def _get_course_progress_full(
    course_slug: str,
    user_id: UUID,
    session: AsyncSession,
) -> dict:
    logger.info(f"Агрегированный прогресс по курсу {course_slug} для пользователя {user_id}")
    async with session.begin():
        course_dal = CourseDAL(session)
        lesson_dal = LessonDAL(session)

        course = await course_dal.get_user_course_by_slug(user_id=user_id, slug=course_slug)
        if course is None:
            raise ValueError(f"Курс с slug '{course_slug}' не найден")

        completed = await lesson_dal.get_completed_lesson_ids(user_id, course.id)

        modules = sorted(course.modules or [], key=lambda m: m.display_order or 0)
        practica_ids: list[int] = []
        test_ids: list[int] = []
        practica_slug_by_id: dict[int, str] = {}
        test_slug_by_id: dict[int, str] = {}

        for m in modules:
            for l in sorted(m.lessons or [], key=lambda x: x.display_order or 0):
                if l.lesson_type == LessonType.PRACTICA.value:
                    practica_ids.append(l.id)
                    practica_slug_by_id[l.id] = l.slug
                elif l.lesson_type == LessonType.TEST.value:
                    test_ids.append(l.id)
                    test_slug_by_id[l.id] = l.slug

        practica_with = await lesson_dal.get_practica_ids_with_submission_for_user(practica_ids, user_id)
        tests_with = await lesson_dal.get_test_lesson_ids_with_submission_for_user(test_ids, user_id)

        practica = {practica_slug_by_id[i]: i in practica_with for i in practica_ids}
        tests = {test_slug_by_id[i]: i in tests_with for i in test_ids}

        return {
            "completed_lesson_ids": completed,
            "practica": practica,
            "tests": tests,
        }
