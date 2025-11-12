from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.schemas.user_schema import ShowUser, UserCreate
from app.services.user_service import UserDAL
from app.db.session import get_db


user_router = APIRouter()

async def _create_new_user(body: UserCreate, db) -> ShowUser:
    async with db as session:
        async with session.begin():
            user_dal = UserDAL(session)
            user = await user_dal.create_user(
                last_name=body.last_name,
                first_name=body.first_name,
                patronymic=body.patronymic,
                telegram=body.telegram,
                email=body.email
            )

            return ShowUser(
                user_id=user.user_id,
                last_name=user.last_name,
                first_name=user.first_name,
                patronymic=user.patronymic,
                telegram=user.telegram,
                email=user.email,
                is_active=user.is_active
            )

@user_router.post("/", response_model=ShowUser)
async def create_user(body: UserCreate, db: AsyncSession = Depends(get_db)) -> ShowUser:
    return await _create_new_user(body, db)
