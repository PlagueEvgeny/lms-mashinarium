from fastapi import APIRouter

from api.v1.routes.users import user_router
from api.v1.routes.login import auth_router
from api.v1.routes.course import category_router

main_api_router = APIRouter()

main_api_router.include_router(user_router, prefix="/user", tags=["user"])
main_api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
main_api_router.include_router(category_router, prefix="/category", tags=["category"])
