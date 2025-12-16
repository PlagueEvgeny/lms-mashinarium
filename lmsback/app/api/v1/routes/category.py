from typing import Union

from loguru import logger

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from api.v1.routes.actions.auth_actions import get_current_user_from_token
from api.v1.schemas.category_schema import ShowCategory, CategoryCreate, DeleteCategoryResponse, UpdateCategoryRequest, UpdatedCategoryResponse
from api.v1.routes.actions.category_actions import _create_new_category, _get_category_by_id, _delete_category, _update_category
from db.models.user import User, PortalRole
from db.models.category import Category
from db.session import get_db
  

category_router = APIRouter()

@category_router.post("/", response_model=ShowCategory)
async def create_category(body: CategoryCreate, 
                          session: AsyncSession = Depends(get_db),
                          current_user: User = Depends(get_current_user_from_token),
                          ) -> ShowCategory:
    
    if not PortalRole.ROLE_PORTAL_ADMIN in current_user.roles:
        logger.error(f"У прльзователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail=f"Forbiden.")
    
    logger.info(f"Категория создана")
    return await _create_new_category(body, session)

@category_router.get("/{id}", response_model=ShowCategory)
async def get_category_by_id(id: int, 
                         session: AsyncSession = Depends(get_db),
) -> Union[Category, None]:
    logger.info("Получение категории по id")
    category = await _get_category_by_id(id, session)
    if category is None:
        logger.error(f"Категория {id} не найден.")
        raise HTTPException(status_code=404, detail=f"Category with id {id} not found")
    return category


@category_router.delete("/", response_model=DeleteCategoryResponse)
async def delete_category(id: int,
                          session: AsyncSession = Depends(get_db),
                          current_user: User = Depends(get_current_user_from_token),
) -> DeleteCategoryResponse:
    
    if not PortalRole.ROLE_PORTAL_ADMIN in current_user.roles:
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail=f"Forbiden.")
    
    category_for_deletion = await _get_category_by_id(id, session)
    
    if category_for_deletion is None:
        logger.error(f"Категория {id} не найден.")
        raise HTTPException(status_code=404, detail=f"Category with id {id} not found")

    logger.info(f"Происходит удаление категории {category_for_deletion.name}.")
    deleted_category_id = await _delete_category(id, session)
    if deleted_category_id is None:
        logger.error(f"Категория {id} не найден.")
        raise HTTPException(status_code=404, detail=f"Category with id {id} not found")
    return DeleteCategoryResponse(deleted_category_id=deleted_category_id)


@category_router.patch("/", response_model=UpdatedCategoryResponse)
async def update_category_by_id(id: int, 
                            body: UpdateCategoryRequest, 
                            session: AsyncSession = Depends(get_db),
                            current_user: User = Depends(get_current_user_from_token),
) -> UpdatedCategoryResponse:
    
    if not PortalRole.ROLE_PORTAL_ADMIN in current_user.roles:
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail=f"Forbiden.")
    
    updated_category_params = body.dict(exclude_none=True)
    if updated_category_params == {}:
        logger.error("Обновление не может быть пустым")
        raise HTTPException(status_code=422, detail="At least one parametr for user update info should be provided")

    category_for_update = await _get_category_by_id(id, session)
    if category_for_update is None:
        logger.error(f"Категория {id} не найден.")
        raise HTTPException(status_code=404, detail=f"Category with id {id} not found")
    
    try: 
        update_category_id = await _update_category(updated_category_params=updated_category_params, session=session, id=id)
    except IntegrityError as err:
        logger.error(err)
        raise HTTPException(status_code=503, detail=f"Database error: {err}")

    return UpdatedCategoryResponse(updated_category_id=update_category_id)
