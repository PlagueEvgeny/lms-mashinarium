from decimal import Decimal
from typing import Union
from typing import Optional
from typing import List 
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import and_
from sqlalchemy import select
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from services.category_service import CategoryDAL
from services.user_service import UserDAL
from db.models.course import Course, Status
from db.models.user import User


class CourseDAL:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
    
    async def get_course_by_id(self, id: int) -> Union[Course, None]:
        query = (
            select(Course)
            .options(selectinload(Course.categories))
            .options(selectinload(Course.teachers))
            .options(selectinload(Course.students))
            .where(Course.id == id)
        )
        result = await self.db_session.execute(query)
        course_row = result.fetchone()
        if course_row is not None:
            return course_row[0]
        return None

    async def get_course_by_slug(self, slug: str) -> Union[Course, None]:
        query = select(Course).where(Course.slug == slug)
        result = await self.db_session.execute(query)
        course_row = result.fetchone()
        if course_row is not None:
            return course_row[0]

    async def create_course(
            self,
            name: str,
            display_order: int,
            status: List[Status],
            category_ids: List[int],
            teachers_ids: List[UUID],
            slug: Optional[str] = None,
            short_description: Optional[str] = None,
            description: Optional[str] = None,
            image: Optional[str] = None,
            price: Optional[Decimal] = None
    ) -> Course:
        
        category_dal = CategoryDAL(self.db_session)
        categories = await category_dal.get_categories_by_ids(category_ids)

        if len(categories) != len(category_ids):
            raise ValueError("Some categories not found")

        user_dal = UserDAL(self.db_session)
        teachers = await user_dal.get_user_by_ids(teachers_ids)

        if len(teachers) != len(teachers_ids):
            raise ValueError("Some users not found")

        # Создаём курс
        new_course = Course(
            name=name,
            slug=slug,
            short_description=short_description,
            description=description,
            image=image,
            price=price if price is not None else Decimal('0'),
            status=status,
            display_order=display_order,
            categories=categories,
            teachers=teachers,
        )
        self.db_session.add(new_course)
        await self.db_session.flush()
        
        
        return new_course

    async def delete_course(self, id: int) -> Union[int, None]:
        query = update(Course).\
                where(and_(Course.id == id, Course.is_active == True)).\
                values(is_active=False).\
                returning(Course.id)

        result = await self.db_session.execute(query)
        deleted_course_id_row = result.fetchone()
        if deleted_course_id_row is not None:
            return deleted_course_id_row[0]

    async def update_course(self, id: int, **kwargs) -> Union[int, None]:
        query = update(Course).\
                where(and_(Course.id == id, Course.is_active == True)).\
                values(kwargs).\
                returning(Course.id)
        result = await self.db_session.execute(query)
        updated_course_id_row = result.fetchone()
        if updated_course_id_row is not None:
            return updated_course_id_row[0]

    async def update_course_categories(self, course_id: int, category_ids: List[int]) -> bool:
        query = select(Course).\
                where(and_(Course.id == course_id, Course.is_active == True)).\
                options(selectinload(Course.categories))
        result = await self.db_session.execute(query)
        course = result.scalar_one_or_none()
        if not course:
            return False

        category_dal = CategoryDAL(self.db_session)
        categories = await category_dal.get_categories_by_ids(category_ids)

        if len(categories) != len(category_ids):
            raise ValueError("Some categories not found")

        course.categories = categories

        await self.db_session.flush()

        return True


    async def add_teachers_to_course(self, course_id: int, teacher_ids: List[UUID]) -> Union[Course, None]:
        course = await self.get_course_by_id(course_id)
        if course is None:
            return None

        user_dal = UserDAL(self.db_session)
        teachers = await user_dal.get_user_by_ids(teacher_ids)

        if len(teachers) != len(teacher_ids):
            raise ValueError("Some users not found")

        existing_ids = {teacher.user_id for teacher in course.teachers}
        for teacher in teachers:
            if teacher.user_id not in existing_ids:
                course.teachers.append(teacher)
        
        await self.db_session.flush()
        return course


    async def remove_teachers_from_course(self, course_id: int, teacher_ids: List[UUID]) -> Union[Course, None]:
        course = await self.get_course_by_id(course_id)
        if course is None:
            return None

        remaining_teachers = [
            teacher for teacher in course.teachers
            if teacher.user_id not in teacher_ids
        ]
        
        if len(remaining_teachers) == 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot remove all teachers. Course must have at least one teacher."
            )
        
        course.teachers = remaining_teachers
        await self.db_session.flush()
        return course

    async def add_students_to_course(self, 
                                     course_id: int, 
                                     student_ids: List[UUID]
    ) -> Union[Course, None]:
            course = await self.get_course_by_id(course_id)
            if course is None:
                return None

            user_dal = UserDAL(self.db_session)
            students = await user_dal.get_user_by_ids(student_ids)

            if len(students) != len(student_ids):
                raise ValueError("Some users not found")

            existing_ids = {student.user_id for student in course.students}
            for student in students:
                if student.user_id not in existing_ids:
                    course.students.append(student)
            
            await self.db_session.flush()
            return course


    async def remove_students_from_course(self, 
                                     course_id: int, 
                                     student_ids: List[UUID]
    ) -> Union[Course, None]:
            course = await self.get_course_by_id(course_id)
            if course is None:
                return None

            remaining_students = [
                student for student in course.students 
                if student.user_id not in student_ids
            ]
                        
            course.students = remaining_students
            await self.db_session.flush()
            return course


    async def get_course_students(self, course_id: int) -> List[User]:
        """Получить список студентов курса"""
        course = await self.get_course_by_id(course_id)
        if course is None:
            return []
        return course.students
    
    async def get_course_teachers(self, course_id: int) -> List[User]:
        """Получить список преподавателей курса"""
        course = await self.get_course_by_id(course_id)
        if course is None:
            return []
        return course.teachers
    
    async def is_user_enrolled(self, course_id: int, user_id: UUID) -> bool:
        """Проверить, записан ли студент на курс"""
        course = await self.get_course_by_id(course_id)
        if course is None:
            return False
        return any(student.user_id == user_id for student in course.students)
    
    async def is_user_teacher(self, course_id: int, user_id: UUID) -> bool:
        """Проверить, является ли пользователь преподавателем курса"""
        course = await self.get_course_by_id(course_id)
        if course is None:
            return False
        return any(teacher.user_id == user_id for teacher in course.teachers)
