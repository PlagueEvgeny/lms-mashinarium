from typing import List, Union 
from loguru import logger

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from sqlalchemy.ext.asyncio import AsyncSession

from api.v1.routes.actions.auth_actions import get_current_user_from_token
from api.v1.routes.actions.user_actions import check_user_permissions_moderator, check_user_permissions_teahers, check_user_permissions_admin
from api.v1.schemas.dialog_schema import ShowDialog
from api.v1.routes.actions.dialog_actions import _get_user_dialogs, _get_dialog_by_slug
from db.models.user import User
from db.models.dialog import Dialog
from db.session import get_db

dialog_router = APIRouter()

@dialog_router.get("/list", response_model=List[ShowDialog])
async def get_user_dialogs(
                        session: AsyncSession = Depends(get_db),
                        current_user: User = Depends(get_current_user_from_token)
) -> List[ShowDialog]:
    logger.info("Получение диалогов пользователя")
    dialogs = await _get_user_dialogs(session=session, user_id=current_user.user_id)
    if dialogs is None:
        dialogs = []
    return dialogs


@dialog_router.get("/{slug}", response_model=ShowDialog)
async def get_dialog_by_slug(
                        slug: str,
                        session: AsyncSession = Depends(get_db),
                        current_user: User = Depends(get_current_user_from_token)
) -> Union[Dialog, None]:
    logger.info("Получение диалога по slug")
    dialog = await _get_dialog_by_slug(session=session, user_id=current_user.user_id, slug=slug)
    if dialog is None:
        logger.error(f"Диалог {slug} не найден.")
        raise HTTPException(status_code=404, detail=f"Course with slug {slug} not found")
    return dialog
