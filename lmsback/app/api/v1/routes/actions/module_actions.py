from typing import List, Union
from loguru import logger
from api.v1.schemas.module_schema import ShowModule, ModuleCreate
from services.module_service import ModuleDAL
from db.models.module import Module

async def _create_new_module(body: ModuleCreate, session) -> ShowModule:
    logger.info("Создание модуля")
    async with session.begin():
        module_dal = ModuleDAL(session)
        module = await module_dal.create_module(
            course_id=body.course_id,
            name=body.name,
            display_order=body.display_order,  
            slug=body.slug,
            description=body.description,
        )

        return ShowModule(
            id=module.id,
            course_id=module.course_id,
            name=module.name,
            display_order=module.display_order,              
            slug=module.slug,
            description=module.description,
            created_at=module.created_at,
            updated_at=module.updated_at,
            is_active=module.is_active
        )

async def _update_module(updated_module_params: dict, id: int, session) -> Union[int, None]:
    logger.info("Обновление модуля")
    async with session.begin():
        module_dal = ModuleDAL(session)
        updated_module_id = await module_dal.update_module(
            id=id, **updated_module_params,
        )
        return updated_module_id

async def _get_module_by_id(id, session) -> Union[Module, None]:
    async with session.begin():
        module_dal = ModuleDAL(session)
        module = await module_dal.get_module_by_id(id=id)
        if module is not None:
            # Важно: валидируем/сериализуем внутри контекста сессии
            # (иначе возможны MissingGreenlet при подгрузке JSON полей).
            return ShowModule.model_validate(module)

async def _get_module_by_slug(slug, session) -> Union[Module, None]:
    async with session.begin():
        module_dal = ModuleDAL(session)
        module = await module_dal.get_module_by_slug(slug=slug)
        if module is not None:
            return ShowModule.model_validate(module)

#async def _get_module_list(session) -> List[Module]:
#    logger.info(f"Получение списка модулей")
#    async with session.begin:
#        module_dal = ModuleDAL(session)
#        module = await module_dal.get_module_list()
#        return list(module)

async def _delete_module_by_id(id, session) -> Union[int, None]:
    logger.info(f"Удаление модуля {id} по id")
    async with session.begin():
        module_dal = ModuleDAL(session)
        module = await module_dal.delete_module(id=id)
        return module

