from typing import List, Union
from uuid import UUID
from loguru import logger

from api.v1.schemas.dialog_schema import ShowDialog, ListDialog 
from services.dialog_service import DialogDAL


async def _get_user_dialogs(user_id: UUID, session) -> List[ListDialog]:
    async with session.begin():
        dialog_dal = DialogDAL(session)
        dialog = await dialog_dal.get_user_dialog(user_id=user_id)
        return list(dialog)

async def _get_dialog_by_slug(user_id: UUID, slug: str, session) -> Union[ShowDialog, None]:
    async with session.begin():
        dialog_dal = DialogDAL(session)
        dialog = await dialog_dal.get_dialog_by_slug(user_id=user_id, slug=slug)
        if dialog is not None:
            return dialog

async def _get_dialog_by_id(id: int, session) -> Union[ShowDialog, None]:
    async with session.begin():
        dialog_dal = DialogDAL(session)
        dialog = await dialog_dal.get_dialog_by_id(id=id)
        if dialog is not None:
            return dialog

async def _delete_dialog(id, session) -> Union[int, None]:
    logger.info("Удаление диалога")
    async with session.begin():
        dialog_dal = DialogDAL(session)
        deleted_id = await dialog_dal.delete_dialog(id=id)
        return deleted_id

async def _update_dialog(updated_params: dict, id: int, session) -> Union[int, None]:
    logger.info("Обновление диалога")
    async with session.begin():
        dialog_dal = DialogDAL(session)
        updated_id = await dialog_dal.update_dialog(
            id=id, **updated_params,
        )
        return updated_id

async def _add_members_to_dialog(dialog_id: int, members_ids: List[UUID], session) -> Union[ShowDialog, None]:
    logger.info(f"Добавление пользователя {members_ids} к диалогу {dialog_id}")
    async with session.begin():
        dialog_dal = DialogDAL(session)
        dialog = await dialog_dal.add_members_to_dialog(dialog_id=dialog_id, members_ids=members_ids)
        return dialog

async def _remove_members_from_dialog(dialog_id: int, members_ids: List[UUID], session) -> Union[ShowDialog, None]:
    logger.info(f"Удаление пользователя {members_ids} с диалога {dialog_id}")
    async with session.begin():
        dialog_dal = DialogDAL(session)
        dialog = await dialog_dal.remove_members_from_dialog(dialog_id, members_ids)
        return dialog
