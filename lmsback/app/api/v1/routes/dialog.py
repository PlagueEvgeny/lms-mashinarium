from typing import List, Union 
from loguru import logger

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from api.v1.routes.actions.auth_actions import get_current_user_from_token
from api.v1.routes.actions.user_actions import check_user_permissions_moderator, check_user_permissions_teahers, check_user_permissions_admin
from api.v1.schemas.dialog_schema import ShowDialog, DeletedDialogResponse, UpdatedDialogResponse, DialogUpdate, AddMembersToDialog, RemoveMemebersFromDialog
from api.v1.routes.actions.dialog_actions import _get_user_dialogs, _get_dialog_by_slug, _get_dialog_by_id, _delete_dialog, _update_dialog, _add_members_to_dialog, _remove_members_from_dialog
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


@dialog_router.delete("/", response_model=DeletedDialogResponse)
async def delete_dialog(id: int,
                          session: AsyncSession = Depends(get_db),
                          current_user: User = Depends(get_current_user_from_token),
) -> DeletedDialogResponse:
    
    if not check_user_permissions_moderator(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbiden.")
    
    dialog_for_deletion = await _get_dialog_by_id(id, session)
    
    if dialog_for_deletion is None:
        logger.error(f"Диалог {id} не найден.")
        raise HTTPException(status_code=404, detail=f"Dialog with id {id} not found")

    logger.info(f"Происходит удаление диалога {dialog_for_deletion.name}.")
    deleted_id = await _delete_dialog(id, session)
    return DeletedDialogResponse(deleted_dialog_id=deleted_id)


@dialog_router.patch("/", response_model=UpdatedDialogResponse)
async def update_category_by_id(id: int, 
                            body: DialogUpdate, 
                            session: AsyncSession = Depends(get_db),
                            current_user: User = Depends(get_current_user_from_token),
) -> UpdatedDialogResponse:
    
    if not check_user_permissions_moderator(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbiden.")
    
    updated_params = body.dict(exclude_none=True)
    if updated_params == {}:
        logger.error("Обновление не может быть пустым")
        raise HTTPException(status_code=422, detail="At least one parametr for user update info should be provided")

    dialog_for_update = await _get_dialog_by_id(id, session)
    if dialog_for_update is None:
        logger.error(f"Диалог {id} не найден.")
        raise HTTPException(status_code=404, detail=f"Dialog with id {id} not found")
    
    try: 
        update_id = await _update_dialog(updated_params=updated_params, session=session, id=id)
    except IntegrityError as err:
        logger.error(err)
        raise HTTPException(status_code=503, detail=f"Database error: {err}")

    return UpdatedDialogResponse(updated_dialog_id=update_id)

@dialog_router.post("/members/add", response_model=ShowDialog)
async def add_members_to_dialog(dialog_id: int,
                                members_ids: AddMembersToDialog,
                                session: AsyncSession = Depends(get_db),
                                current_user: User = Depends(get_current_user_from_token),
) -> ShowDialog:

    if not check_user_permissions_moderator(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbiden.")

    dialog = await _add_members_to_dialog(dialog_id=dialog_id, members_ids=members_ids.members_ids, session=session)

    if dialog is None:
        logger.error(f"Диалог {dialog_id} не найден.")
        raise HTTPException(status_code=404, detail=f"Dialog with id {id} not found")

    return dialog


@dialog_router.delete("/members/remove", response_model=ShowDialog)
async def remove_members_from_dialog(dialog_id: int,
                                     members_ids: RemoveMemebersFromDialog,
                                     session: AsyncSession = Depends(get_db),
                                     current_user: User = Depends(get_current_user_from_token),
) -> ShowDialog:

    if not check_user_permissions_moderator(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbiden.")

    dialog = await _remove_members_from_dialog(dialog_id=dialog_id, members_ids=members_ids.members_ids, session=session)

    if dialog is None:
        logger.error(f"Диалог {dialog_id} не найден.")
        raise HTTPException(status_code=404, detail=f"Dialog with id {id} not found")

    return dialog
