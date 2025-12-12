from datetime import timedelta

from fastapi.security import OAuth2PasswordRequestForm
from loguru import logger

from fastapi import APIRouter, Depends, HTTPException, Response

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import status

from api.v1.schemas.user_schema import Token
from api.v1.routes.actions.auth_actions import authenticate_user  
from db.session import get_db
from core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from utils.security import create_access_token

auth_router = APIRouter()

@auth_router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: AsyncSession = Depends(get_db)):
    user = await authenticate_user(form_data.username.lower() , form_data.password, session)
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

@auth_router.post("/logout")
async def logout_user(response: Response):
    response.delete_cookie(key="access_token")
    return {'message': 'Пользователь успешно вышел из системы'}
