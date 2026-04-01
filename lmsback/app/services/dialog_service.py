from typing import List
from typing import Optional
from typing import Union
from uuid import UUID
from sqlalchemy import select
from sqlalchemy import update
from sqlalchemy import and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from db.models.dialog import Dialog
from db.models.user import User
from services.user_service import UserDAL

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

    async def get_dialog_by_id(self, dialog_id: int) -> Union[Dialog, None]:
        result = await self.db_session.execute(
            select(Dialog)
            .where(Dialog.id == dialog_id)
            .options(selectinload(Dialog.members))
        )
        return result.scalar_one_or_none()

    async def delete_dialog(self, id: int) -> Union[int, None]:
        query = update(Dialog).\
                where(and_(Dialog.id == id, Dialog.is_active)).\
                values(is_active=False).\
                returning(Dialog.id)

        result = await self.db_session.execute(query)
        deleted_dialog = result.fetchone()
        if deleted_dialog is not None:
            return deleted_dialog[0]

    async def update_dialog(self, id: int, **kwargs) -> Union[int, None]:
        query = update(Dialog).\
                where(and_(Dialog.id == id, Dialog.is_active)).\
                values(kwargs).\
                returning(Dialog.id)

        result = await self.db_session.execute(query)
        updated_dialog = result.fetchone()
        if updated_dialog is not None:
            return updated_dialog[0]

    async def update_by_course_id(self, course_id: int, **kwargs) -> Union[int, None]:
        query = update(Dialog).\
                where(Dialog.course_id == course_id).\
                values(**kwargs).\
                returning(Dialog.id)
        result = await self.db_session.execute(query)
        updated_dialog = result.fetchone()
        if updated_dialog is not None:
            return updated_dialog[0]

    async def add_members_to_dialog(self, dialog_id: int, members_ids: List[UUID]) -> Union[Dialog, None]:
        dialog = await self.get_dialog_by_id(dialog_id)
        if dialog is None:
            return None

        user_dal = UserDAL(self.db_session)
        members = await user_dal.get_user_by_ids(members_ids)

        if len(members) != len(members_ids):
            raise ValueError("Some users not found")

        existing_ids = {member.user_id for member in dialog.members}
        for member in members:
            if member.user_id not in existing_ids:
                dialog.members.append(member)

        await self.db_session.flush()
        return dialog


    async def remove_members_from_dialog(self, dialog_id: int, members_ids: List[UUID]) -> Union[Dialog, None]:
        dialog = await self.get_dialog_by_id(dialog_id)
        if dialog is None:
            return None

        remaining_members = [
            member for member in dialog.members
            if member.user_id not in members_ids
        ]

        dialog.members = remaining_members
        await self.db_session.flush()
        return dialog


