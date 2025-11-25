from typing import Union

from fastapi import Depends, status
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from jose import JWTError
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.user_service import UserDAL
from app.db.models.user import User

from app.core.config import SECRET_KEY, ALGORITHM
from app.utils.hashing import Hasher
from app.db.session import get_db


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login/token")


async def _get_user_by_email_for_auth(email: str, session: AsyncSession):
    async with session.begin():
        user_dal = UserDAL(session)
        return await user_dal.get_user_by_email(
            email=email,
        )

async def authenticate_user(email: str, password: str, session: AsyncSession) -> Union[User, None]:
    user = await _get_user_by_email_for_auth(email=email, session=session)
    if user is None:
        return
    if not Hasher.verify_password(password, user.hashed_password):
        return
    return user


async def get_current_user_from_token(
    token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        payload = jwt.decode(
            token, SECRET_KEY, algorithms=[ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            logger.error('Отсутсвует почта')
            raise credentials_exception
    except JWTError:
        logger.error(JWTError)
        raise credentials_exception
    user = await _get_user_by_email_for_auth(email=email, session=session)
    if user is None:
        logger.error(f'Пользователь не найден {email}')
        raise credentials_exception
    
    return user
