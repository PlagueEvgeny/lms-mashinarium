from typing import Union
from uuid import UUID

from app.api.v1.schemas.user_schema import ShowUser, UserCreate, UpdateUserRequest
from app.services.user_service import UserDAL
from app.db.models.user import PortalRole

async def _get_user_by_id(user_id, db) -> Union[ShowUser, None]:
    async with db as session:
        async with session.begin():
            user_dal = UserDAL(session)
            user = await user_dal.get_user_by_id(user_id=user_id,)
            if user is not None:
                return ShowUser(
                user_id=user.user_id,
                last_name=user.last_name,
                first_name=user.first_name,
                patronymic=user.patronymic,
                avatar=user.avatar,
                telegram=user.telegram,
                email=user.email,
                phone=user.phone,
                gender=user.gender,
                date_of_birth=user.date_of_birth,
                balance=user.balance,
                is_active=user.is_active
            )


async def _create_new_user(body: UserCreate, db) -> ShowUser:
    async with db as session:
        async with session.begin():
            user_dal = UserDAL(session)
            user = await user_dal.create_user(
                last_name=body.last_name,
                first_name=body.first_name,
                patronymic=body.patronymic,
                avatar=body.avatar,
                telegram=body.telegram,
                email=body.email,
                phone=body.phone,
                roles=[PortalRole.ROLE_PORTAL_USER,],
                gender=body.gender,
                date_of_birth=body.date_of_birth,
                balance=0,
            )

            return ShowUser(
                user_id=user.user_id,
                last_name=user.last_name,
                first_name=user.first_name,
                patronymic=user.patronymic,
                avatar=user.avatar,
                telegram=user.telegram,
                email=user.email,
                phone=user.phone,
                gender=user.gender,
                date_of_birth=user.date_of_birth,
                balance=user.balance,
                is_active=user.is_active
            )

async def _delete_user(user_id, db) -> Union[UUID, None]:
    async with db as session:
        async with session.begin():
            user_dal = UserDAL(session)
            deleted_user_id = await user_dal.delete_user(user_id=user_id)
            return deleted_user_id

async def _update_user(updated_user_params: dict, user_id: UUID, db) -> Union[UUID, None]:
    async with db as session:
        async with session.begin():
            user_dal = UserDAL(session)
            updated_user_id = await user_dal.update_user(
                user_id=user_id, **updated_user_params,
            )
            return updated_user_id
