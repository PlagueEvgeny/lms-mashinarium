import uuid

from enum import Enum

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import Column
from sqlalchemy import Boolean
from sqlalchemy import String
from sqlalchemy import Date
from sqlalchemy import DECIMAL

from app.db.base import Base

class PortalRole(str, Enum):
    ROLE_PORTAL_USER = "ROLE_PORTAL_USER"
    ROLE_PORTAL_TEACHER = "ROLE_PORTAL_TEACHER"
    ROLE_PORTAL_MODERATOR = "ROLE_PORTAL_MODERATOR"
    ROLE_PORTAL_ADMIN = "ROLE_PORTAL_ADMIN"


class Gender(str, Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"

class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    last_name = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    patronymic = Column(String, nullable=True)
    avatar = Column(String, nullable=True)
    telegram = Column(String, nullable=True)
    email = Column(String, nullable=False, unique=True)
    phone = Column(String, nullable=True)
    roles = Column(ARRAY(String), nullable=False, default=PortalRole.ROLE_PORTAL_USER)
    gender = Column(ARRAY(String), nullable=False, default=Gender.OTHER)
    date_of_birth = Column(Date, nullable=True)
    balance = Column(DECIMAL(precision=10, scale=2), nullable=False, default=0)
    is_active = Column(Boolean, default=True)

