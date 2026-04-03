from typing import List, Union

from loguru import logger

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from api.v1.routes.actions.auth_actions import get_current_user_from_token
from api.v1.routes.actions.user_actions import check_user_permissions_admin
from core.config import LOG_FILES
from db.models.user import User 
from db.session import get_db
  

admin_router = APIRouter()

@admin_router.get("/logs/all")
async def get_logs_all(
    lines: int = 100,  
    current_user: User = Depends(get_current_user_from_token),
):
    if not check_user_permissions_admin(current_user=current_user):
        raise HTTPException(status_code=403, detail="Forbidden.")
    
    log_path = LOG_FILES 
    try:
        with open(log_path, "r", encoding="utf-8") as f:
            all_lines = f.readlines()
        return {"logs": all_lines[-lines:]}
    except FileNotFoundError:
        return {"logs": []}


@admin_router.get("/logs")
async def get_logs(
    lines: int = 100,  
    current_user: User = Depends(get_current_user_from_token),
):
    if not check_user_permissions_admin(current_user=current_user):
        raise HTTPException(status_code=403, detail="Forbidden.")
    
    log_path = LOG_FILES  # путь к твоему файлу
    try:
        with open(log_path, "r", encoding="utf-8") as f:
            all_lines = f.readlines()
        return {"logs": all_lines[-lines:]}
    except FileNotFoundError:
        return {"logs": []}
