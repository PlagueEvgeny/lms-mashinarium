from enum import Enum
from datetime import datetime
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import Column
from sqlalchemy import Text
from sqlalchemy import Boolean
from sqlalchemy import String
from sqlalchemy import Integer
from sqlalchemy import DateTime
from sqlalchemy import Table
from sqlalchemy import ForeignKey
from sqlalchemy import DECIMAL
from sqlalchemy.orm import relationship

from db.base import Base

category_courses = Table('category_courses', Base.metadata,
    Column('category_id', ForeignKey('categories.id'), primary_key=True),
    Column('course_id', ForeignKey('courses.id'), primary_key=True)
)
teacher_courses = Table('teacher_courses', Base.metadata,
    Column('teacher_id', ForeignKey('users.user_id'), primary_key=True),
    Column('course_id', ForeignKey('courses.id'), primary_key=True)
)
student_courses = Table('student_courses', Base.metadata,
    Column('student_id', ForeignKey('users.user_id'), primary_key=True),
    Column('course_id', ForeignKey('courses.id'), primary_key=True)
)

class Status(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    TRASH = "TRASH"


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    slug = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    image = Column(String, nullable=True)
    display_order = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)     
    is_active = Column(Boolean, default=True)

    courses = relationship("Course", secondary="category_courses", back_populates="categories")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    slug = Column(String, nullable=True)
    short_description = Column(String, nullable=True)
    description = Column(Text, nullable=True) 
    image = Column(String, nullable=True)
    price = Column(DECIMAL(precision=10, scale=2), nullable=False, default=0)
    status = Column(ARRAY(String), nullable=False)
    display_order = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)     
    is_active = Column(Boolean, default=True)

    categories = relationship("Category", secondary="category_courses", back_populates="courses")
    teachers = relationship("User", secondary="teacher_courses", back_populates='teacher_courses')
    students = relationship("User", secondary="student_courses", back_populates='student_courses') 
