from fastapi import APIRouter

from app.api.v1.routes.users import user_router

main_api_router = APIRouter()

main_api_router.include_router(user_router, prefix="/user", tags=["user"])
