from .course import Course
from .module import Module
from .user import User
from .dialog import Dialog
from .category import Category
from .settings import PlatformSettings 
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
    'Dialog',
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
    "PlatformSettings",
]
