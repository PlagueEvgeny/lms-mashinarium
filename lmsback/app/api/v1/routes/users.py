from typing import List, Union
from uuid import UUID

from loguru import logger

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from api.v1.routes.actions.auth_actions import get_current_user_from_token
from api.v1.schemas.user_schema import ShowUser, UserCreate, DeleteUserResponse, UpdatedUserResponse, UpdateUserRequest
from api.v1.routes.actions.user_actions import _create_new_user, _delete_user, _get_user_by_id, _update_user, check_user_permissions, _get_user_by_email, _get_user_all
from db.models.user import User
from db.session import get_db
  

user_router = APIRouter()

@user_router.get("/me", response_model=ShowUser)
async def get_current_user(session: AsyncSession = Depends(get_db),
                           current_user: User = Depends(get_current_user_from_token)
) -> Union[User, None]:
    user = await _get_user_by_id(current_user.user_id, session)
    return user

@user_router.get("/", response_model=ShowUser)
async def get_user_by_id(user_id: UUID, 
                         session: AsyncSession = Depends(get_db),
                         current_user: User = Depends(get_current_user_from_token),
) -> Union[User, None]:
    logger.info("Получение пользователя по id")
    user = await _get_user_by_id(user_id, session)
    if user is None:
        logger.error(f"Пользователь {user_id} не найден.")
        raise HTTPException(status_code=404, detail=f"User with id {user_id} not found")
    return user

@user_router.get("/all", response_model=List[ShowUser])
async def get_user_all(session: AsyncSession = Depends(get_db),
                       current_user: User = Depends(get_current_user_from_token),
                       ):
    logger.info("Получение пользоватей")
    users = await _get_user_all(session)
    return users

@user_router.post("/", response_model=ShowUser)
async def create_user(body: UserCreate, session: AsyncSession = Depends(get_db)) -> ShowUser:
    user = await _get_user_by_email(body.email, session)
    if user is not None:
        logger.error(f"Почта {user.email} пользователя {body.last_name} {body.first_name} уже используется")
        raise HTTPException(
            status_code=409,
            detail={"name": f"Почта {body.email} уже используется."}
        )
    
    logger.info(f"Пользователь зарегистрировался")
    return await _create_new_user(body, session)


@user_router.delete("/", response_model=DeleteUserResponse)
async def delete_user(user_id: UUID,
                      session: AsyncSession = Depends(get_db),
                      current_user: User = Depends(get_current_user_from_token),
) -> DeleteUserResponse:
    user_for_deletion = await _get_user_by_id(user_id, session)
    if user_for_deletion is None:
        logger.error(f"Пользователь {user_id} не найден.")
        raise HTTPException(status_code=404, detail=f"User with id {user_id} not found.")
    if not check_user_permissions(
            target_user=user_for_deletion,
            current_user=current_user,
            ):
        logger.error(f"У прльзователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail=f"Forbiden.")


    logger.info(f"Происходит удаление пользователя {user_id}.")
    deleted_user_id = await _delete_user(user_id, session)
    if deleted_user_id is None:
        logger.error(f"Пользователь {user_id} не найден.")
        raise HTTPException(status_code=404, detail=f"User with id {user_id} not found.")
    return DeleteUserResponse(deleted_user_id=deleted_user_id)


@user_router.patch("/", response_model=UpdatedUserResponse)
async def update_user_by_id(user_id: UUID, 
                            body: UpdateUserRequest, 
                            session: AsyncSession = Depends(get_db),
                            current_user: User = Depends(get_current_user_from_token),
) -> UpdatedUserResponse:
    updated_user_params = body.dict(exclude_none=True)
    if updated_user_params == {}:
        logger.error("Обновление не может быть пустым")
        raise HTTPException(status_code=422, detail="At least one parametr for user update info should be provided")
    user_for_update = await _get_user_by_id(user_id, session)
    if user_for_update is None:
        logger.error(f"Пользователь {user_id} не найден.")
        raise HTTPException(status_code=404, detail=f"User with id {user_id} not found.")
    if user_id != current_user.user_id:
        if check_user_permissions(
                target_user=user_for_update, current_user=current_user
        ):
            logger.error(f"Пользователь {current_user.name} {current_user.surname} не является администратором")
            raise HTTPException(status_code=403, detail="Forbidden.")
    try:
        update_user_id = await _update_user(updated_user_params=updated_user_params, session=session, user_id=user_id)
    except IntegrityError as err:
        logger.error(err)
        raise HTTPException(status_code=503, detail=f"Database error: {err}")

    return UpdatedUserResponse(updated_user_id=update_user_id)

@user_router.patch("/me", response_model=UpdatedUserResponse)
async def update_current_user(body: UpdateUserRequest, 
                              session: AsyncSession = Depends(get_db),
                              current_user: User = Depends(get_current_user_from_token),
) -> UpdatedUserResponse:
    updated_user_params = body.dict(exclude_none=True)
    if updated_user_params == {}:
        logger.error("Обновление не может быть пустым")
        raise HTTPException(status_code=422, detail="At least one parametr for user update info should be provided")
    user_for_update = await _get_user_by_id(current_user.user_id, session)
    
    try:
        update_user_id = await _update_user(updated_user_params=updated_user_params, session=session, user_id=current_user.user_id)
    except IntegrityError as err:
        logger.error(err)
        raise HTTPException(status_code=503, detail=f"Database error: {err}")

    return UpdatedUserResponse(updated_user_id=update_user_id)


