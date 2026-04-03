from fastapi import APIRouter

from api.v1.routes.users import user_router
from api.v1.routes.login import auth_router
from api.v1.routes.category import category_router
from api.v1.routes.course import course_router
from api.v1.routes.module import module_router
from api.v1.routes.lesson import lesson_router
from api.v1.routes.lesson_progress import progress_router
from api.v1.routes.practica import practica_router
from api.v1.routes.dialog import dialog_router
from api.v1.routes.messages_ws import messages
from api.v1.routes.admin import admin_router

main_api_router = APIRouter()

main_api_router.include_router(messages, tags=["websocket"])
main_api_router.include_router(user_router, prefix="/user", tags=["user"])
main_api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
main_api_router.include_router(category_router, prefix="/category", tags=["category"])
main_api_router.include_router(course_router, prefix="/course", tags=["course"])
main_api_router.include_router(module_router, prefix="/module", tags=["module"])
main_api_router.include_router(lesson_router, prefix="/lesson", tags=["lesson"])
main_api_router.include_router(progress_router, prefix="/lessons", tags=["progress"])
main_api_router.include_router(practica_router, prefix="/practica", tags=["practica"])
main_api_router.include_router(dialog_router, prefix="/dialog", tags=["dialog"])
main_api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
