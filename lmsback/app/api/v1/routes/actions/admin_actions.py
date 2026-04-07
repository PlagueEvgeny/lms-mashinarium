from typing import List, Union
from uuid import UUID

from db.models.user import User
from db.models.course import Course
from api.v1.schemas.course_schema import ListAdminCourse
from api.v1.schemas.admin_schema import PlatformSettingsResponse, UpdateSettingsRequest 
from services.admin_service import AdminDAL

async def _get_user_by_id(user_id, session) -> Union[User, None]:
    async with session.begin():
        admin_dal = AdminDAL(session)
        user = await admin_dal.get_user_by_id(
            user_id=user_id,
        )
        if user is not None:
            return user

async def _get_user_all(session) -> List[User]:
    async with session.begin():
        admin_dal = AdminDAL(session)
        user = await admin_dal.get_user_all()
        return list(user)

async def _delete_user(user_id, session) -> Union[UUID, None]:
    async with session.begin():
        admin_dal = AdminDAL(session)
        deleted_user_id = await admin_dal.delete_user(user_id=user_id)
        return deleted_user_id

async def _restore_user(user_id, session) -> Union[UUID, None]:
    async with session.begin():
        admin_dal = AdminDAL(session)
        restored_user_id = await admin_dal.restore_user(user_id=user_id)
        return restored_user_id

async def _get_course_by_id(id: int, session) -> Union[Course, None]:
    async with session.begin():
        admin_dal = AdminDAL(session)
        course = await admin_dal.get_course_by_id(id=id)
        if course is not None:
            return course

async def _get_course_all(session) -> List[ListAdminCourse]:
    async with session.begin():
        admin_dal = AdminDAL(session)
        course = await admin_dal.get_course_all()
        return [ListAdminCourse.model_validate(c) for c in list(course)]

async def _delete_course(course_id, session) -> Union[int, None]:
    async with session.begin():
        admin_dal = AdminDAL(session)
        deleted_course_id = await admin_dal.delete_course(course_id=course_id)
        return deleted_course_id

async def _restore_course(course_id, session) -> Union[int, None]:
    async with session.begin():
        admin_dal = AdminDAL(session)
        restored_course_id = await admin_dal.restore_course(course_id=course_id)
        return restored_course_id

async def _get_settings(session) -> PlatformSettingsResponse:
    async with session.begin():
        admin_dal = AdminDAL(session)
        settings = await admin_dal.get_settings()
        if settings is None:
            # Возвращаем дефолтные если ещё не создавались
            settings = await admin_dal.upsert_settings()
        return PlatformSettingsResponse.model_validate(settings)

async def _update_settings(body, session) -> PlatformSettingsResponse:
    async with session.begin():
        admin_dal = AdminDAL(session)
        params = body.model_dump(exclude_none=True)
        settings = await admin_dal.upsert_settings(**params)
        return PlatformSettingsResponse.model_validate(settings)
