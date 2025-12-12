from datetime import date
from typing import Union
from typing import Optional
from typing import List 

from decimal import Decimal

from sqlalchemy import and_, extract
from sqlalchemy import select
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from db.models.course import Category

class CategoryDAL:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
    
    async def get_category_by_id(self, id : int) -> Union[Category, None]:
        query = select(Category).where(Category.id == id)
        result = await self.db_session.execute(query)
        category_row = result.fetchone()
        if category_row is not None:
            return category_row[0]


    async def create_category(
            self,
            name: str,
            slug: Optional[str] = None,
            description: Optional[str] = None,
            image: Optional[str] = None,
            ) -> Category:
    
        new_category = Category(
            name=name,
            slug=slug,
            description=description,
            image=image
        )
        self.db_session.add(new_category)
        await self.db_session.flush()
        return new_category
    
    async def delete_category(self, id: int) -> Union[int, None]:
        query = update(Category).\
                where(and_(Category.id == id, Category.is_active == True)).\
                values(is_active=False).\
                returning(Category.id)

        result = await self.db_session.execute(query)
        deleted_category_id_row = result.fetchone()
        if deleted_category_id_row is not None:
            return deleted_category_id_row[0]

    async def update_category(self, id: int, **kwargs) -> Union[int, None]:
        query = update(Category).\
                where(and_(Category.id == id, Category.is_active == True)).\
                values(kwargs).\
                returning(Category.id)
        result = await self.db_session.execute(query)
        updated_category_id_row = result.fetchone()
        if updated_category_id_row is not None:
            return updated_category_id_row[0]
