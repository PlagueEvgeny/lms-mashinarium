from typing import Union
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
from db.session import get_db
from db.models.user import User
from api.v1.routes.actions.lesson_actions import _create_new_lesson
from api.v1.routes.actions.auth_actions import get_current_user_from_token
from api.v1.routes.actions.user_actions import check_user_permissions_admin, check_user_permissions_teahers
from api.v1.schemas.lesson_schema import LessonCreate, LessonResponse, LectureCreate, VideoCreate
  

lesson_router = APIRouter()

@lesson_router.post("/", response_model=LessonResponse)
async def create_lesson(
        body: LessonCreate,
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user_from_token),
):
    if not check_user_permissions_teahers(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbidden.")

    logger.info("Урок создан")
    return await _create_new_lesson(body, session)
