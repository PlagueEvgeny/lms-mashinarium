from typing import List, Union
from uuid import UUID
from loguru import logger

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from api.v1.schemas.admin_schema import ShowUserAdmin, DeleteUserResponse, UpdatedUserResponse
from api.v1.schemas.course_schema import ListAdminCourse
from api.v1.routes.actions.auth_actions import get_current_user_from_token
from api.v1.routes.actions.user_actions import check_user_permissions_admin
from api.v1.routes.actions.admin_actions import _get_user_by_id, _get_user_all, _delete_user, _restore_user, _get_course_all

from core.config import LOG_FILES
from db.models.user import User 
from db.session import get_db
  

admin_router = APIRouter()

@admin_router.get("/user/all", response_model=List[ShowUserAdmin])
async def get_user_all(session: AsyncSession = Depends(get_db),
                       current_user: User = Depends(get_current_user_from_token),
                       ):
    logger.info("Получение пользоватей")
    if not check_user_permissions_admin(current_user=current_user):
        raise HTTPException(status_code=403, detail="Forbidden.")
    users = await _get_user_all(session)
    return users

@admin_router.delete("/user/delete", response_model=DeleteUserResponse)
async def delete_user(user_id: UUID,
                      session: AsyncSession = Depends(get_db),
                      current_user: User = Depends(get_current_user_from_token),
) -> DeleteUserResponse:
    if not check_user_permissions_admin(current_user=current_user):
        raise HTTPException(status_code=403, detail="Forbidden.")
    user_for_deletion = await _get_user_by_id(user_id, session)
    logger.info(f"Деактивация пользователя {user_for_deletion.last_name} {user_for_deletion.first_name} администратором")
    if user_for_deletion is None:
        logger.error(f"Пользователь {user_id} не найден.")
        raise HTTPException(status_code=404, detail=f"User with id {user_id} not found.")

    deleted_user_id = await _delete_user(user_id, session)
    if deleted_user_id is None:
        logger.error(f"Пользователь {user_id} не найден.")
        raise HTTPException(status_code=404, detail=f"User with id {user_id} not found.")
    return DeleteUserResponse(deleted_user_id=deleted_user_id)

@admin_router.patch("/user/restore", response_model=UpdatedUserResponse)
async def restore_user(user_id: UUID,
                      session: AsyncSession = Depends(get_db),
                      current_user: User = Depends(get_current_user_from_token),
) -> UpdatedUserResponse:
    if not check_user_permissions_admin(current_user=current_user):
        raise HTTPException(status_code=403, detail="Forbidden.")
    user_for_deletion = await _get_user_by_id(user_id, session)
    logger.info(f"Aктивация пользователя {user_for_deletion.last_name} {user_for_deletion.first_name} администратором")
    if user_for_deletion is None:
        logger.error(f"Пользователь {user_id} не найден.")
        raise HTTPException(status_code=404, detail=f"User with id {user_id} not found.")

    updated_user_id = await _restore_user(user_id, session)
    if updated_user_id is None:
        logger.error(f"Пользователь {user_id} не найден.")
        raise HTTPException(status_code=404, detail=f"User with id {user_id} not found.")
    return UpdatedUserResponse(updated_user_id=updated_user_id)


@admin_router.get("/course/all", response_model=List[ListAdminCourse])
async def get_course_all(
                        session: AsyncSession = Depends(get_db),
                        current_user: User = Depends(get_current_user_from_token)
) -> List[ListAdminCourse]:
    logger.info("Получение курсов")
    if not check_user_permissions_admin(current_user=current_user):
        raise HTTPException(status_code=403, detail="Forbidden.")
    course = await _get_course_all(session=session)
    if course is None:
        course = []
    return course


@admin_router.get("/logs/all")
async def get_logs_all(
    current_user: User = Depends(get_current_user_from_token),
):
    if not check_user_permissions_admin(current_user=current_user):
        raise HTTPException(status_code=403, detail="Forbidden.")
    
    log_path = LOG_FILES 
    try:
        with open(log_path, "r", encoding="utf-8") as f:
            all_lines = f.readlines()
        return {"logs": all_lines}
    except FileNotFoundError:
        return {"logs": []}


@admin_router.get("/logs")
async def get_logs(
    lines: int = 100,  
    current_user: User = Depends(get_current_user_from_token),
):
    if not check_user_permissions_admin(current_user=current_user):
        raise HTTPException(status_code=403, detail="Forbidden.")
    
    log_path = LOG_FILES  # путь к твоему файлу
    try:
        with open(log_path, "r", encoding="utf-8") as f:
            all_lines = f.readlines()
        return {"logs": all_lines[-lines:]}
    except FileNotFoundError:
        return {"logs": []}
