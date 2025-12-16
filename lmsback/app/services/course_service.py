from typing import Union
from typing import Optional
from typing import List 

from sqlalchemy import and_
from sqlalchemy import select
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from db.models.course import Course, Status



class CourseDAL:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
    
    async def get_course_by_id(self, id : int) -> Union[Course, None]:
        query = select(Course).where(Course.id == id)
        result = await self.db_session.execute(query)
        course_row = result.fetchone()
        if course_row is not None:
            return course_row[0]

    async def get_course_by_slug(self, slug : str) -> Union[Course, None]:
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
            slug: Optional[str] = None,
            short_description: Optional[str] = None,
            description: Optional[str] = None,
            image: Optional[str] = None, 
            price: Optional[float] = None
            ) -> Course:
        

        new_course = Course(
            name=name,
            slug=slug,
            short_description=short_description,
            description=description,
            image=image,
            price=price,
            status=status,
            display_order=display_order
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
