import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column
from sqlalchemy import Boolean
from sqlalchemy import String

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    last_name = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    patronymic = Column(String, nullable=False)
    telegram = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    is_active = Column(Boolean, default=True)

