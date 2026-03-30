from .course import Course
from .module import Module
from .user import User
from .category import Category
from .lesson import (
    LessonBase,
    Lecture,
    VideoLesson,
    Practica,
    TestLesson,
    PracticaSubmission,
    LessonProgress,
    LessonMaterial,
    TestCorrectAnswer,
    TestSubmission,
    TestSubmissionAnswer,
)

# Экспортируем все модели
__all__ = [
    'Course',
    'Module',
    'User',
    'Category',
    "LessonBase",
    "Lecture",
    "VideoLesson",
    "Practica",
    "TestLesson",
    "PracticaSubmission",
    "LessonProgress",
    "LessonMaterial",
    "TestCorrectAnswer",
    "TestSubmission",
    "TestSubmissionAnswer",
]
