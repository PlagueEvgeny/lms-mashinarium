from typing import List, Union
from uuid import UUID
from loguru import logger
from fastapi import HTTPException

from db.models.user import PortalRole, User
from services.admin_service import AdminDAL

async def _get_user_all(session) -> List[User]:
    logger.info("Получение пользователей")
    async with session.begin():
        admin_dal = AdminDAL(session)
        user = await admin_dal.get_user_all()
        return list(user)
