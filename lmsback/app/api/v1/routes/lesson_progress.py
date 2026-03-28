from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from db.models.user import User
from api.v1.routes.actions.lesson_progress import _complete_lesson, _get_course_progress
from api.v1.routes.actions.auth_actions import get_current_user_from_token
import logging

logger = logging.getLogger(__name__)


progress_router = APIRouter()

@progress_router.post("/complete/{lesson_slug}", status_code=200)
async def complete_lesson(
        lesson_slug: str,
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user_from_token),
):
    try:
        return await _complete_lesson(lesson_slug, current_user.user_id, session)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@progress_router.get("/progress/{course_slug}", status_code=200)
async def get_course_progress(
        course_slug: str,
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user_from_token),
):
    try:
        ids = await _get_course_progress(course_slug, current_user.user_id, session)
        return {"completed_lesson_ids": ids}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
