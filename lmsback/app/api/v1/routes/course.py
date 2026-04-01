from typing import List, Union
from pathlib import Path
from loguru import logger

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from api.v1.routes.actions.auth_actions import get_current_user_from_token
from api.v1.routes.actions.user_actions import check_user_permissions_moderator, check_user_permissions_teahers, check_user_permissions_admin
from api.v1.schemas.course_schema import (AddStudentsToCourse, AddTeachersToCourse, ListCourse, RemoveStudentsFromCourse, ShowUserCourse,
                                          RemoveTeachersFromCourse, ShowCourse, CourseCreate, ListTeacherCourse, ShowTeacherCourse,
                                          DeleteCourseResponse, UpdatedCourseResponse, UpdateCourseRequest)
from api.v1.routes.actions.course_actions import (_get_course_by_id, _create_new_course, _delete_course,
                                                  _update_course, _add_students_to_course, _add_teachers_to_course,
                                                  _remove_students_from_course, _remove_teachers_from_course,
                                                  _get_course_by_slug, _get_course_all, _get_course_by_categories,
                                                  _get_user_courses_as_student, _get_user_course_by_slug,
                                                  _get_user_courses_as_teacher, _get_teacher_course_by_slug,
                                                  _get_course_teacher_by_id)
from db.models.user import User
from db.models.course import Course
from db.session import get_db
from utils.images import save_upload_image
from core.config import BASE_URL

course_router = APIRouter()

COURSES_UPLOAD_DIR = Path("media/courses")

@course_router.post("/upload-image/")
async def upload_course_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_from_token),
) -> dict:
    if not check_user_permissions_teahers(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbidden.")

    image_url = await save_upload_image(file, COURSES_UPLOAD_DIR, BASE_URL)
    logger.info(f"Изображение загружено пользователем {current_user.email}: {image_url}")
    return {"image_url": image_url}


@course_router.post("/", response_model=ShowCourse)
async def create_course(body: CourseCreate,
                        session: AsyncSession = Depends(get_db),
                        current_user: User = Depends(get_current_user_from_token),
) -> ShowCourse:

    if not check_user_permissions_teahers(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbidden.")

    logger.info(f"Создание курса пользователем {current_user.email}")
    return await _create_new_course(body, session)

@course_router.get("/", response_model=ShowCourse)
async def get_course_by_slug(slug: str,
                             session: AsyncSession = Depends(get_db),
) -> Union[Course, None]:

    logger.info("Получение категории по slug")
    course = await _get_course_by_slug(slug, session)
    if course is None:
        logger.error(f"Курс {slug} не найден.")
        raise HTTPException(status_code=404, detail=f"Course with slug {slug} not found")
    return course

@course_router.get("/list", response_model=List[ListCourse])
async def get_course_all(session: AsyncSession = Depends(get_db),
                        current_user: User = Depends(get_current_user_from_token)) -> List[ListCourse]:
    logger.info("Получение курсов")
    course = await _get_course_all(user_id=current_user.user_id, session=session)
    if course is None:
        course = []
    return course

@course_router.get("/list/{categories_slug}", response_model=List[ListCourse])
async def get_course_by_categories(categories_slug: str, session: AsyncSession = Depends(get_db)) -> List[ListCourse]:
    logger.info(f"Получение курсов по категории {categories_slug}")
    course = await _get_course_by_categories(categories_slug=categories_slug, session=session)
    if course is None:
        course = []
    return course

@course_router.get("/educations", response_model=List[ListCourse])
async def get_user_courses_as_student(
                        session: AsyncSession = Depends(get_db),
                        current_user: User = Depends(get_current_user_from_token)
) -> List[ListCourse]:
    logger.info("Получение курсов, на которые подписаны пользователи")
    course = await _get_user_courses_as_student(session=session, user_id=current_user.user_id)
    if course is None:
        course = []
    return course

@course_router.get("/educations/{slug}", response_model=ShowUserCourse)
async def get_user_course_by_slug(
                        slug: str,
                        session: AsyncSession = Depends(get_db),
                        current_user: User = Depends(get_current_user_from_token)
) -> Union[Course, None]:
    logger.info("Получение курса по slug, на которые подписаны пользователи")
    course = await _get_user_course_by_slug(session=session, user_id=current_user.user_id, slug=slug)
    if course is None:
        logger.error(f"Курс {slug} не найден.")
        raise HTTPException(status_code=404, detail=f"Course with slug {slug} not found")
    return course

@course_router.get("/teachers", response_model=List[ListTeacherCourse])
async def get_user_courses_as_teacher(
                        session: AsyncSession = Depends(get_db),
                        current_user: User = Depends(get_current_user_from_token)
) -> List[ListCourse]:
    logger.info("Получение курсов, на которые подписаны пользователи")
    course = await _get_user_courses_as_teacher(session=session, user_id=current_user.user_id)
    if course is None:
        course = []
    return course

@course_router.get("/teachers/{slug}", response_model=ShowTeacherCourse)
async def get_teachers_course_by_slug(
                        slug: str,
                        session: AsyncSession = Depends(get_db),
                        current_user: User = Depends(get_current_user_from_token)
) -> Union[Course, None]:
    logger.info("Получение курса по slug, на которые подписаны преподаватели")
    course = await _get_teacher_course_by_slug(session=session, user_id=current_user.user_id, slug=slug)
    if course is None:
        logger.error(f"Курс {slug} не найден.")
        raise HTTPException(status_code=404, detail=f"Course with slug {slug} not found")
    return course

@course_router.delete("/", response_model=DeleteCourseResponse)
async def delete_course(id: int,
                        session: AsyncSession = Depends(get_db),
                        current_user: User = Depends(get_current_user_from_token),
) -> DeleteCourseResponse:

    if not check_user_permissions_teahers(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbiden.")

    course_for_deletion = await _get_course_by_id(id, session)

    if course_for_deletion is None:
        logger.error(f"Курс {id} не найден.")
        raise HTTPException(status_code=404, detail=f"Course with id {id} not found")

    logger.info(f"Происходит удаление курса {course_for_deletion.name}.")
    deleted_course_id = await _delete_course(id, session)
    if deleted_course_id is None:
        logger.error(f"Курса {id} не найден.")
        raise HTTPException(status_code=404, detail=f"Course with id {id} not found")
    return DeleteCourseResponse(deleted_course_id=deleted_course_id)


@course_router.patch("/", response_model=UpdatedCourseResponse)
async def update_course_by_id(id: int,
                              body: UpdateCourseRequest,
                              session: AsyncSession = Depends(get_db),
                              current_user: User = Depends(get_current_user_from_token),
) -> UpdatedCourseResponse:

    if not check_user_permissions_teahers(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbiden.")

    updated_course_params = body.dict(exclude_none=True)
    if updated_course_params == {}:
        logger.error("Обновление не может быть пустым")
        raise HTTPException(status_code=422, detail="At least one parametr for user update info should be provided")

    course_for_update = await _get_course_teacher_by_id(id, session)
    if course_for_update is None:
        logger.error(f"Курс {id} не найден.")
        raise HTTPException(status_code=404, detail=f"Course with id {id} not found")

    try:
        update_course_id = await _update_course(updated_course_params=updated_course_params, session=session, id=id)
    except IntegrityError as err:
        logger.error(err)
        raise HTTPException(status_code=503, detail=f"Database error: {err}")

    return UpdatedCourseResponse(updated_course_id=update_course_id)


@course_router.post("/teachers/add", response_model=ShowCourse)
async def add_teachers_to_course(course_id: int,
                                 teacher_ids: AddTeachersToCourse,
                                 session: AsyncSession = Depends(get_db),
                                 current_user: User = Depends(get_current_user_from_token),
) -> ShowCourse:

    if not check_user_permissions_moderator(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbiden.")

    course = await _add_teachers_to_course(course_id=course_id, teacher_ids=teacher_ids.teacher_ids, session=session)

    if course is None:
        logger.error(f"Курс {id} не найден.")
        raise HTTPException(status_code=404, detail=f"Course with id {id} not found")

    return course


@course_router.delete("/teachers/remove", response_model=ShowCourse)
async def remove_teachers_from_course(course_id: int,
                                      teacher_ids: RemoveTeachersFromCourse,
                                      session: AsyncSession = Depends(get_db),
                                      current_user: User = Depends(get_current_user_from_token),
) -> ShowCourse:

    if not check_user_permissions_moderator(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbiden.")

    course = await _remove_teachers_from_course(course_id=course_id, teacher_ids=teacher_ids.teacher_ids, session=session)

    if course is None:
        logger.error(f"Курс {id} не найден.")
        raise HTTPException(status_code=404, detail=f"Course with id {id} not found")

    return course


@course_router.post("/students/add", response_model=ShowCourse)
async def add_students_to_course(course_id: int,
                                 student_ids: AddStudentsToCourse,
                                 session: AsyncSession = Depends(get_db),
                                 current_user: User = Depends(get_current_user_from_token),
) -> ShowCourse:

    if not check_user_permissions_moderator(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbiden.")

    course = await _add_students_to_course(course_id=course_id, student_ids=student_ids.student_ids, session=session)

    if course is None:
        logger.error(f"Курс {id} не найден.")
        raise HTTPException(status_code=404, detail=f"Course with id {id} not found")

    return course


@course_router.delete("/students/remove", response_model=ShowCourse)
async def remove_students_from_course(course_id: int,
                                      student_ids: RemoveStudentsFromCourse,
                                      session: AsyncSession = Depends(get_db),
                                      current_user: User = Depends(get_current_user_from_token),
) -> ShowCourse:

    if not check_user_permissions_moderator(current_user=current_user):
        logger.error(f"У пользователя {current_user.email} не хватает прав")
        raise HTTPException(status_code=403, detail="Forbiden.")

    course = await _remove_students_from_course(course_id=course_id, student_ids=student_ids.student_ids, session=session)

    if course is None:
        logger.error(f"Курс {id} не найден.")
        raise HTTPException(status_code=404, detail=f"Course with id {id} not found")

    return course
