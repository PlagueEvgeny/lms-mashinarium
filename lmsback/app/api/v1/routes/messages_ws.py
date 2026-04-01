from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from api.v1.routes.actions.auth_actions import get_current_user_from_token_ws
from api.v1.schemas.dialog_schema import WSHistoryOut, WSIncomingMessage, WSMessageOut
from services.message_service import MessageDAL
from utils.connection_manager import manager
import logging

logger = logging.getLogger(__name__)

messages = APIRouter()

@messages.websocket("/ws/dialogs/{dialog_slug}")
async def dialog_websocket(
        dialog_slug: str,
        websocket: WebSocket,
        token: str = Query(...),
        session: AsyncSession = Depends(get_db),
):
    current_user = await get_current_user_from_token_ws(token, session)
    if not current_user:
        await websocket.close(code=4001)
        return

    message_dal = MessageDAL(session)

    dialog = await message_dal.get_dialog_by_slug(dialog_slug)
    if not dialog:
        await websocket.close(code=4004)
        return

    if not await message_dal.is_member(dialog_slug, current_user.user_id):
        await websocket.close(code=4003)
        return

    await manager.connect(dialog_slug, websocket)

    try:
        messages = await message_dal.get_dialog_messages(dialog.id)
        await websocket.send_json({
            "type": "history",
            "messages": [
                {
                    "id":          m.id,
                    "content":     m.content,
                    "sender_id":   str(m.sender_id),
                    "sender_name": f"{m.sender.first_name} {m.sender.last_name}",
                    "sender_avatar": m.sender.avatar,
                    "created_at":  m.created_at.isoformat(),
                }
                for m in reversed(messages)
            ]
        })

        while True:
            data = await websocket.receive_json()

            try:
                incoming = WSIncomingMessage(**data)
            except Exception:
                await websocket.send_json({"type": "error", "detail": "Неверный формат"})
                continue

            if incoming.type == "message":
                # ← убрали async with session.begin()
                message = await message_dal.create_message(
                    dialog_id=dialog.id,
                    sender_id=current_user.user_id,
                    content=incoming.content,
                    attachments=incoming.attachments,
                )
                await session.commit()  # ← коммитим явно

                out = WSMessageOut(
                    id=message.id,
                    content=message.content,
                    sender_id=str(message.sender_id),
                    sender_name=f"{message.sender.first_name} {message.sender.last_name}",
                    sender_avatar=message.sender.avatar,
                    created_at=message.created_at.isoformat(),
                )
                await manager.broadcast(dialog_slug, out.model_dump())

    except WebSocketDisconnect:
        manager.disconnect(dialog_slug, websocket)
    except Exception as e:
        logger.error(f"WS ошибка: {e}")
        manager.disconnect(dialog_slug, websocket)
