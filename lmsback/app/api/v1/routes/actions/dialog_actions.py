from typing import List, Union
from uuid import UUID
from loguru import logger

from api.v1.schemas.dialog_schema import ShowDialog 
from services.dialog_service import DialogDAL


async def _get_user_dialogs(user_id: UUID, session) -> List[ShowDialog]:
    logger.info("Получение диалогов пользователя")
    async with session.begin():
        dialog_dal = DialogDAL(session)
        dialog = await dialog_dal.get_user_dialog(user_id=user_id)
        return list(dialog)


async def _get_dialog_by_slug(user_id: UUID, slug: str, session) -> Union[ShowDialog, None]:
    logger.info("Получение диалога по slug")
    async with session.begin():
        dialog_dal = DialogDAL(session)
        dialog = await dialog_dal.get_dialog_by_slug(user_id=user_id, slug=slug)
        if dialog is not None:
            return dialog
