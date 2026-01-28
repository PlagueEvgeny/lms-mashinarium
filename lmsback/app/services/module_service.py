from typing import List, Union
from typing import Optional

from sqlalchemy import and_
from sqlalchemy import select
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from db.models.module import Module



class ModuleDAL:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
    
    async def get_module_by_id(self, id: int) -> Union[Module, None]:
        query = select(Module).where(and_(Module.id == id, Module.is_active))
        result = await self.db_session.execute(query)
        module_row = result.fetchone()
        if module_row is not None:
            return module_row[0]
        return None
    
    async def get_modules_by_ids(self, ids: List[int]) -> List[Module]:
        query = select(Module).where(and_(Module.id.in_(ids), Module.is_active))
        result = await self.db_session.execute(query)
        modules = result.scalars().all()
        return list(modules)

    async def create_module(
            self,
            course_id: int,
            name: str,
            display_order: int,
            slug: Optional[str] = None,
            description: Optional[str] = None,
            ) -> Module:
    
        new_module = Module(
            course_id=course_id,
            name=name,
            display_order=display_order,
            slug=slug,
            description=description,
        )
        self.db_session.add(new_module)
        await self.db_session.flush()
        return new_module
    
    async def delete_module(self, id: int) -> Union[int, None]:
        query = update(Module).\
                where(and_(Module.id == id, Module.is_active)).\
                values(is_active=False).\
                returning(Module.id)

        result = await self.db_session.execute(query)
        deleted_module_id_row = result.fetchone()
        if deleted_module_id_row is not None:
            return deleted_module_id_row[0]

    async def update_module(self, id: int, **kwargs) -> Union[int, None]:
        query = update(Module).\
                where(and_(Module.id == id, Module.is_active)).\
                values(kwargs).\
                returning(Module.id)
        result = await self.db_session.execute(query)
        updated_module_id_row = result.fetchone()
        if updated_module_id_row is not None:
            return updated_module_id_row[0]
