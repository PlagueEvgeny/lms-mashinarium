from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from api.v1.schemas.base_schema import TunedModel
from api.v1.schemas.user_schema import ShowUserShort
from uuid import UUID

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
    sender_avatar: Optional[str] = None
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


class ListDialog(TunedModel):
    id: int
    name: Optional[str] = None
    slug: str
    image: Optional[str] =None
    is_active: bool
    course_id: int


class DeletedDialogResponse(BaseModel):
    deleted_dialog_id: int


class UpdatedDialogResponse(BaseModel):
    updated_dialog_id: int | None


class DialogCreate(BaseModel):
    name: Optional[str] = None
    slug: str
    image: Optional[str] = None
    course_id: int


class DialogUpdate(BaseModel):
    name: Optional[str] = None
    image: Optional[str] = None
    is_active: Optional[bool] = None

class AddMembersToDialog(BaseModel):
    members_ids: List[UUID]

class RemoveMemebersFromDialog(BaseModel):
    members_ids: List[UUID]
