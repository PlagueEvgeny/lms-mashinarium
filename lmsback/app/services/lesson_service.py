from typing import List, Type, Union, TypeVar
from typing import Optional

from sqlalchemy import and_
from sqlalchemy import select
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from db.models.lesson import LessonBase, Lecture, LessonType, VideoLesson, Practica

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

