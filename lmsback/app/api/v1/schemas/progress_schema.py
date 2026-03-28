from typing import Dict, List

from api.v1.schemas.base_schema import TunedModel


class CourseProgressFullResponse(TunedModel):
    completed_lesson_ids: List[int]
    practica: Dict[str, bool]
    tests: Dict[str, bool]
