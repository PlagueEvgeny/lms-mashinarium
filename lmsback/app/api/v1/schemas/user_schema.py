import uuid
from pydantic import BaseModel
from pydantic import EmailStr
from pydantic import validator
from pydantic import constr

from fastapi import HTTPException

from typing import Optional
from typing import List

from decimal import Decimal

from datetime import date

from api.v1.schemas.base_schema import TunedModel

from db.models.user import PortalRole
from utils.letter_pattern import LETTER_MATCH_PATTERN
from utils.letter_pattern import PHONE_MATCH_PATTERN


class ShowUser(TunedModel):
    user_id: uuid.UUID
    last_name: str
    first_name: str
    patronymic: Optional[str] = None
    avatar: Optional[str] = None
    telegram: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    gender: List[str]
    roles: List[str]
    date_of_birth: Optional[date] = None
    balance: Decimal
    is_active: bool



class UserCreate(BaseModel):
    last_name: str
    first_name: str
    patronymic: Optional[str] = None
    avatar: Optional[str] = None
    telegram: Optional[str] = None
    email: EmailStr
    password: str
    phone: Optional[str] = None
    gender: Optional[List[str]] = None
    date_of_birth: Optional[date] = None


    @validator("last_name")
    def validate_last_name(cls, value):
        if not LETTER_MATCH_PATTERN.match(value):
            raise HTTPException(
                    status_code=422, detail="Last Name should contains only letters"
                    )
        return value

    @validator("first_name")
    def validate_first_name(cls, value):
        if not LETTER_MATCH_PATTERN.match(value):
            raise HTTPException(
                    status_code=422, detail="First Name should contains only letters"
                    )
        return value

    @validator("patronymic")
    def validate_patronymic(cls, value):
        if not LETTER_MATCH_PATTERN.match(value):
            raise HTTPException(
                    status_code=422, detail="Patronymic should contains only letters"
                    )
        return value

    @validator('email')
    def email_to_lowercase(cls, v: str):
        return v.lower()


class DeleteUserResponse(BaseModel):
    deleted_user_id: uuid.UUID

class UpdatedUserResponse(BaseModel):
    updated_user_id: uuid.UUID


class UpdateUserRequest(BaseModel):
    last_name: Optional[str] = None
    first_name: Optional[str] = None
    patronymic: Optional[str] = None
    avatar: Optional[str] = None
    telegram: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[List[str]] = None
    date_of_birth: Optional[date] = None

    @validator("last_name")
    def validate_last_name(cls, value):
        if not LETTER_MATCH_PATTERN.match(value):
            raise HTTPException(
                    status_code=422, detail="Last Name should contains only letters"
                    )
        return value

    @validator("first_name")
    def validate_first_name(cls, value):
        if not LETTER_MATCH_PATTERN.match(value):
            raise HTTPException(
                    status_code=422, detail="First Name should contains only letters"
                    )
        return value

    @validator("patronymic")
    def validate_patronymic(cls, value):
        if not LETTER_MATCH_PATTERN.match(value):
            raise HTTPException(
                    status_code=422, detail="Patronymic should contains only letters"
                    )
        return value


class Token(BaseModel):
    access_token: str
    token_type: str



class AddRoleRequest(BaseModel):
    role: PortalRole


class RemoveRoleRequest(BaseModel):
    role: PortalRole


class SetRolesRequest(BaseModel):
    roles: List[PortalRole]
    
    @validator('roles')
    def validate_roles(cls, v):
        if not v or len(v) == 0:
            raise HTTPException(
                status_code=400, 
                detail="User must have at least one role."
            )
        return v
