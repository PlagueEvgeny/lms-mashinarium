from uuid import UUID

from loguru import logger

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.schemas.user_schema import ShowUser, UserCreate, DeleteUserResponse, UpdatedUserResponse, UpdateUserRequest
from app.api.v1.routes.actions.user import _create_new_user, _delete_user, _get_user_by_id, _update_user
from app.db.session import get_db
  

user_router = APIRouter()

@user_router.get("/", response_model=ShowUser)
async def get_user_by_id(user_id: UUID, db: AsyncSession = Depends(get_db)) -> ShowUser:
    logger.info("Получение пользователя по id")
    user = await _get_user_by_id(user_id, db)
    if user is None:
        logger.error(f"Пользователь {user_id} не найден.")
        raise HTTPException(status_code=404, detail=f"User with id {user_id} not found")
    return user

@user_router.post("/", response_model=ShowUser)
async def create_user(body: UserCreate, db: AsyncSession = Depends(get_db)) -> ShowUser:
    logger.info(f"Пользователь зарегистрировался")
    return await _create_new_user(body, db)

@user_router.delete("/", response_model=DeleteUserResponse)
async def delete_user(user_id: UUID, db: AsyncSession = Depends(get_db)) -> DeleteUserResponse:
    logger.info(f"Происходит удаление пользователя {user_id}.")
    deleted_user_id = await _delete_user(user_id, db)
    if deleted_user_id is None:
        logger.error(f"Пользователь {user_id} не найден.")
        raise HTTPException(status_code=404, detail=f"User with id {user_id} not found.")
    return DeleteUserResponse(deleted_user_id=deleted_user_id)

@user_router.patch("/", response_model=UpdatedUserResponse)
async def update_user_by_id(user_id: UUID, body: UpdateUserRequest, db: AsyncSession = Depends(get_db)) -> UpdatedUserResponse:
    updated_user_params = body.dict(exclude_none=True)
    if updated_user_params == {}:
        logger.error("Обновление не может быть пустым")
        raise HTTPException(status_code=422, detail="At least one parametr for user update info should be provided")
    user = await _get_user_by_id(user_id, db)
    if user is None:
        logger.error(f"Пользователь {user_id} не найден.")
        raise HTTPException(status_code=404, detail=f"User with id {user_id} not found.")
    update_user_id = await _update_user(updated_user_params=updated_user_params, db=db, user_id=user_id)
    return UpdatedUserResponse(updated_user_id=update_user_id)


