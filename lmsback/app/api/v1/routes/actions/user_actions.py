from typing import List, Union
from uuid import UUID
from loguru import logger
from fastapi import HTTPException

from api.v1.schemas.user_schema import ShowUser, UserCreate, UpdateUserRequest
from services.user_service import UserDAL
from db.models.user import PortalRole, User
from utils.hashing import Hasher

async def _get_user_by_id(user_id, session) -> Union[User, None]:
    logger.info(f"Получение пользователя {user_id} по id")
    async with session.begin():
        user_dal = UserDAL(session)
        user = await user_dal.get_user_by_id(
            user_id=user_id,
        )
        if user is not None:
            return user

async def _get_user_all(session) -> List[User]:
    logger.info(f"Получение пользователей")
    async with session.begin():
        user_dal = UserDAL(session)
        user = await user_dal.get_user_all()
        return list(user)


async def _get_user_by_email(email, session) -> Union[User, None]:
    logger.info(f"Получение пользователя {email} по email")
    async with session.begin():
        user_dal = UserDAL(session)
        user = await user_dal.get_user_by_email(
            email=email,
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
            roles=user.roles,
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


async def _add_role_to_user(user_id: UUID, role: PortalRole, session) -> Union[UUID, None]:
    logger.info(f"Добавление роли {role} пользователю {user_id}")
    async with session.begin():
        user_dal = UserDAL(session)
        user = await user_dal.add_role_to_user(user_id=user_id, role=role)
        return user

async def _remove_role_from_user(
    user_id: UUID, 
    role: PortalRole, 
    session
) -> Union[UUID, None]:
    logger.info(f"Удаление роли {role} у пользователя {user_id}")
    async with session.begin():
        user_dal = UserDAL(session)
        user = await user_dal.remove_role_from_user(user_id=user_id, role=role)
        return user


async def _set_user_roles(
    user_id: UUID, 
    roles: List[PortalRole], 
    session
) -> Union[UUID, None]:
    logger.info(f"Установка ролей {roles} пользователю {user_id}")
    async with session.begin():
        user_dal = UserDAL(session)
        updated_user_id = await user_dal.set_user_roles(
            user_id=user_id, 
            roles=roles
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
        if (
            PortalRole.ROLE_PORTAL_MODERATOR in target_user.roles
            and PortalRole.ROLE_PORTAL_MODERATOR in current_user.roles
        ):
            return False
    return True


def check_user_permissions_teahers(current_user: User) -> bool:
    logger.info(f"Проверка пользовательских ({current_user.last_name} {current_user.first_name}) расрешений")
    # check admin role
    if not {
        PortalRole.ROLE_PORTAL_ADMIN,
        PortalRole.ROLE_PORTAL_TEACHER,
    }.intersection(current_user.roles):
        return False
    return True

def check_user_permissions_moderator(current_user: User) -> bool:
    logger.info(f"Проверка пользовательских ({current_user.last_name} {current_user.first_name}) расрешений")
    # check admin role
    if not {
        PortalRole.ROLE_PORTAL_ADMIN,
        PortalRole.ROLE_PORTAL_MODERATOR,
    }.intersection(current_user.roles):
        return False
    return True

def check_user_permissions_admin(current_user: User) -> bool:
    logger.info(f"Проверка пользовательских ({current_user.last_name} {current_user.first_name}) расрешений")
    # check admin role
    if not {
        PortalRole.ROLE_PORTAL_ADMIN
    }.intersection(current_user.roles):
        return False
    return True

def check_role_change_permissions(
    target_user: User, 
    current_user: User, 
    new_roles: List[PortalRole]
) -> bool:
    """
    Проверка прав на изменение ролей пользователя.
    
    Правила:
    - Только администраторы могут изменять роли
    - Нельзя изменять роли самому себе (для безопасности)
    - Нельзя назначать роль ADMIN, если у текущего пользователя её нет
    - Модераторы не могут управлять ролями администраторов
    """
    logger.info(
        f"Проверка прав на изменение ролей для пользователя "
        f"{current_user.last_name} {current_user.first_name}"
    )
    
    # Только администраторы и модераторы могут изменять роли
    if not {
        PortalRole.ROLE_PORTAL_ADMIN,
        PortalRole.ROLE_PORTAL_MODERATOR,
    }.intersection(current_user.roles):
        logger.warning("Недостаточно прав для изменения ролей")
        raise HTTPException(
            status_code=403, 
            detail="Only administrators can change user roles."
        )
    
    # Нельзя изменять роли самому себе
    if target_user.user_id == current_user.user_id:
        logger.warning("Попытка изменить собственные роли")
        raise HTTPException(
            status_code=403, 
            detail="You cannot change your own roles."
        )
    
    # Модераторы не могут управлять администраторами
    if (
        PortalRole.ROLE_PORTAL_MODERATOR in current_user.roles
        and PortalRole.ROLE_PORTAL_ADMIN not in current_user.roles
    ):
        # Проверяем, является ли целевой пользователь администратором
        if PortalRole.ROLE_PORTAL_ADMIN in target_user.roles:
            logger.warning("Модератор пытается изменить роли администратора")
            raise HTTPException(
                status_code=403, 
                detail="Moderators cannot change administrator roles."
            )
        
        # Проверяем, пытается ли модератор назначить роль администратора
        if PortalRole.ROLE_PORTAL_ADMIN in new_roles:
            logger.warning("Модератор пытается назначить роль администратора")
            raise HTTPException(
                status_code=403, 
                detail="Moderators cannot assign administrator role."
            )
    
    # Нельзя полностью убрать все роли
    if not new_roles or len(new_roles) == 0:
        logger.warning("Попытка убрать все роли у пользователя")
        raise HTTPException(
            status_code=400, 
            detail="User must have at least one role."
        )
    
    return True
