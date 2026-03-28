from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Body
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
from db.session import get_db
from db.models.user import User
from db.models.lesson import LessonType
from api.v1.routes.actions.lesson_actions import (
    _create_new_lesson,
    _delete_lesson,
    _get_lesson,
    _get_lesson_by_slug,
    _get_lesson_by_slug_for_student,
    _create_practica_with_materials,
    _update_practica_with_materials,
    _add_lesson_materials,
    _update_lesson,
)
from api.v1.routes.actions.auth_actions import get_current_user_from_token
from api.v1.routes.actions.user_actions import check_user_permissions_admin, check_user_permissions_teahers
from api.v1.schemas.lesson_schema import (
    LessonCreate,
    LessonResponse,
    LessonStudentResponse,
    PracticaCreate,
    PracticaResponse,
    TestCheckRequest,
    TestCheckResponse,
)
from utils.images import save_upload_image
from utils.files import save_upload_file
from core.config import BASE_URL 

lesson_router = APIRouter()

LESSON_UPLOAD_DIR = Path("media/lesson")
LESSON_MATERIALS_UPLOAD_DIR = Path("media/lesson/materials")


@lesson_router.patch("/", response_model=LessonResponse)
async def update_lesson(
        lesson_id: int,
        body: dict = Body(...),
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user_from_token),
):
    if not check_user_permissions_teahers(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbidden.")

    try:
        return await _update_lesson(
            lesson_id=lesson_id,
            teacher_user_id=current_user.user_id,
            updated_params=body,
            session=session,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@lesson_router.post("/upload-image/")
async def upload_course_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_from_token),
) -> dict:
    if not check_user_permissions_teahers(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbidden.")

    image_url = await save_upload_image(file, LESSON_UPLOAD_DIR, BASE_URL)
    logger.info(f"Изображение загружено пользователем {current_user.email}: {image_url}")
    return {"image_url": image_url}


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


@lesson_router.post("/practica/", response_model=PracticaResponse)
async def create_practica_lesson(
        module_id: int = Form(...),
        name: str = Form(...),
        slug: str = Form(...),
        display_order: int = Form(..., ge=0),
        content: str = Form(..., min_length=1),
        max_score: int = Form(100, ge=0),
        deadline_days: int | None = Form(None, ge=0),
        materials: list[UploadFile] = File(default_factory=list),
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user_from_token),
):
    if not check_user_permissions_teahers(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbidden.")

    materials_data: list[dict] = []
    attachments: list[str] = []
    for idx, file in enumerate(materials):
        file_url = await save_upload_file(
            file=file,
            upload_dir=LESSON_MATERIALS_UPLOAD_DIR,
            base_url=BASE_URL,
        )
        title = Path(file.filename).stem if file.filename else f"material_{idx + 1}"
        suffix = Path(file.filename).suffix.lower().lstrip(".") if file.filename else "file"
        file_type = file.content_type or suffix or "file"

        attachments.append(file_url)
        materials_data.append(
            {
                "title": title,
                "file_url": file_url,
                "file_type": file_type,
                "display_order": idx,
            }
        )

    attachments_value = attachments if attachments else None
    body = PracticaCreate(
        module_id=module_id,
        name=name,
        slug=slug,
        display_order=display_order,
        lesson_type=LessonType.PRACTICA,
        content=content,
        attachments=attachments_value,
        max_score=max_score,
        deadline_days=deadline_days,
    )

    return await _create_practica_with_materials(
        body=body,
        materials_data=materials_data,
        session=session,
    )


@lesson_router.patch("/practica/{lesson_slug}", response_model=PracticaResponse)
async def update_practica_lesson(
        lesson_slug: str,
        name: str | None = Form(None),
        content: str | None = Form(None),
        display_order: int | None = Form(None, ge=0),
        max_score: int | None = Form(None, ge=0),
        deadline_days: int | None = Form(None, ge=0),
        materials: list[UploadFile] = File(default_factory=list),
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user_from_token),
):
    if not check_user_permissions_teahers(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbidden.")

    materials_data: list[dict] | None = None
    attachments: list[str] | None = None
    if materials:
        materials_data = []
        attachments = []
        for idx, file in enumerate(materials):
            file_url = await save_upload_file(
                file=file,
                upload_dir=LESSON_MATERIALS_UPLOAD_DIR,
                base_url=BASE_URL,
            )
            title = Path(file.filename).stem if file.filename else f"material_{idx + 1}"
            suffix = Path(file.filename).suffix.lower().lstrip(".") if file.filename else "file"
            file_type = file.content_type or suffix or "file"

            attachments.append(file_url)
            materials_data.append(
                {
                    "title": title,
                    "file_url": file_url,
                    "file_type": file_type,
                    "display_order": idx,
                }
            )

    try:
        return await _update_practica_with_materials(
            lesson_slug=lesson_slug,
            teacher_user_id=current_user.user_id,
            name=name,
            content=content,
            display_order=display_order,
            max_score=max_score,
            deadline_days=deadline_days,
            materials_data=materials_data,
            attachments=attachments,
            session=session,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@lesson_router.post("/materials/{lesson_slug}", response_model=LessonResponse)
async def add_lesson_materials(
        lesson_slug: str,
        materials: list[UploadFile] = File(default_factory=list),
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user_from_token),
):
    if not check_user_permissions_teahers(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbidden.")

    if not materials:
        raise HTTPException(status_code=400, detail="No materials files provided")

    materials_data: list[dict] = []
    for idx, file in enumerate(materials):
        file_url = await save_upload_file(
            file=file,
            upload_dir=LESSON_MATERIALS_UPLOAD_DIR,
            base_url=BASE_URL,
        )
        title = Path(file.filename).stem if file.filename else f"material_{idx + 1}"
        suffix = Path(file.filename).suffix.lower().lstrip(".") if file.filename else "file"
        file_type = file.content_type or suffix or "file"
        materials_data.append(
            {
                "title": title,
                "file_url": file_url,
                "file_type": file_type,
                "display_order": idx,
            }
        )

    try:
        return await _add_lesson_materials(
            lesson_slug=lesson_slug,
            teacher_user_id=current_user.user_id,
            materials_data=materials_data,
            session=session,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@lesson_router.get("/", response_model=LessonResponse)
async def get_lesson(
        lesson_id: int,
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user_from_token),
):
    try:
        return await _get_lesson(lesson_id, session)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@lesson_router.get("/student/{slug}", response_model=LessonStudentResponse)
async def get_lesson_by_slug_for_student(
        slug: str,
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user_from_token),
):
    try:
        return await _get_lesson_by_slug_for_student(slug, current_user.user_id, session)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@lesson_router.post("/test/{lesson_slug}/check", response_model=TestCheckResponse)
async def check_test_answers(
    lesson_slug: str,
    body: TestCheckRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token),
):
    try:
        # импорт тут, чтобы не раздувать imports сверху
        from api.v1.routes.actions.lesson_actions import _check_test_answers

        return await _check_test_answers(
            lesson_slug=lesson_slug,
            user_id=current_user.user_id,
            answers=body.answers,
            session=session,
        )
    except ValueError as e:
        msg = str(e)
        status_code = 403 if "нет доступа" in msg else 404 if "не найден" in msg else 400
        raise HTTPException(status_code=status_code, detail=msg)


@lesson_router.get("/by-slug/{slug}", response_model=LessonResponse)
async def get_lesson_by_slug(
        slug: str,
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user_from_token),
):
    try:
        return await _get_lesson_by_slug(slug, session)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
@lesson_router.delete("/", status_code=200)


async def delete_lesson(
        lesson_id: int,
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user_from_token),
):
    if not check_user_permissions_teahers(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbidden.")

    try:
        deleted_id = await _delete_lesson(lesson_id, session)
        return {"deleted_id": deleted_id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
