from enum import Enum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from sqlalchemy import Column
from sqlalchemy import Text
from sqlalchemy import Boolean
from sqlalchemy import String
from sqlalchemy import Integer
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import JSON
from sqlalchemy import UniqueConstraint
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
    
    # связь с материалами
    materials = relationship("LessonMaterial", back_populates="lesson", lazy="selectin", cascade="all, delete-orphan")
    
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

class VideoLesson(LessonBase):
    __tablename__ = "video_lessons"

    id = Column(Integer, ForeignKey("lessons.id"), primary_key=True)
    video_url = Column(String, nullable=False)
    duration = Column(Integer)

    __mapper_args__ = {
        "polymorphic_identity": "video",
        "polymorphic_load": "selectin",
    }


class Practica(LessonBase):
    __tablename__ = "practicas"

    id = Column(Integer, ForeignKey("lessons.id"), primary_key=True)
    content = Column(Text, nullable=False)
    attachments = Column(JSON, nullable=True)  # файлы для задания (условие)
    
    max_score = Column(Integer, default=100)  # максимальный балл
    deadline_days = Column(Integer, nullable=True)  # дней на выполнение

    # связь с ответами
    submissions = relationship("PracticaSubmission", back_populates="practica", cascade="all, delete-orphan")

    __mapper_args__ = {
        "polymorphic_identity": "practica",
        "polymorphic_load": "selectin",
    }


class TestLesson(LessonBase):
    __tablename__ = "test_lessons"

    id = Column(Integer, ForeignKey("lessons.id"), primary_key=True)
    # Вопросы теста: [{ "prompt": "...", "options": ["...", "..."] }, ...]
    questions = Column(JSON, nullable=False)

    __mapper_args__ = {
        "polymorphic_identity": "test",
        "polymorphic_load": "selectin",
    }


class PracticaSubmission(Base):
    """Ответы на практическое задание"""
    __tablename__ = "practica_submissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    practica_id = Column(Integer, ForeignKey("practicas.id"), nullable=False)
    user_id = Column(UUID, ForeignKey("users.user_id"), nullable=False)
    
    text_answer = Column(Text, nullable=True)  # текстовый ответ
    files = Column(JSON, nullable=True)  # отправленные файлы
    
    score = Column(Integer, nullable=True)  # оценка
    feedback = Column(Text, nullable=True)  # отзыв
    
    submitted_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_graded = Column(Boolean, default=False)

    practica = relationship("Practica", back_populates="submissions")

    __table_args__ = (
        UniqueConstraint("practica_id", "user_id", name="uq_user_practica"),
    )

class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID, ForeignKey("users.user_id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "lesson_id", name="uq_user_lesson"),
    )

class LessonMaterial(Base):
    """Файловые материалы для занятий"""
    __tablename__ = "lesson_materials"

    id = Column(Integer, primary_key=True, autoincrement=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    
    title = Column(String, nullable=False)
    file_url = Column(String, nullable=False)  # ссылка на файл
    file_type = Column(String, nullable=False)  # pdf, doc, mp4, etc.
    display_order = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    lesson = relationship("LessonBase", back_populates="materials")
