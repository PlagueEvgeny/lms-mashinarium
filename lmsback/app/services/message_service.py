from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from db.models.dialog import Message, Dialog


class MessageDAL:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session

    async def create_message(
            self,
            dialog_id: int,
            sender_id: UUID,
            content: str,
            attachments: str | None = None,
    ) -> Message:
        message = Message(
            dialog_id=dialog_id,
            sender_id=sender_id,
            content=content,
            attachments=attachments,
        )
        self.db_session.add(message)
        await self.db_session.flush()
        await self.db_session.refresh(message, attribute_names=["sender"])
        return message
    
    async def get_dialog_messages(
            self,
            dialog_id: int,
            limit: int = 50,
            offset: int = 0,
    ) -> list[Message]:
        result = await self.db_session.execute(
            select(Message)
            .options(selectinload(Message.sender))
            .where(Message.dialog_id == dialog_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def get_dialog_by_slug(self, dialog_slug: str) -> Dialog | None:
        result = await self.db_session.execute(
            select(Dialog)
            .where(Dialog.slug == dialog_slug, Dialog.is_active == True)
        )
        return result.scalars().first()

    async def is_member(self, dialog_slug: str, user_id: UUID) -> bool:
        result = await self.db_session.execute(
            select(Dialog)
            .where(
                Dialog.slug == dialog_slug,
                Dialog.members.any(user_id=user_id),
                Dialog.is_active == True,
            )
        )
        return result.scalars().first() is not None
