from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User

class UserDAL:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session

    async def create_user(
            self, 
            last_name: str,
            first_name: str,
            patronymic: str,
            telegram: str,
            email: str,
            ) -> User:
        
        new_user = User(
                last_name=last_name,
                first_name=first_name,
                patronymic=patronymic,
                telegram=telegram,
                email=email,
                )
        self.db_session.add(new_user)
        await self.db_session.flush()
        return new_user


        
