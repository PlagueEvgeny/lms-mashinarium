from datetime import timedelta
from uuid import UUID

from fastapi.security import OAuth2PasswordRequestForm
from loguru import logger

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import status

from app.api.v1.schemas.user_schema import Token
from app.api.v1.routes.actions.auth import authenticate_user  
from app.db.session import get_db
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from app.utils.security import create_access_token
from app.db.models.user import PortalRole, User

login_router = APIRouter()

@login_router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: AsyncSession = Depends(get_db)):
    user = await authenticate_user(form_data.username, form_data.password, session)
    if not user:
        raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
                )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
            data={"sub": user.email, "other_custom_data": [1, 2, 3, 4]},
            expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

