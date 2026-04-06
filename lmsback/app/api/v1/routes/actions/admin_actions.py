from typing import List, Union
from uuid import UUID
from loguru import logger
from fastapi import HTTPException

from db.models.user import PortalRole, User
from api.v1.schemas.course_schema import ListAdminCourse
from services.admin_service import AdminDAL

async def _get_user_by_id(user_id, session) -> Union[User, None]:
    logger.info(f"Получение пользователя {user_id} по id")
    async with session.begin():
        admin_dal = AdminDAL(session)
        user = await admin_dal.get_user_by_id(
            user_id=user_id,
        )
        if user is not None:
            return user

async def _get_user_all(session) -> List[User]:
    logger.info("Получение пользователей")
    async with session.begin():
        admin_dal = AdminDAL(session)
        user = await admin_dal.get_user_all()
        return list(user)

async def _delete_user(user_id, session) -> Union[UUID, None]:
    async with session.begin():
        admin_dal = AdminDAL(session)
        deleted_user_id = await admin_dal.delete_user(user_id=user_id)
        return deleted_user_id

async def _restore_user(user_id, session) -> Union[UUID, None]:
    async with session.begin():
        admin_dal = AdminDAL(session)
        restored_user_id = await admin_dal.restore_user(user_id=user_id)
        return restored_user_id

async def _get_course_all(session) -> List[ListAdminCourse]:
    logger.info("Получение курсов преподавателя")
    async with session.begin():
        admin_dal = AdminDAL(session)
        course = await admin_dal.get_course_all()
        return [ListAdminCourse.model_validate(c) for c in list(course)]
