from pathlib import Path
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from api.v1.schemas.practica_schema import (
    PracticaSubmissionResponse,
    PracticaGradeRequest,
)
from api.v1.routes.actions.auth_actions import get_current_user_from_token
from api.v1.routes.actions.user_actions import check_user_permissions_teahers
from api.v1.routes.actions.practica_actions import (
    _submit_practica,
    _get_my_submission,
    _grade_submission,
    _get_submissions_for_practica,
)
from db.session import get_db
from db.models.user import User
from utils.files import save_multiple_files
from core.config import BASE_URL


practica_router = APIRouter()

PRACTICA_UPLOAD_DIR = Path("media/practica")


@practica_router.post("/{lesson_slug}/submissions", response_model=PracticaSubmissionResponse)
async def submit_practica(
    lesson_slug: str,
    text_answer: Optional[str] = Form(default=None),
    files: list[UploadFile] = File(default_factory=list),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token),
):
    file_urls: Optional[List[str]] = None
    if files:
        file_urls = await save_multiple_files(files=files, upload_dir=PRACTICA_UPLOAD_DIR, base_url=BASE_URL)

    try:
        return await _submit_practica(
            lesson_slug=lesson_slug,
            user_id=current_user.user_id,
            text_answer=text_answer,
            file_urls=file_urls,
            session=session,
        )
    except ValueError as e:
        msg = str(e)
        status_code = 403 if "нет доступа" in msg else 404 if "не найдена" in msg else 400
        raise HTTPException(status_code=status_code, detail=msg)


@practica_router.get("/{lesson_slug}/submissions/me", response_model=PracticaSubmissionResponse)
async def get_my_practica_submission(
    lesson_slug: str,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token),
):
    try:
        return await _get_my_submission(
            lesson_slug=lesson_slug,
            user_id=current_user.user_id,
            session=session,
        )
    except ValueError as e:
        msg = str(e)
        status_code = 403 if "нет доступа" in msg else 404
        raise HTTPException(status_code=status_code, detail=msg)


@practica_router.get("/{lesson_slug}/submissions", response_model=List[PracticaSubmissionResponse])
async def get_practica_submissions_for_teacher(
    lesson_slug: str,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token),
):
    if not check_user_permissions_teahers(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbidden.")

    try:
        return await _get_submissions_for_practica(lesson_slug=lesson_slug, session=session)
    except ValueError as e:
        msg = str(e)
        raise HTTPException(status_code=404, detail=msg)


@practica_router.patch("/{lesson_slug}/submissions/{student_user_id}/grade", response_model=PracticaSubmissionResponse)
async def grade_practica_submission(
    lesson_slug: str,
    student_user_id: UUID,
    body: PracticaGradeRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token),
):
    if not check_user_permissions_teahers(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbidden.")

    try:
        return await _grade_submission(
            lesson_slug=lesson_slug,
            student_user_id=student_user_id,
            score=body.score,
            feedback=body.feedback,
            session=session,
        )
    except ValueError as e:
        msg = str(e)
        status_code = 404 if "не найден" in msg else 400
        raise HTTPException(status_code=status_code, detail=msg)

