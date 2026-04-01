from typing import Optional, List, Any, Union, Annotated, Literal
from enum import Enum
from pydantic import Field
from pydantic import model_validator
from datetime import datetime
from db.models.lesson import LessonType

from api.v1.schemas.base_schema import TunedModel


class LessonMaterialResponse(TunedModel):
    id: int
    title: str
    file_url: str
    file_type: str
    display_order: int
    created_at: datetime


class LessonSummaryForTeacher(TunedModel):
    """Минимальные поля урока для страниц преподавателя (без тела контента)."""
    id: int
    module_id: int
    name: str
    slug: str
    display_order: int
    lesson_type: LessonType


class LessonBaseSchema(TunedModel):
    module_id: int
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    display_order: int = Field(..., ge=0)


class LectureCreate(LessonBaseSchema):
    lesson_type: Literal[LessonType.LECTURE] = LessonType.LECTURE
    content: str = Field(..., min_length=1)
    images: Optional[List[Any]] = None


class VideoCreate(LessonBaseSchema):
    lesson_type: Literal[LessonType.VIDEO] = LessonType.VIDEO
    video_url: str = Field(..., min_length=1)
    duration: Optional[int] = None


class PracticaCreate(LessonBaseSchema):
    lesson_type: Literal[LessonType.PRACTICA] = LessonType.PRACTICA
    content: str = Field(..., min_length=1)
    attachments: Optional[List[Any]] = None
    max_score: Optional[int] = Field(default=100, ge=0)
    deadline_days: Optional[int] = Field(default=None, ge=0)


class TestQuestionType(str, Enum):
    SINGLE = "single"      # один вариант
    MULTIPLE = "multiple"  # несколько вариантов
    TEXT = "text"          # письменный ответ


class TestQuestionBase(TunedModel):
    prompt: str = Field(..., min_length=1)
    question_type: TestQuestionType = Field(default=TestQuestionType.SINGLE)
    # Для single/multiple обязательны варианты, для text — не нужны
    options: Optional[List[str]] = None

    @model_validator(mode="after")
    def _validate_by_type(self):
        if self.question_type == TestQuestionType.TEXT:
            # options игнорируем (может быть None)
            return self

        if not self.options or len([o for o in self.options if isinstance(o, str) and o.strip()]) < 2:
            raise ValueError("Для single/multiple нужно минимум 2 непустых варианта ответа")
        return self


class TestQuestionTeacher(TestQuestionBase):
    # правильные ответы (для автопроверки)
    correct_option: Optional[int] = Field(default=None, ge=0)
    correct_options: Optional[List[int]] = None
    correct_text: Optional[str] = None

    @model_validator(mode="after")
    def _validate_correct(self):
        """
        Правильные ответы НЕ обязаны для отображения вопросов (иначе старые тесты ломают сериализацию).
        Автопроверка учитывает correct_* только если они присутствуют и валидны.
        """
        if self.question_type == TestQuestionType.SINGLE:
            if self.correct_option is None or not self.options:
                return self
            if self.correct_option < 0 or self.correct_option >= len(self.options):
                raise ValueError("correct_option вне диапазона options")

        elif self.question_type == TestQuestionType.MULTIPLE:
            if not self.correct_options or len(self.correct_options) == 0 or not self.options:
                return self
            if any((not isinstance(i, int) or i < 0 or i >= len(self.options)) for i in self.correct_options):
                raise ValueError("Один из correct_options вне диапазона options")

        elif self.question_type == TestQuestionType.TEXT:
            # Можно без correct_text (тогда не автопроверяем).
            return self

        return self


class TestQuestionStudent(TestQuestionBase):
    """
    Версия вопроса для студента: без правильных ответов.
    """
    pass


class TestCreate(LessonBaseSchema):
    lesson_type: Literal[LessonType.TEST] = LessonType.TEST
    questions: List[TestQuestionTeacher] = Field(..., min_length=1)


LessonCreate = Annotated[
    Union[LectureCreate, VideoCreate, PracticaCreate, TestCreate],
    Field(discriminator="lesson_type")
]


class LessonBaseResponse(LessonBaseSchema):
    id: int
    lesson_type: LessonType
    is_active: bool
    created_at: datetime
    updated_at: datetime
    materials: Optional[List[LessonMaterialResponse]] = None


class LectureResponse(LessonBaseResponse):
    lesson_type: Literal[LessonType.LECTURE] = LessonType.LECTURE
    content: str
    images: Optional[List[Any]] = None


class VideoResponse(LessonBaseResponse):
    lesson_type: Literal[LessonType.VIDEO] = LessonType.VIDEO
    video_url: str
    duration: Optional[int] = None


class PracticaResponse(LessonBaseResponse):
    lesson_type: Literal[LessonType.PRACTICA] = LessonType.PRACTICA
    content: str
    attachments: Optional[List[Any]] = None
    max_score: int
    deadline_days: Optional[int] = None


class TestResponse(LessonBaseResponse):
    lesson_type: Literal[LessonType.TEST] = LessonType.TEST
    questions: List[TestQuestionTeacher]


class DeleteResponse(TunedModel):
    deleted_lesson_id: int


LessonResponse = Annotated[
    Union[LectureResponse, VideoResponse, PracticaResponse, TestResponse],
    Field(discriminator="lesson_type")
]


class TestStudentResponse(LessonBaseResponse):
    lesson_type: Literal[LessonType.TEST] = LessonType.TEST
    questions: List[TestQuestionStudent]


LessonStudentResponse = Annotated[
    Union[LectureResponse, VideoResponse, PracticaResponse, TestStudentResponse],
    Field(discriminator="lesson_type")
]


class TestCheckRequest(TunedModel):
    # Ответ студента по одному вопросу
    # payload поддерживает и новый структурированный формат, и legacy-формат
    # (int | list[int] | str | null), чтобы не ломать текущий frontend.
    answers: List[
        Union[
            "TestStudentSingleAnswer",
            "TestStudentMultipleAnswer",
            "TestStudentTextAnswer",
            int,
            List[int],
            str,
            None,
        ]
    ] = Field(..., min_length=1)


class TestStudentSingleAnswer(TunedModel):
    answer_type: Literal["single"] = "single"
    selected_option: Optional[int] = Field(default=None, ge=0)


class TestStudentMultipleAnswer(TunedModel):
    answer_type: Literal["multiple"] = "multiple"
    selected_options: List[int] = Field(default_factory=list)


class TestStudentTextAnswer(TunedModel):
    answer_type: Literal["text"] = "text"
    text: str = ""


class TestCorrectSingleAnswer(TunedModel):
    answer_type: Literal["single"] = "single"
    correct_option: int = Field(..., ge=0)


class TestCorrectMultipleAnswer(TunedModel):
    answer_type: Literal["multiple"] = "multiple"
    correct_options: List[int] = Field(..., min_length=1)


class TestCorrectTextAnswer(TunedModel):
    answer_type: Literal["text"] = "text"
    correct_text: str = Field(..., min_length=1)


class TestQuestionCheckResult(TunedModel):
    is_correct: Optional[bool] = None  # None если не смогли автопроверить (text без correct_text)
    score: float = 0.0
    selected_option: Optional[int] = None
    selected_options: Optional[list[int]] = None
    text_answer: Optional[str] = None

class TestCheckResponse(TunedModel):
    total_questions: int
    checked_questions: int
    total_score: float
    results: List[TestQuestionCheckResult]


class TestSubmissionAnswerTeacherResponse(TunedModel):
    question_index: int
    question_type: str
    selected_option: Optional[int] = None
    selected_options: Optional[List[int]] = None
    text_answer: Optional[str] = None
    is_correct: Optional[bool] = None
    score: float
    prompt: Optional[str] = None
    options: Optional[List[str]] = None


class TestSubmissionTeacherResponse(TunedModel):
    user_id: str
    user_email: Optional[str] = None
    user_first_name: Optional[str] = None
    user_last_name: Optional[str] = None
    lesson_slug: Optional[str] = None
    lesson_name: Optional[str] = None
    total_questions: int
    checked_questions: int
    total_score: float
    submitted_at: datetime
    answers: List[TestSubmissionAnswerTeacherResponse]
