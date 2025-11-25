from typing import Union
from uuid import UUID
from loguru import logger
from fastapi import HTTPException

from app.api.v1.schemas.user_schema import ShowUser, UserCreate, UpdateUserRequest
from app.services.user_service import UserDAL
from app.db.models.user import PortalRole, User
from app.utils.hashing import Hasher

async def _get_user_by_id(user_id, session) -> Union[User, None]:
    logger.info(f"Получение пользователя {user_id} по id")
    async with session.begin():
        user_dal = UserDAL(session)
        user = await user_dal.get_user_by_id(
            user_id=user_id,
        )
        if user is not None:
            return user


async def _create_new_user(body: UserCreate, session) -> ShowUser:
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
            hashed_password=Hasher.get_password_hash(body.password),
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

async def _delete_user(user_id, session) -> Union[UUID, None]:
    async with session.begin():
        user_dal = UserDAL(session)
        deleted_user_id = await user_dal.delete_user(user_id=user_id)
        return deleted_user_id

async def _update_user(updated_user_params: dict, user_id: UUID, session) -> Union[UUID, None]:
    async with session.begin():
        user_dal = UserDAL(session)
        updated_user_id = await user_dal.update_user(
            user_id=user_id, **updated_user_params,
        )
        return updated_user_id


def check_user_permissions(target_user: User, current_user: User) -> bool:
    logger.info(f"Проверка пользовательских ({current_user.last_name} {current_user.first_name}) расрешений")
    if PortalRole.ROLE_PORTAL_ADMIN in target_user.roles:
        logger.info(f"Попытка удаления админа через API пользователем {current_user.last_name} {current_user.first_name})")
        raise HTTPException(
            status_code=406, detail="Superadmin cannot be deleted via API."
        )
    if target_user.user_id != current_user.user_id:
        # check admin role
        if not {
            PortalRole.ROLE_PORTAL_ADMIN,
            PortalRole.ROLE_PORTAL_MODERATOR,
        }.intersection(current_user.roles):
            return False
        # check admin deactivate superadmin attempt
        if (
            PortalRole.ROLE_PORTAL_ADMIN in target_user.roles
            and PortalRole.ROLE_PORTAL_MODERATOR in current_user.roles
        ):
            return False
        # check admin deactivate admin attempt
        if (
            PortalRole.ROLE_PORTAL_ADMIN in target_user.roles
            and PortalRole.ROLE_PORTAL_ADMIN in current_user.roles
        ):
            return False
    return True
