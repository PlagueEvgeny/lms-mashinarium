from enum import Enum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from sqlalchemy import Column
from sqlalchemy import Text
from sqlalchemy import Boolean
from sqlalchemy import String
from sqlalchemy import Integer
from sqlalchemy import Float
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
        
    modules = relationship("Module", back_populates="lessons", order_by="Module.display_order", lazy="selectin")

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
    # Вопросы теста без правильных ответов (prompt/options/type)
    questions = Column(JSON, nullable=False)

    # Отдельно храним правильные ответы и ответы студентов
    correct_answers = relationship(
        "TestCorrectAnswer",
        back_populates="test_lesson",
        cascade="all, delete-orphan",
    )
    submissions = relationship(
        "TestSubmission",
        back_populates="test_lesson",
        cascade="all, delete-orphan",
    )

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


class TestCorrectAnswer(Base):
    __tablename__ = "test_correct_answers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    test_lesson_id = Column(Integer, ForeignKey("test_lessons.id"), nullable=False)
    question_index = Column(Integer, nullable=False)
    question_type = Column(String, nullable=False)

    correct_option = Column(Integer, nullable=True)
    correct_options = Column(JSON, nullable=True)
    correct_text = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    test_lesson = relationship("TestLesson", back_populates="correct_answers")

    __table_args__ = (
        UniqueConstraint("test_lesson_id", "question_index", name="uq_test_correct_answer"),
    )


class TestSubmission(Base):
    __tablename__ = "test_submissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    test_lesson_id = Column(Integer, ForeignKey("test_lessons.id"), nullable=False)
    user_id = Column(UUID, ForeignKey("users.user_id"), nullable=False)

    total_questions = Column(Integer, nullable=False, default=0)
    checked_questions = Column(Integer, nullable=False, default=0)
    total_score = Column(Float, nullable=False, default=0.0)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    is_draft = Column(Boolean, default=False, nullable=False)

    test_lesson = relationship("TestLesson", back_populates="submissions")
    answers = relationship(
        "TestSubmissionAnswer",
        back_populates="submission",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint("test_lesson_id", "user_id", "is_draft", name="uq_user_test_submission_draft"),
    )


class TestSubmissionAnswer(Base):
    __tablename__ = "test_submission_answers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    submission_id = Column(Integer, ForeignKey("test_submissions.id"), nullable=False)
    question_index = Column(Integer, nullable=False)
    question_type = Column(String, nullable=False)

    selected_option = Column(Integer, nullable=True)
    selected_options = Column(JSON, nullable=True)
    text_answer = Column(Text, nullable=True)

    is_correct = Column(Boolean, nullable=True)
    score = Column(Float, nullable=False, default=0.0)

    submission = relationship("TestSubmission", back_populates="answers")

    __table_args__ = (
        UniqueConstraint("submission_id", "question_index", name="uq_test_submission_answer"),
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
