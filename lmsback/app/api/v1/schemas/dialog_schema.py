from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from api.v1.schemas.base_schema import TunedModel
from api.v1.schemas.user_schema import ShowUserShort


class WSIncomingMessage(BaseModel):
    type: str
    content: str
    attachments: Optional[str] = None


# --- Исходящие WS сообщения (сервер → клиент) ---

class WSMessageOut(BaseModel):
    id: int
    type: str = "message"
    content: str
    sender_id: str
    sender_name: str
    created_at: str


class WSHistoryOut(BaseModel):
    type: str = "history"
    messages: List[WSMessageOut]


# --- REST схемы ---

class ShowMessage(TunedModel):
    id: int
    dialog_id: int
    content: str
    attachments: Optional[str] = None
    created_at: Optional[datetime] = None
    sender: ShowUserShort


class ShowDialog(TunedModel):
    id: int
    name: Optional[str] = None
    slug: str
    image: Optional[str] = None
    course_id: int
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    members: List[ShowUserShort] = []


class DialogCreate(BaseModel):
    name: Optional[str] = None
    slug: str
    image: Optional[str] = None
    course_id: int
