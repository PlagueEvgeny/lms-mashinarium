from pydantic import BaseModel
from pydantic import validator

from fastapi import HTTPException

from typing import Optional
from datetime import datetime


from api.v1.schemas.base_schema import TunedModel

from utils.letter_pattern import LETTER_MATCH_PATTERN

class ShowCategory(TunedModel):
    id: int
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    created_at: Optional[datetime] 
    is_active: bool
    display_order: int

class CategoryCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    display_order: int

class DeleteCategoryResponse(BaseModel):
    deleted_category_id: int


class UpdatedCategoryResponse(BaseModel):
    updated_category_id: int | None


class UpdateCategoryRequest(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    display_order: Optional[str] = None

