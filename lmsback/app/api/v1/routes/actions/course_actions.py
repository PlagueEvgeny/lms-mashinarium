from typing import Union
from uuid import UUID
from loguru import logger
from fastapi import HTTPException

from api.v1.schemas.course_schema import ShowCourse
from api.v1.schemas.course_schema import CourseCreate
from services.course_service import CourseDAL 
from db.models.course import Course

async def _get_course_by_id(id, session) -> Union[Course, None]:
    logger.info(f"Получение категории {id} по id")
    async with session.begin():
        course_dal = CourseDAL(session)
        course = await course_dal.get_course_by_id(id=id)
        if course is not None:
            return course

async def _create_new_course(body: CourseCreate, session) -> ShowCourse:
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
            display_order=body.display_order
        )

        return ShowCourse.model_validate(course)


async def _delete_course(id, session) -> Union[int, None]:
    async with session.begin():
        course_dal = CourseDAL(session)
        deleted_course_id = await course_dal.delete_course(id=id)
        return deleted_course_id

async def _update_course(updated_course_params: dict, id: int, session) -> Union[int, None]:
    async with session.begin():
        course_dal = CourseDAL(session)
        updated_course_id = await course_dal.update_course(
            id=id, **updated_course_params,
        )
        return updated_course_id
