from datetime import date
from typing import Union
from typing import Optional
from typing import List 

from uuid import UUID

from decimal import Decimal

from sqlalchemy import and_
from sqlalchemy import select
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from db.models.user import User, PortalRole, Gender

class UserDAL:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
    
    async def get_user_all(self) -> List[User]:
        query = select(User)
        result = await self.db_session.execute(query)
        user_row = result.scalars().all()
        return list(user_row)

    async def get_user_by_id(self, user_id:UUID) -> Union[User, None]:
        query = select(User).where(User.user_id == user_id)
        result = await self.db_session.execute(query)
        user_row = result.fetchone()
        if user_row is not None:
            return user_row[0]
    
    async def get_user_by_email(self, email: str) -> Union[User, None]:
        query = select(User).where(User.email == email)
        results = await self.db_session.execute(query)
        user_row = results.fetchone()
        if user_row is not None:
            return user_row[0]

    async def create_user(
            self,
            last_name: str,
            first_name: str,
            email: str,
            balance: Decimal,
            roles: List[PortalRole], 
            hashed_password: str,
            patronymic: Optional[str] = None,
            avatar: Optional[str] = None,
            telegram: Optional[str] = None,
            phone: Optional[str] = None,
            gender: Optional[List[Gender]] = None,
            date_of_birth: Optional[date] = None,
            ) -> User:
    
        # Установка значений по умолчанию
        if gender is None:
            gender = [Gender.OTHER]
    
        new_user = User(
        last_name=last_name,
        first_name=first_name,
        patronymic=patronymic,
        avatar=avatar,
        telegram=telegram,
        roles=roles,
        email=email,
        phone=phone,
        gender=gender,
        date_of_birth=date_of_birth,
        balance=balance,
        hashed_password=hashed_password
    )
        self.db_session.add(new_user)
        await self.db_session.flush()
        return new_user

    async def delete_user(self, user_id: UUID) -> Union[UUID, None]:
        query = update(User).\
                where(and_(User.user_id == user_id, User.is_active == True)).\
                values(is_active=False).\
                returning(User.user_id)

        result = await self.db_session.execute(query)
        deleted_user_id_row = result.fetchone()
        if deleted_user_id_row is not None:
            return deleted_user_id_row[0]

    async def update_user(self, user_id: UUID, **kwargs) -> Union[UUID, None]:
        query = update(User).\
                where(and_(User.user_id == user_id, User.is_active == True)).\
                values(kwargs).\
                returning(User.user_id)
        result = await self.db_session.execute(query)
        updated_user_id_row = result.fetchone()
        if updated_user_id_row is not None:
            return updated_user_id_row[0]

