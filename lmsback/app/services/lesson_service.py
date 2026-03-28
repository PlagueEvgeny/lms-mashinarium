from typing import TypeVar
from typing import Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from db.models.lesson import (
    LessonBase,
    Lecture,
    LessonType,
    VideoLesson,
    Practica,
    TestLesson,
    LessonProgress,
    PracticaSubmission,
    LessonMaterial,
    TestCorrectAnswer,
    TestSubmission,
    TestSubmissionAnswer,
)
from db.models.user import User
from db.models.course import Course
from db.models.module import Module
from datetime import datetime

T = TypeVar("T", bound=LessonBase)

class LessonDAL:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
    
    async def create_lesson(
            self,
            module_id: int,
            name: str,
            slug: str,
            display_order: int,
            lesson_type: LessonType,
            **kwargs
    ) -> LessonBase:
        
        lesson_class_map = {
            LessonType.LECTURE: Lecture,
            LessonType.VIDEO: VideoLesson,
            LessonType.PRACTICA: Practica,
            LessonType.TEST: TestLesson,
        }

        lesson_class = lesson_class_map.get(lesson_type, LessonBase)
    
        new_lesson = lesson_class(
            module_id=module_id,
            name=name,
            slug=slug,
            display_order=display_order,
            lesson_type=lesson_type.value,
            **kwargs
        )
        self.db_session.add(new_lesson)
        await self.db_session.flush()
        await self.db_session.refresh(new_lesson)
        return new_lesson


    async def get_lesson_by_id(self, lesson_id: int) -> Optional[LessonBase]:
        result = await self.db_session.execute(
            select(LessonBase)
            .options(selectinload(LessonBase.materials))
            .where(
                LessonBase.id == lesson_id,
                LessonBase.is_active == True,
            )
        )
        return result.scalars().first()

    async def get_lesson_by_slug(self, slug: str) -> Optional[LessonBase]:
        result = await self.db_session.execute(
            select(LessonBase)
            .options(selectinload(LessonBase.materials))
            .where(
                LessonBase.slug == slug,
                LessonBase.is_active == True,
            )
        )
        return result.scalars().first()


    async def get_lesson_by_slug_for_student(self, slug: str, user_id: UUID) -> Optional[LessonBase]:
        result = await self.db_session.execute(
            select(LessonBase)
            .options(selectinload(LessonBase.materials))
            .join(Module, Module.id == LessonBase.module_id)
            .join(Course, Course.id == Module.course_id)
            .where(
                LessonBase.slug == slug,
                LessonBase.is_active == True,
                Course.is_active == True,
                Course.students.any(User.user_id == user_id),
            )
        )
        return result.scalars().first()

    async def get_lesson_by_slug_for_teacher(self, slug: str, user_id: UUID) -> Optional[LessonBase]:
        """
        Доступ преподавателя к уроку по slug через связь курса.
        """
        result = await self.db_session.execute(
            select(LessonBase)
            .options(selectinload(LessonBase.materials))
            .join(Module, Module.id == LessonBase.module_id)
            .join(Course, Course.id == Module.course_id)
            .where(
                LessonBase.slug == slug,
                LessonBase.is_active == True,
                Course.is_active == True,
                Course.teachers.any(User.user_id == user_id),
            )
        )
        return result.scalars().first()

    async def delete_lesson(self, lesson_id: int) -> Optional[int]:
        result = await self.db_session.execute(
            update(LessonBase)
            .where(
                LessonBase.id == lesson_id,
                LessonBase.is_active == True
            )
            .values(is_active=False)
            .returning(LessonBase.id)
        )
        deleted_id = result.scalars().first()
        await self.db_session.flush()
        return deleted_id

    async def complete_lesson(self, user_id: UUID, lesson_id: int) -> LessonProgress:
        result = await self.db_session.execute(
            select(LessonProgress).where(
                LessonProgress.user_id == user_id,
                LessonProgress.lesson_id == lesson_id,
            )
        )
        progress = result.scalars().first()

        if progress:
            progress.is_completed = True
            progress.completed_at = datetime.utcnow()
        else:
            progress = LessonProgress(
                user_id=user_id,
                lesson_id=lesson_id,
                is_completed=True,
                completed_at=datetime.utcnow(),
            )
            self.db_session.add(progress)

        await self.db_session.flush()
        return progress

    async def get_completed_lesson_ids(self, user_id: UUID, course_id: int) -> list[int]:
        result = await self.db_session.execute(
            select(LessonProgress.lesson_id)
            .join(LessonBase, LessonBase.id == LessonProgress.lesson_id)
            .join(Module, Module.id == LessonBase.module_id)
            .where(
                LessonProgress.user_id == user_id,
                LessonProgress.is_completed == True,
                Module.course_id == course_id,
            )
        )
        return list(result.scalars().all())

    async def get_practica_submission(
        self,
        practica_id: int,
        user_id: UUID,
    ) -> Optional[PracticaSubmission]:
        result = await self.db_session.execute(
            select(PracticaSubmission).where(
                PracticaSubmission.practica_id == practica_id,
                PracticaSubmission.user_id == user_id,
            )
        )
        return result.scalars().first()

    async def upsert_practica_submission(
        self,
        practica_id: int,
        user_id: UUID,
        text_answer: Optional[str],
        files: Optional[list[str]],
    ) -> PracticaSubmission:
        """
        Создаёт или обновляет решение студента по конкретной практике.
        """
        existing = await self.get_practica_submission(practica_id=practica_id, user_id=user_id)

        if existing:
            # Если поле не прислали, сохраняем предыдущее значение,
            # чтобы не затирать ответ при частичном обновлении.
            if text_answer is not None:
                existing.text_answer = text_answer
            if files is not None:
                existing.files = files
            existing.is_graded = False
            existing.score = None
            existing.feedback = None
            self.db_session.add(existing)
            await self.db_session.flush()
            await self.db_session.refresh(existing)
            return existing

        submission = PracticaSubmission(
            practica_id=practica_id,
            user_id=user_id,
            text_answer=text_answer,
            files=files,
            is_graded=False,
            submitted_at=datetime.utcnow(),
        )
        self.db_session.add(submission)
        await self.db_session.flush()
        await self.db_session.refresh(submission)
        return submission

    async def grade_practica_submission(
        self,
        practica_id: int,
        user_id: UUID,
        score: int,
        feedback: Optional[str],
    ) -> Optional[PracticaSubmission]:
        submission = await self.get_practica_submission(practica_id=practica_id, user_id=user_id)
        if submission is None:
            return None

        submission.score = score
        submission.feedback = feedback
        submission.is_graded = True
        await self.db_session.flush()
        await self.db_session.refresh(submission)
        return submission

    async def get_practica_submissions(
        self,
        practica_id: int,
    ) -> list[PracticaSubmission]:
        result = await self.db_session.execute(
            select(PracticaSubmission).where(
                PracticaSubmission.practica_id == practica_id,
            )
        )
        return list(result.scalars().all())

    async def get_practica_submissions_by_ids(self, practica_ids: list[int]) -> list[PracticaSubmission]:
        if not practica_ids:
            return []
        result = await self.db_session.execute(
            select(PracticaSubmission).where(PracticaSubmission.practica_id.in_(practica_ids))
        )
        return list(result.scalars().all())

    async def replace_test_correct_answers(self, test_lesson_id: int, questions: list[dict]) -> None:
        existing = await self.db_session.execute(
            select(TestCorrectAnswer).where(TestCorrectAnswer.test_lesson_id == test_lesson_id)
        )
        for item in existing.scalars().all():
            await self.db_session.delete(item)

        for idx, q in enumerate(questions or []):
            if not isinstance(q, dict):
                continue

            question_type = q.get("question_type") or "single"
            correct = TestCorrectAnswer(
                test_lesson_id=test_lesson_id,
                question_index=idx,
                question_type=question_type,
                correct_option=q.get("correct_option"),
                correct_options=q.get("correct_options"),
                correct_text=q.get("correct_text"),
            )
            self.db_session.add(correct)

        await self.db_session.flush()

    async def get_test_correct_answers_map(self, test_lesson_id: int) -> dict[int, TestCorrectAnswer]:
        result = await self.db_session.execute(
            select(TestCorrectAnswer).where(TestCorrectAnswer.test_lesson_id == test_lesson_id)
        )
        rows = result.scalars().all()
        return {row.question_index: row for row in rows}

    async def get_test_submission(self, test_lesson_id: int, user_id: UUID) -> Optional[TestSubmission]:
        result = await self.db_session.execute(
            select(TestSubmission).where(
                TestSubmission.test_lesson_id == test_lesson_id,
                TestSubmission.user_id == user_id,
            )
        )
        return result.scalars().first()

    async def get_test_submission_with_answers(self, test_lesson_id: int, user_id: UUID) -> Optional[TestSubmission]:
        result = await self.db_session.execute(
            select(TestSubmission)
            .options(selectinload(TestSubmission.answers))
            .where(
                TestSubmission.test_lesson_id == test_lesson_id,
                TestSubmission.user_id == user_id,
            )
        )
        return result.scalars().first()

    async def get_test_submissions_with_answers(self, test_lesson_id: int) -> list[TestSubmission]:
        result = await self.db_session.execute(
            select(TestSubmission)
            .options(selectinload(TestSubmission.answers))
            .where(TestSubmission.test_lesson_id == test_lesson_id)
        )
        return list(result.scalars().all())

    async def get_test_submissions_with_answers_by_ids(self, test_lesson_ids: list[int]) -> list[TestSubmission]:
        if not test_lesson_ids:
            return []
        result = await self.db_session.execute(
            select(TestSubmission)
            .options(selectinload(TestSubmission.answers))
            .where(TestSubmission.test_lesson_id.in_(test_lesson_ids))
        )
        return list(result.scalars().all())

    async def create_test_submission(
        self,
        test_lesson_id: int,
        user_id: UUID,
        total_questions: int,
        checked_questions: int,
        total_score: float,
        answers: list[dict],
    ) -> TestSubmission:
        submission = TestSubmission(
            test_lesson_id=test_lesson_id,
            user_id=user_id,
            total_questions=total_questions,
            checked_questions=checked_questions,
            total_score=total_score,
            submitted_at=datetime.utcnow(),
        )
        self.db_session.add(submission)
        await self.db_session.flush()

        for item in answers:
            answer = TestSubmissionAnswer(
                submission_id=submission.id,
                question_index=item["question_index"],
                question_type=item["question_type"],
                selected_option=item.get("selected_option"),
                selected_options=item.get("selected_options"),
                text_answer=item.get("text_answer"),
                is_correct=item.get("is_correct"),
                score=item.get("score", 0.0),
            )
            self.db_session.add(answer)

        await self.db_session.flush()
        await self.db_session.refresh(submission)
        return submission

