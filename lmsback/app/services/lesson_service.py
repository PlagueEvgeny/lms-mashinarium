from typing import TypeVar
from typing import Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from db.models.lesson import LessonBase, Lecture, LessonType, VideoLesson, Practica, LessonProgress
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
            select(LessonBase).where(
                LessonBase.id == lesson_id,
                LessonBase.is_active == True
            )
        )
        return result.scalars().first()

    async def get_lesson_by_slug(self, slug: str) -> Optional[LessonBase]:
        result = await self.db_session.execute(
            select(LessonBase).where(
                LessonBase.slug == slug,
                LessonBase.is_active == True
            )
        )
        return result.scalars().first()


    async def get_lesson_by_slug_for_student(self, slug: str, user_id: UUID) -> Optional[LessonBase]:
        result = await self.db_session.execute(
            select(LessonBase)
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

