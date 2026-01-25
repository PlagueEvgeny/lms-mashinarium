from datetime import datetime
from sqlalchemy import Column
from sqlalchemy import Text
from sqlalchemy import Boolean
from sqlalchemy import String
from sqlalchemy import Integer
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

from db.base import Base

class LessonBase(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    module_id = Column(Integer, ForeignKey("modules.id"))
    name = Column(String, nullable=False)
    slug = Column(String, nullable=False, unique=True)
    type = Column()
    display_order = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)     
    is_active = Column(Boolean, default=True)

    module = relationship("Module", back_populates="lessons")
