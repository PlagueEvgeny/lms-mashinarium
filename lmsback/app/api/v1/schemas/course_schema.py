from pydantic import BaseModel
from pydantic import validator
from pydantic import constr

from fastapi import HTTPException

from typing import Optional
from typing import List

from decimal import Decimal

from datetime import datetime

from utils.letter_pattern import LETTER_MATCH_PATTERN
from utils.letter_pattern import PHONE_MATCH_PATTERN


class TunedModel(BaseModel):
    class Config:
        from_attributes = True


class ShowCategory(TunedModel):
    id: int
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    created_at: Optional[datetime] 
    is_active: bool



class CategoryCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None


    @validator("name")
    def validate_last_name(cls, value):
        if not LETTER_MATCH_PATTERN.match(value):
            raise HTTPException(
                    status_code=422, detail="Name should contains only letters"
                    )
        return value

class DeleteCategoryResponse(BaseModel):
    deleted_category_id: int

class UpdatedCategoryResponse(BaseModel):
    updated_category_id: int


class UpdateCategoryRequest(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
