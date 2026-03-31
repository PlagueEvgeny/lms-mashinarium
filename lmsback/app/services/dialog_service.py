from typing import List
from typing import Optional
from typing import Union
from uuid import UUID
from sqlalchemy import select
from sqlalchemy import and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from db.models.dialog import Dialog
from db.models.user import User

class DialogDAL:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session


    async def create_dialog(
        self,
        course_id: int,
        slug: str,
        name: str,
        members: List[UUID],
        image: Optional[str] = None,

    ) -> Dialog:
    
        dialog = Dialog(
            course_id=course_id,
            slug=slug,
            name=name,
            image=image,
            members=members,
        )

        self.db_session.add(dialog)
        await self.db_session.flush()
        await self.db_session.refresh(dialog, attribute_names=["course"])
        return dialog



    async def get_user_dialog(self, user_id:UUID) -> List[Dialog]:
        query = select(Dialog).\
                options(selectinload(Dialog.members)).\
                where(and_(Dialog.members.any(User.user_id == user_id), Dialog.is_active))
        result = await self.db_session.execute(query)
        dialogs = result.scalars().all()
        return list(dialogs)


    async def get_dialog_by_slug(self, user_id:UUID, slug: str) -> Union[Dialog, None]:
        query = select(Dialog).\
                options(selectinload(Dialog.members)).\
                where(and_(Dialog.slug==slug, Dialog.members.any(User.user_id == user_id), Dialog.is_active))
        result = await self.db_session.execute(query)
        dialog = result.fetchone()
        if dialog is not None:
            return dialog[0]

