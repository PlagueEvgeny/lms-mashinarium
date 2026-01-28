from .course import Course
from .module import Module
from .user import User
from .category import Category
from .lesson import LessonBase, Lecture

# Экспортируем все модели
__all__ = ['Course', 'Module', 'User', 'Category', "LessonBase", "Lecture"]
