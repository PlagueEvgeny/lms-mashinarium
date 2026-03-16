from datetime import timedelta

from fastapi.security import OAuth2PasswordRequestForm

from fastapi import APIRouter, Depends, HTTPException, Response, Request

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import status

from api.v1.schemas.user_schema import Token
from api.v1.routes.actions.auth_actions import authenticate_user, verify_token  
from db.session import get_db
from core.config import ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
from utils.security import create_access_token, create_refresh_token

auth_router = APIRouter()

@auth_router.post("/token", response_model=Token)
async def login_for_access_token(
        response: Response,
        form_data: OAuth2PasswordRequestForm = Depends(), 
        session: AsyncSession = Depends(get_db)
):
    user = await authenticate_user(form_data.username.lower() , form_data.password, session)
    if not user:
        raise HTTPException(
                status_code=status.http_401_unauthorized,
                detail="Incorrect email or password"
                )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
            data={"sub": user.email, "other_custom_data": [1, 2, 3, 4]},
            expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": user.email})
    max_age = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

    response.set_cookie(
            key="refresh_token", value=refresh_token, httponly=True,
            secure=True, samesite="lax", max_age=max_age
    )

    return {"access_token": access_token, "token_type": "bearer"}


@auth_router.post("/refresh")
async def refresh_access_token(
        request: Request,
        db: AsyncSession = Depends(get_db)
        ):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
                status_code=status.http_401_unauthorized,
                detail="Refresh token missing."
                )
    user_data = verify_token(refresh_token, "refresh", db)
    if not user_data:
        raise HTTPException(
                status_code=status.http_401_unauthorized,
                detail="Invalid refresh token."
                )

    new_access_token = create_access_token(data={"sub": user_data.email})

    return {"access_token": new_access_token, "token_type": "bearer"}


@auth_router.post("/logout")
async def logout_user(response: Response):
    response.delete_cookie(key="access_token")
    return {'message': 'Пользователь успешно вышел из системы'}
