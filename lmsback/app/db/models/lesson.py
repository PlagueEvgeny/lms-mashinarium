from enum import Enum
from datetime import datetime
from sqlalchemy import Column
from sqlalchemy import Text
from sqlalchemy import Boolean
from sqlalchemy import String
from sqlalchemy import Integer
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import JSON
from sqlalchemy.orm import relationship

from db.base import Base


class LessonType(str, Enum):
    LECTURE = "lecture"
    VIDEO = "video"
    PRACTICA = "practica"
    TEST = "test"


class LessonBase(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, autoincrement=True)
    module_id = Column(Integer, ForeignKey("modules.id"))
    name = Column(String, nullable=False)
    slug = Column(String, nullable=False, unique=True)
    display_order = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    lesson_type = Column(String, nullable=False)
    
    __mapper_args__ = {
        'polymorphic_on': lesson_type,
        'polymorphic_identity': 'lesson'
    }
        
    modules = relationship("Module", back_populates="lessons", lazy="selectin")


class Lecture(LessonBase):
    __tablename__ = "lectures"

    id = Column(Integer, ForeignKey("lessons.id"), primary_key=True)
    content = Column(Text, nullable=False)
    images = Column(JSON)

    __mapper_args__ = {
        'polymorphic_identity': 'lecture',
        'polymorphic_load': 'selectin'      
    }

