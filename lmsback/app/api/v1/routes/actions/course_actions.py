from typing import List, Union
from uuid import UUID
from loguru import logger
from fastapi import HTTPException

from api.v1.schemas.course_schema import ShowCourse
from api.v1.schemas.category_schema import ShowCategory
from api.v1.schemas.course_schema import CourseCreate
from services.course_service import CourseDAL 
from db.models.course import Course

async def _get_course_by_id(id: int, session) -> Union[Course, None]:
    logger.info(f"Получение категории {id} по id")
    async with session.begin():
        course_dal = CourseDAL(session)
        course = await course_dal.get_course_by_id(id=id)
        if course is not None:
            return course


async def _create_new_course(body: CourseCreate, session) -> ShowCourse:
    logger.info(f"Создание курса")
    async with session.begin():
        course_dal = CourseDAL(session)
        course = await course_dal.create_course(
            name=body.name,
            slug=body.slug,
            short_description=body.short_description,
            description=body.description,
            image=body.image,
            price=body.price,
            status=body.status,
            display_order=body.display_order,
            category_ids=body.category_ids,
            teachers_ids=body.teacher_ids,
        )
        
        # Возвращаем модель с категориями
        return ShowCourse(
            id=course.id,
            name=course.name,
            slug=course.slug,
            short_description=course.short_description,
            description=course.description,
            image=course.image,
            price=course.price,
            status=course.status,
            display_order=course.display_order,
            created_at=course.created_at,
            updated_at=course.updated_at,
            is_active=course.is_active,
            categories=course.categories,
            teachers=course.teachers
        )


async def _delete_course(id: int, session) -> Union[int, None]:
    logger.info(f"Удаление курса")
    async with session.begin():
        course_dal = CourseDAL(session)
        deleted_course_id = await course_dal.delete_course(id=id)
        return deleted_course_id

async def _update_course(updated_course_params: dict, id: int, session) -> Union[int, None]:
    logger.info(f"Обновление курса")
    async with session.begin():
        course_dal = CourseDAL(session)

        category_ids = updated_course_params.pop("category_ids", None)

        updated_course_id = await course_dal.update_course(
            id=id, **updated_course_params,
        )
        
        if category_ids is not None:
            await course_dal.update_course_categories(course_id=id, category_ids=category_ids)

        return updated_course_id


async def _add_teachers_to_course(course_id: int, teacher_ids: List[UUID], session) -> Union[Course, None]:
    logger.info(f"Добавление преподавателей {teacher_ids} к курсу {course_id}")
    async with session.begin():
        course_dal = CourseDAL(session)
        course = await course_dal.add_teachers_to_course(course_id=course_id, teacher_ids=teacher_ids)
        return course

async def _add_students_to_course(course_id: int, student_ids: List[UUID], session) -> Union[Course, None]:
    logger.info(f"Добавление преподавателей {student_ids} к курсу {course_id}")
    async with session.begin():
        course_dal = CourseDAL(session)
        course = await course_dal.add_students_to_course(course_id=course_id, student_ids=student_ids)
        return course

async def _remove_teachers_from_course(course_id: int, teacher_ids: List[UUID],session) -> Union[Course, None]:
    logger.info(f"Удаление преподавателей {teacher_ids} с курса {course_id}")
    async with session.begin():
        course_dal = CourseDAL(session)
        course = await course_dal.remove_teachers_from_course(course_id, teacher_ids)
        return course


async def _remove_students_from_course(course_id: int, student_ids: List[UUID], session) -> Union[Course, None]:
    logger.info(f"Удаление студентов {student_ids} с курса {course_id}")
    async with session.begin():
        course_dal = CourseDAL(session)
        course = await course_dal.remove_students_from_course(course_id, student_ids)
        return course

