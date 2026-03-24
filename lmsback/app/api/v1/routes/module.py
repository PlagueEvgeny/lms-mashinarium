from typing import Union

from loguru import logger

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from api.v1.routes.actions.auth_actions import get_current_user_from_token
from api.v1.routes.actions.user_actions import check_user_permissions_admin
from api.v1.schemas.module_schema import ShowModule, ModuleCreate, DeleteModuleResponse, UpdateModuleRequest, UpdatedModuleResponse
from api.v1.routes.actions.module_actions import _create_new_module, _get_module_by_id, _delete_module_by_id
from db.models.user import User 
from db.models.module import Module
from db.session import get_db
  

module_router = APIRouter()

@module_router.post("/", response_model=ShowModule)
async def create_module(body: ModuleCreate, 
                          session: AsyncSession = Depends(get_db),
                          current_user: User = Depends(get_current_user_from_token),
                          ) -> ShowModule:
    
    if not check_user_permissions_admin(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbiden.")
    
    logger.info("Категория создана")
    return await _create_new_module(body, session)

@module_router.get("/", response_model=ShowModule)
async def get_module_by_id(id: int, 
                         session: AsyncSession = Depends(get_db),
) -> Union[Module, None]:
    logger.info("Получение модуля по id")
    module = await _get_module_by_id(id, session)
    if module is None:
        logger.error(f"Модуль {id} не найден.")
        raise HTTPException(status_code=404, detail=f"Module with id {id} not found")
    return module

@module_router.delete("/", response_model=DeleteModuleResponse)
async def delete_category(id: int,
                          session: AsyncSession = Depends(get_db),
                          current_user: User = Depends(get_current_user_from_token),
) -> DeleteModuleResponse:
    
    if not check_user_permissions_admin(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbiden.")
    
    module_for_deletion = await _get_module_by_id(id, session)
    
    if module_for_deletion is None:
        logger.error(f"Модуля {id} не найден.")
        raise HTTPException(status_code=404, detail=f"Module with id {id} not found")

    logger.info(f"Происходит удаление модуля {module_for_deletion.name}.")
    deleted_module_id = await _delete_module_by_id(id, session)

    return DeleteModuleResponse(deleted_module_id=deleted_module_id)





