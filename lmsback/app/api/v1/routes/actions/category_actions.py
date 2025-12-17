from typing import Union
from uuid import UUID
from loguru import logger
from fastapi import HTTPException

from api.v1.schemas.category_schema import ShowCategory
from api.v1.schemas.category_schema import CategoryCreate
from services.category_service import CategoryDAL
from db.models.category import Category

async def _get_category_by_id(id, session) -> Union[Category, None]:
    logger.info(f"Получение категории {id} по id")
    async with session.begin():
        category_dal = CategoryDAL(session)
        category = await category_dal.get_category_by_id(id=id)
        if category is not None:
            return category


async def _create_new_category(body: CategoryCreate, session) -> ShowCategory:
    async with session.begin():
        category_dal = CategoryDAL(session)
        category = await category_dal.create_category(
            name=body.name,
            slug=body.slug,
            description=body.description,
            image=body.image,
            display_order=body.display_order
        )

        return ShowCategory.model_validate(category)


async def _delete_category(id, session) -> Union[int, None]:
    async with session.begin():
        category_dal = CategoryDAL(session)
        deleted_category_id = await category_dal.delete_category(id=id)
        return deleted_category_id

async def _update_category(updated_category_params: dict, id: int, session) -> Union[int, None]:
    async with session.begin():
        category_dal = CategoryDAL(session)
        updated_category_id = await category_dal.update_category(
            id=id, **updated_category_params,
        )
        return updated_category_id
