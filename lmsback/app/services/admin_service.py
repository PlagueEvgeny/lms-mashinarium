from datetime import date
from typing import Union
from typing import Optional
from typing import List 

from uuid import UUID

from decimal import Decimal

from sqlalchemy import and_
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from db.models.user import User, PortalRole, Gender
from db.models.course import Course

class AdminDAL:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
    
    async def get_user_all(self) -> List[User]:
        query = select(User).where(User.is_active == True).options(
            selectinload(User.student_courses).\
            selectinload(User.teacher_courses).\
            selectinload(Course.categories)
        )
        result = await self.db_session.execute(query)
        users = result.unique().scalars().all()
        return list(users)
