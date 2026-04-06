from datetime import date
from typing import Union
from typing import Optional
from typing import List 

from uuid import UUID

from decimal import Decimal

from sqlalchemy import and_
from sqlalchemy import select
from sqlalchemy import update
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from db.models.user import User
from db.models.course import Course

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
