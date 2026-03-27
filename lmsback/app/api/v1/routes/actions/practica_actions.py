from typing import Optional, List
from uuid import UUID

from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from db.models.lesson import LessonType
from services.lesson_service import LessonDAL
from api.v1.schemas.practica_schema import PracticaSubmissionResponse


def _validate_practica_lesson_type(lesson_type: str) -> None:
    try:
        if LessonType(lesson_type) != LessonType.PRACTICA:
            raise ValueError("Указанный урок не является практикой")
    except ValueError as e:
        # LessonType(lesson_type) тоже может бросить ValueError
        raise ValueError(str(e))


async def _submit_practica(
    lesson_slug: str,
    user_id: UUID,
    text_answer: Optional[str],
    file_urls: Optional[List[str]],
    session: AsyncSession,
) -> PracticaSubmissionResponse:
    logger.info(f"Отправка практики '{lesson_slug}' пользователем {user_id}")
    async with session.begin():
        lesson_dal = LessonDAL(session)

        lesson = await lesson_dal.get_lesson_by_slug_for_student(lesson_slug, user_id)
        if lesson is None:
            raise ValueError(f"Практика с slug '{lesson_slug}' не найдена или нет доступа к курсу")

        _validate_practica_lesson_type(lesson.lesson_type)

        if (text_answer is None or not text_answer.strip()) and not file_urls:
            raise ValueError("Нужно отправить хотя бы текст или файлы")

        submission = await lesson_dal.upsert_practica_submission(
            practica_id=lesson.id,
            user_id=user_id,
            text_answer=text_answer,
            files=file_urls,
        )
        return PracticaSubmissionResponse.model_validate(submission)


async def _get_my_submission(
    lesson_slug: str,
    user_id: UUID,
    session: AsyncSession,
) -> PracticaSubmissionResponse:
    logger.info(f"Получение моей отправки по практике '{lesson_slug}' для {user_id}")
    async with session.begin():
        lesson_dal = LessonDAL(session)

        lesson = await lesson_dal.get_lesson_by_slug_for_student(lesson_slug, user_id)
        if lesson is None:
            raise ValueError(f"Практика с slug '{lesson_slug}' не найдена или нет доступа к курсу")

        _validate_practica_lesson_type(lesson.lesson_type)

        submission = await lesson_dal.get_practica_submission(practica_id=lesson.id, user_id=user_id)
        if submission is None:
            raise ValueError("Решение еще не отправлялось")

        return PracticaSubmissionResponse.model_validate(submission)


async def _grade_submission(
    lesson_slug: str,
    student_user_id: UUID,
    score: int,
    feedback: Optional[str],
    session: AsyncSession,
) -> PracticaSubmissionResponse:
    logger.info(f"Оценивание практики '{lesson_slug}' для студента {student_user_id}")
    async with session.begin():
        lesson_dal = LessonDAL(session)

        lesson = await lesson_dal.get_lesson_by_slug(lesson_slug)
        if lesson is None:
            raise ValueError(f"Практика с slug '{lesson_slug}' не найдена")

        _validate_practica_lesson_type(lesson.lesson_type)

        submission = await lesson_dal.grade_practica_submission(
            practica_id=lesson.id,
            user_id=student_user_id,
            score=score,
            feedback=feedback,
        )
        if submission is None:
            raise ValueError("Решение студента не найдено")

        return PracticaSubmissionResponse.model_validate(submission)


async def _get_submissions_for_practica(
    lesson_slug: str,
    session: AsyncSession,
) -> List[PracticaSubmissionResponse]:
    logger.info(f"Получение отправок по практике '{lesson_slug}'")
    async with session.begin():
        lesson_dal = LessonDAL(session)

        lesson = await lesson_dal.get_lesson_by_slug(lesson_slug)
        if lesson is None:
            raise ValueError(f"Практика с slug '{lesson_slug}' не найдена")

        _validate_practica_lesson_type(lesson.lesson_type)

        submissions = await lesson_dal.get_practica_submissions(practica_id=lesson.id)
        return [PracticaSubmissionResponse.model_validate(s) for s in submissions]

