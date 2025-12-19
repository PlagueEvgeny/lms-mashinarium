from typing import Union

from loguru import logger

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from api.v1.routes.actions.auth_actions import get_current_user_from_token
from api.v1.routes.actions.user_actions import check_user_permissions_moderator, check_user_permissions_teahers, check_user_permissions_admin
from api.v1.schemas.course_schema import AddStudentsToCourse, AddTeachersToCourse, RemoveStudentsFromCourse, RemoveTeachersFromCourse, ShowCourse, CourseCreate, DeleteCourseResponse, UpdatedCourseResponse, UpdateCourseRequest 
from api.v1.routes.actions.course_actions import _get_course_by_id, _create_new_course, _delete_course, _update_course, _add_students_to_course, _add_teachers_to_course, _remove_students_from_course, _remove_teachers_from_course
from db.models.user import User 
from db.models.course import Course
from db.session import get_db
  

course_router = APIRouter()

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

@course_router.get("/{id}", response_model=ShowCourse)
async def get_category_by_id(id: int, 
                             session: AsyncSession = Depends(get_db),
) -> Union[Course, None]:

    logger.info("Получение категории по id")
    course = await _get_course_by_id(id, session)
    if course is None:
        logger.error(f"Курс {id} не найден.")
        raise HTTPException(status_code=404, detail=f"Course with id {id} not found")
    return course


@course_router.delete("/", response_model=DeleteCourseResponse)
async def delete_course(id: int,
                        session: AsyncSession = Depends(get_db),
                        current_user: User = Depends(get_current_user_from_token),
) -> DeleteCourseResponse:
    
    if not check_user_permissions_admin(current_user=current_user):
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

    course_for_update = await _get_course_by_id(id, session)
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
