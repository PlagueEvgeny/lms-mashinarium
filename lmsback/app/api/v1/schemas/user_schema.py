import uuid

from pydantic import BaseModel
from pydantic import EmailStr
from pydantic import validator

from fastapi import HTTPException

from app.utils.letter_pattern import LETTER_MATCH_PATTERN
from app.utils.letter_pattern import PHONE_MATCH_PATTERN


class TunedModel(BaseModel):
    class Config:
        orm_mode = True


class ShowUser(TunedModel):
    user_id: uuid.UUID
    last_name: str
    first_name: str
    patronymic: str
    telegram: str
    email: EmailStr
    is_active: bool


class UserCreate(BaseModel):
    last_name: str
    first_name: str
    patronymic: str
    telegram: str
    email: EmailStr


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


