from typing import List, Union
from uuid import UUID
from loguru import logger
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from api.v1.schemas.admin_schema import ShowUserAdmin, DeleteUserResponse, UpdatedUserResponse, DeleteCourseResponse, UpdatedCourseResponse, PlatformSettingsResponse, UpdateSettingsRequest
from api.v1.schemas.course_schema import ListAdminCourse
from api.v1.routes.actions.auth_actions import get_current_user_from_token
from api.v1.routes.actions.user_actions import check_user_permissions_admin
from api.v1.routes.actions.admin_actions import _get_user_by_id, _get_user_all, _delete_user, _restore_user, _get_course_all, _delete_course, _restore_course, _get_course_by_id, _get_settings, _update_settings

from core.config import LOG_FILES
from db.models.user import User 
from db.session import get_db
from utils.images import save_upload_image
from core.config import BASE_URL

SETTINGS_UPLOAD_DIR = Path("media/settings")

admin_router = APIRouter()

@admin_router.post("/settings/upload-image")
async def upload_course_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_from_token),
) -> dict:
    if not check_user_permissions_admin(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbidden.")

    image_url = await save_upload_image(file, SETTINGS_UPLOAD_DIR, BASE_URL)
    logger.info(f"Изображение загружено пользователем {current_user.email}: {image_url}")
    return {"image_url": image_url}

@admin_router.get("/user/all", response_model=List[ShowUserAdmin])
async def get_user_all(session: AsyncSession = Depends(get_db),
                       current_user: User = Depends(get_current_user_from_token),
                       ):
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

    restore_user_id = await _restore_user(user_id, session)
    if restore_user_id is None:
        logger.error(f"Пользователь {user_id} не найден.")
        raise HTTPException(status_code=404, detail=f"User with id {user_id} not found.")
    return UpdatedUserResponse(updated_user_id=restore_user_id)


@admin_router.get("/course/all", response_model=List[ListAdminCourse])
async def get_course_all(
                        session: AsyncSession = Depends(get_db),
                        current_user: User = Depends(get_current_user_from_token)
) -> List[ListAdminCourse]:
    if not check_user_permissions_admin(current_user=current_user):
        raise HTTPException(status_code=403, detail="Forbidden.")
    course = await _get_course_all(session=session)
    if course is None:
        course = []
    return course


@admin_router.delete("/course/delete", response_model=DeleteCourseResponse)
async def delete_course(course_id: int,
                        session: AsyncSession = Depends(get_db),
                        current_user: User = Depends(get_current_user_from_token),
) -> DeleteCourseResponse:
    if not check_user_permissions_admin(current_user=current_user):
        raise HTTPException(status_code=403, detail="Forbidden.")
    course_for_deletion = await _get_course_by_id(course_id, session)
    logger.info(f"Деактивация курса {course_for_deletion.name} администратором")
    if course_for_deletion is None:
        logger.error(f"Курс {course_id} не найден.")
        raise HTTPException(status_code=404, detail=f"Course with id {course_id} not found.")

    deleted_course_id = await _delete_course(course_id, session)
    if deleted_course_id is None:
        logger.error(f"Курс {course_id} не найден.")
        raise HTTPException(status_code=404, detail=f"Course with id {course_id} not found.")
    return DeleteCourseResponse(deleted_course_id=deleted_course_id)

@admin_router.patch("/course/restore", response_model=UpdatedCourseResponse)
async def restore_course(course_id: int,
                         session: AsyncSession = Depends(get_db),
                         current_user: User = Depends(get_current_user_from_token),
) -> UpdatedCourseResponse:
    if not check_user_permissions_admin(current_user=current_user):
        raise HTTPException(status_code=403, detail="Forbidden.")
    course_for_restore = await _get_course_by_id(course_id, session)
    logger.info(f"Aктивация курса {course_for_restore.name} администратором")
    if course_for_restore is None:
        logger.error(f"Курс {course_id} не найден.")
        raise HTTPException(status_code=404, detail=f"Course with id {course_id} not found.")

    restore_course_id = await _restore_course(course_id, session)
    if restore_course_id is None:
        logger.error(f"Курс {course_id} не найден.")
        raise HTTPException(status_code=404, detail=f"Course with id {course_id} not found.")
    return UpdatedCourseResponse(updated_course_id=restore_course_id)


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


@admin_router.get("/settings", response_model=PlatformSettingsResponse)
async def get_platform_settings(
    session: AsyncSession = Depends(get_db)
):
    return await _get_settings(session)

@admin_router.patch("/settings", response_model=PlatformSettingsResponse)
async def update_platform_settings(
    body: UpdateSettingsRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token),
):
    if not check_user_permissions_admin(current_user=current_user):
        raise HTTPException(status_code=403, detail="Forbidden.")
    return await _update_settings(body=body, session=session)
