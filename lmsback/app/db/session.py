from typing import Generator

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker

from core.config import REAL_DATABASE_URL


# create async engine for interaction with database

engine = create_async_engine(REAL_DATABASE_URL, future=True, echo=True)



# create session for the interaction with database

async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def get_db() -> Generator:
    try:
        session: AsyncSession = async_session()
        yield session

    finally:
        await session.close()
