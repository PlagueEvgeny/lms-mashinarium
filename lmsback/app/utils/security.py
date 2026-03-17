from datetime import datetime
from datetime import timedelta
from typing import Optional

from jose import jwt

from core.config import SECRET_KEY
from core.config import ALGORITHM
from core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from core.config import REFRESH_TOKEN_EXPIRE_DAYS


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire, "token_type": "access"})
    encoded_jwt = jwt.encode(
        to_encode, SECRET_KEY, algorithm=ALGORITHM
    )
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=REFRESH_TOKEN_EXPIRE_DAYS
        )
    to_encode.update({"exp": expire, "token_type": "refresh"})
    encoded_jwt = jwt.encode(
        to_encode, SECRET_KEY, algorithm=ALGORITHM
    )
    return encoded_jwt
