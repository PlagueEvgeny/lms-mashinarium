from decimal import Decimal
from typing import Union
from typing import Optional
from typing import List 

from fastapi import HTTPException
from sqlalchemy import and_
from sqlalchemy import select
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from services.category_service import CategoryDAL
from db.models.course import Course, Status



class CourseDAL:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
    
    async def get_course_by_id(self, id: int) -> Union[Course, None]:
        query = (
            select(Course)
            .options(selectinload(Course.categories))
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
