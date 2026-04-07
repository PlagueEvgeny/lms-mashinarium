from decimal import Decimal
from typing import Union
from typing import Optional
from typing import List
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import and_
from sqlalchemy import select
from sqlalchemy import update
from sqlalchemy import func
from sqlalchemy import case
from sqlalchemy import desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.orm import selectin_polymorphic
from services.category_service import CategoryDAL
from services.user_service import UserDAL
from db.models.course import Course, Status
from db.models.user import User
from db.models.category import Category
from db.models.module import Module
from db.models.lesson import LessonBase, Lecture, VideoLesson, Practica, TestLesson
from db.models.settings import PlatformSettings 

class AdminDAL:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
    
    async def get_user_by_id(self, user_id:UUID) -> Union[User, None]:
        query = select(User).where(and_(User.user_id == user_id))
        result = await self.db_session.execute(query)
        user_row = result.fetchone()
        if user_row is not None:
            return user_row[0]

    async def get_user_all(self) -> List[User]:
        query = select(User).options(
            selectinload(User.student_courses).selectinload(Course.categories),
            selectinload(User.teacher_courses).selectinload(Course.categories),
        )
        result = await self.db_session.execute(query)
        users = result.unique().scalars().all()
        return list(users)

    async def delete_user(self, user_id: UUID) -> Union[UUID, None]:
        query = update(User).\
                where(and_(User.user_id == user_id, User.is_active)).\
                values(is_active=False).\
                returning(User.user_id)

        result = await self.db_session.execute(query)
        deleted_user_id_row = result.fetchone()
        if deleted_user_id_row is not None:
            return deleted_user_id_row[0]

    async def restore_user(self, user_id: UUID) -> Union[UUID, None]:
        query = update(User).\
                where(and_(User.user_id == user_id, User.is_active == False)).\
                values(is_active=True).\
                returning(User.user_id)

        result = await self.db_session.execute(query)
        restored_user_id_row = result.fetchone()
        if restored_user_id_row is not None:
            return restored_user_id_row[0]

    async def get_course_by_id(self, id: int) -> Union[Course, None]:
        query = (
            select(Course).\
            options(selectinload(Course.categories)).\
            options(selectinload(Course.modules)).\
            options(selectinload(Course.teachers)).\
            options(selectinload(Course.students)).\
            where(Course.id == id)
        )
        result = await self.db_session.execute(query)
        course_row = result.fetchone()
        if course_row is not None:
            return course_row[0]
        return None

    async def get_course_all(self) -> List[Course]:
        status_order = case(
            {
                Status.PUBLISHED.value: 1,
                Status.DRAFT.value: 2,
                Status.TRASH.value: 3
            },
            value=Course.status[1]
        )
        
        modules_count = select(func.count(Module.id)).\
                        where(Module.course_id == Course.id).\
                        scalar_subquery()
        query = select(Course).\
                options(selectinload(Course.categories)).\
                options(
                    selectinload(Course.modules)
                    .selectinload(Module.lessons.and_(LessonBase.is_active == True))
                    .options(selectin_polymorphic(LessonBase, [Lecture, VideoLesson, Practica, TestLesson]))
                ).\
                options(selectinload(Course.teachers)).\
                options(selectinload(Course.students)).\
                order_by(desc(Course.is_active), status_order, desc(modules_count), desc(Course.updated_at))

        result = await self.db_session.execute(query)
        course = result.scalars().all()
        courses = list(course)
        return courses

    async def delete_course(self, course_id: int) -> Union[int, None]:
        query = update(Course).\
                where(and_(Course.id == course_id, Course.is_active)).\
                values(is_active=False).\
                returning(Course.id)

        result = await self.db_session.execute(query)
        deleted_course_id_row = result.fetchone()
        if deleted_course_id_row is not None:
            return deleted_course_id_row[0]

    async def restore_course(self, course_id: int) -> Union[int, None]:
        query = update(Course).\
                where(and_(Course.id == course_id, Course.is_active == False)).\
                values(is_active=True).\
                returning(Course.id)

        result = await self.db_session.execute(query)
        restored_course_id_row = result.fetchone()
        if restored_course_id_row is not None:
            return restored_course_id_row[0]

    async def get_settings(self) -> Optional[PlatformSettings]:
        result = await self.db_session.execute(
            select(PlatformSettings).where(PlatformSettings.id == 1)
        )
        return result.scalar_one_or_none()

    async def upsert_settings(self, **kwargs) -> PlatformSettings:
        settings = await self.get_settings()
        if settings is None:
            settings = PlatformSettings(id=1, **kwargs)
            self.db_session.add(settings)
        else:
            for key, value in kwargs.items():
                if value is not None:
                    setattr(settings, key, value)
        await self.db_session.flush()
        await self.db_session.refresh(settings)
        return settings
