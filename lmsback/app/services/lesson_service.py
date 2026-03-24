from typing import List, Type, Union, TypeVar
from typing import Optional

from sqlalchemy import and_
from sqlalchemy import select
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from db.models.lesson import LessonBase, Lecture, LessonType

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
