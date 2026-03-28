from typing import Union, Optional, List, Any
from loguru import logger
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from services.lesson_service import LessonDAL
from db.models.lesson import LessonType, LessonMaterial
from api.v1.schemas.lesson_schema import (
    LectureCreate, LectureResponse,
    VideoCreate, VideoResponse,
    PracticaCreate, PracticaResponse,
    TestCreate, TestResponse,
    TestStudentResponse,
    TestCheckResponse,
    TestQuestionCheckResult,
)

LESSON_TYPE_FIELDS = {
    LessonType.LECTURE: ["content", "images"],
    LessonType.VIDEO:   ["video_url", "duration"],
    LessonType.PRACTICA: ["content", "attachments", "max_score", "deadline_days"],
    LessonType.TEST:    ["questions"],
}

LESSON_RESPONSE_MAP = {
    LessonType.LECTURE: LectureResponse,
    LessonType.VIDEO:   VideoResponse,
    LessonType.PRACTICA: PracticaResponse,
    LessonType.TEST:    TestResponse,
}

LESSON_STUDENT_RESPONSE_MAP = {
    LessonType.LECTURE: LectureResponse,
    LessonType.VIDEO:   VideoResponse,
    LessonType.PRACTICA: PracticaResponse,
    LessonType.TEST:    TestStudentResponse,
}

def _jsonable(value: Any) -> Any:
    """
    Приводит Pydantic модели/коллекции к JSON-совместимому виду,
    чтобы SQLAlchemy мог положить это в JSON колонку.
    """
    if value is None:
        return None

    # Pydantic v2
    model_dump = getattr(value, "model_dump", None)
    if callable(model_dump):
        return value.model_dump()

    if isinstance(value, list):
        return [_jsonable(v) for v in value]
    if isinstance(value, dict):
        return {k: _jsonable(v) for k, v in value.items()}

    return value

async def _create_new_lesson(
        body: Union[LectureCreate, VideoCreate, PracticaCreate, TestCreate],
        session: AsyncSession,
) -> Union[LectureResponse, VideoResponse, PracticaResponse, TestResponse]:
    logger.info(f"Создание урока типа: {body.lesson_type}")
    async with session.begin():
        lesson_dal = LessonDAL(session)

        extra_fields = {
            field: _jsonable(getattr(body, field))
            for field in LESSON_TYPE_FIELDS.get(body.lesson_type, [])
            if getattr(body, field, None) is not None
        }

        lesson = await lesson_dal.create_lesson(
            module_id=body.module_id,
            name=body.name,
            slug=body.slug,
            display_order=body.display_order,
            lesson_type=body.lesson_type,
            **extra_fields,
        )

        response_class = LESSON_RESPONSE_MAP[body.lesson_type]
        return response_class.model_validate(lesson)


async def _get_lesson(
        lesson_id: int,
        session: AsyncSession,
) -> Union[LectureResponse, VideoResponse, PracticaResponse, TestResponse]:
    logger.info(f"Получение урока {lesson_id}")
    async with session.begin():
        lesson_dal = LessonDAL(session)
        lesson = await lesson_dal.get_lesson_by_id(lesson_id)

        if lesson is None:
            raise ValueError(f"Урок {lesson_id} не найден")

        response_class = LESSON_RESPONSE_MAP.get(LessonType(lesson.lesson_type))
        if response_class is None:
            raise ValueError(f"Неизвестный тип урока: {lesson.lesson_type}")

        return response_class.model_validate(lesson)


async def _get_lesson_by_slug(
        slug: str,
        session: AsyncSession,
) -> Union[LectureResponse, VideoResponse, PracticaResponse, TestResponse]:
    logger.info(f"Получение урока по slug: {slug}")
    async with session.begin():
        lesson_dal = LessonDAL(session)
        lesson = await lesson_dal.get_lesson_by_slug(slug)

        if lesson is None:
            raise ValueError(f"Урок с slug '{slug}' не найден")

        response_class = LESSON_RESPONSE_MAP.get(LessonType(lesson.lesson_type))
        if response_class is None:
            raise ValueError(f"Неизвестный тип урока: {lesson.lesson_type}")

        return response_class.model_validate(lesson)


async def _get_lesson_by_slug_for_student(
        slug: str,
        user_id: UUID,
        session: AsyncSession,
) -> Union[LectureResponse, VideoResponse, PracticaResponse, TestResponse]:
    logger.info(f"Получение урока {slug} для студента {user_id}")
    async with session.begin():
        lesson_dal = LessonDAL(session)
        lesson = await lesson_dal.get_lesson_by_slug_for_student(slug, user_id)

        if lesson is None:
            raise ValueError(f"Урок с slug '{slug}' не найден или нет доступа к курсу")

        lesson_type = LessonType(lesson.lesson_type)

        response_class = LESSON_STUDENT_RESPONSE_MAP.get(lesson_type)
        if response_class is None:
            raise ValueError(f"Неизвестный тип урока: {lesson.lesson_type}")

        # Тест: скрываем правильные ответы
        if lesson_type == LessonType.TEST:
            raw_questions = lesson.questions or []
            safe_questions = []
            for q in raw_questions:
                if isinstance(q, dict):
                    qq = dict(q)
                    qq.pop("correct_option", None)
                    qq.pop("correct_options", None)
                    qq.pop("correct_text", None)
                    safe_questions.append(qq)
                else:
                    safe_questions.append(q)
            lesson.questions = safe_questions

        return response_class.model_validate(lesson)


async def _check_test_answers(
    lesson_slug: str,
    user_id: UUID,
    answers: list[Any],
    session: AsyncSession,
) -> TestCheckResponse:
    logger.info(f"Проверка теста '{lesson_slug}' для {user_id}")
    async with session.begin():
        lesson_dal = LessonDAL(session)
        lesson = await lesson_dal.get_lesson_by_slug_for_student(lesson_slug, user_id)
        if lesson is None:
            raise ValueError(f"Урок с slug '{lesson_slug}' не найден или нет доступа к курсу")

        if LessonType(lesson.lesson_type) != LessonType.TEST:
            raise ValueError("Указанный урок не является тестом")

        questions = lesson.questions or []
        if not isinstance(questions, list):
            raise ValueError("Некорректный формат questions")

        results: list[TestQuestionCheckResult] = []
        answer_rows: list[dict] = []
        checked = 0
        total_score = 0.0

        for idx, q in enumerate(questions):
            if not isinstance(q, dict):
                results.append(TestQuestionCheckResult(is_correct=None, score=0.0))
                answer_rows.append(
                    {
                        "question_index": idx,
                        "question_type": "single",
                        "is_correct": None,
                        "score": 0.0,
                    }
                )
                continue

            q_type = q.get("question_type") or "single"
            user_answer = answers[idx] if idx < len(answers) else None
            score = 0.0
            is_correct: Optional[bool] = None

            if q_type == "single":
                correct = q.get("correct_option")
                if correct is not None and isinstance(user_answer, int):
                    is_correct = (user_answer == correct)
                    checked += 1
                    score = 1.0 if is_correct else 0.0
            elif q_type == "multiple":
                correct = q.get("correct_options")
                if isinstance(correct, list) and all(isinstance(i, int) for i in correct) and isinstance(user_answer, list):
                    user_set = {int(i) for i in user_answer if isinstance(i, int)}
                    correct_set = set(correct)
                    is_correct = (user_set == correct_set)
                    checked += 1
                    score = 1.0 if is_correct else 0.0
            elif q_type == "text":
                correct_text = q.get("correct_text")
                if isinstance(correct_text, str) and isinstance(user_answer, str):
                    # простая нормализация
                    ua = user_answer.strip().lower()
                    ca = correct_text.strip().lower()
                    if ca:
                        is_correct = (ua == ca)
                        checked += 1
                        score = 1.0 if is_correct else 0.0

            total_score += score
            row: dict[str, Any] = {
                "question_index": idx,
                "question_type": q_type,
                "is_correct": is_correct,
                "score": score,
            }
            if q_type == "single" and isinstance(user_answer, int):
                row["selected_option"] = user_answer
            elif q_type == "multiple" and isinstance(user_answer, list):
                row["selected_options"] = list(user_answer)
            elif q_type == "text" and isinstance(user_answer, str):
                row["text_answer"] = user_answer
            answer_rows.append(row)
            results.append(TestQuestionCheckResult(is_correct=is_correct, score=score))

        await lesson_dal.upsert_test_submission_after_check(
            lesson.id,
            user_id,
            len(questions),
            checked,
            total_score,
            answer_rows,
        )

        return TestCheckResponse(
            total_questions=len(questions),
            checked_questions=checked,
            total_score=total_score,
            results=results,
        )


async def _delete_lesson(lesson_id: int, session: AsyncSession) -> int:
    logger.info(f"Удаление урока {lesson_id}")
    async with session.begin():
        lesson_dal = LessonDAL(session)
        deleted_id = await lesson_dal.delete_lesson(lesson_id)

        if deleted_id is None:
            raise ValueError(f"Урок {lesson_id} не найден или уже удалён")

        logger.info(f"Урок {deleted_id} успешно удалён")
        return deleted_id


async def _create_practica_with_materials(
    body: PracticaCreate,
    materials_data: List[dict[str, Any]],
    session: AsyncSession,
) -> PracticaResponse:
    """
    Создание урока типа PRACTICA + привязка загруженных материалов.
    """
    logger.info(f"Создание практики с материалами: {body.slug}")
    async with session.begin():
        lesson_dal = LessonDAL(session)

        extra_fields = {
            field: getattr(body, field)
            for field in LESSON_TYPE_FIELDS.get(body.lesson_type, [])
            if getattr(body, field, None) is not None
        }

        lesson = await lesson_dal.create_lesson(
            module_id=body.module_id,
            name=body.name,
            slug=body.slug,
            display_order=body.display_order,
            lesson_type=body.lesson_type,
            **extra_fields,
        )

        if materials_data:
            materials = [
                LessonMaterial(
                    lesson_id=lesson.id,
                    title=item["title"],
                    file_url=item["file_url"],
                    file_type=item["file_type"],
                    display_order=item["display_order"],
                )
                for item in materials_data
            ]
            lesson.materials = materials
            await session.flush()

        return PracticaResponse.model_validate(lesson)


async def _update_practica_with_materials(
    lesson_slug: str,
    teacher_user_id: UUID,
    *,
    name: Optional[str],
    content: Optional[str],
    display_order: Optional[int],
    max_score: Optional[int],
    deadline_days: Optional[int],
    materials_data: Optional[List[dict[str, Any]]],
    attachments: Optional[List[str]],
    session: AsyncSession,
) -> PracticaResponse:
    logger.info(f"Обновление практики '{lesson_slug}' преподавателем {teacher_user_id}")
    async with session.begin():
        lesson_dal = LessonDAL(session)
        lesson = await lesson_dal.get_lesson_by_slug_for_teacher(lesson_slug, teacher_user_id)
        if lesson is None:
            raise ValueError(f"Практика с slug '{lesson_slug}' не найдена или нет доступа")

        if LessonType(lesson.lesson_type) != LessonType.PRACTICA:
            raise ValueError("Указанный урок не является практикой")

        if name is not None:
            lesson.name = name
        if display_order is not None:
            lesson.display_order = display_order

        # Поля практики
        if content is not None:
            lesson.content = content
        if max_score is not None:
            lesson.max_score = max_score
        if deadline_days is not None:
            lesson.deadline_days = deadline_days

        # Полная замена материалов (если файлы прислали)
        if materials_data is not None:
            lesson.attachments = attachments

            materials = [
                LessonMaterial(
                    lesson_id=lesson.id,
                    title=item["title"],
                    file_url=item["file_url"],
                    file_type=item["file_type"],
                    display_order=item["display_order"],
                )
                for item in materials_data
            ]
            lesson.materials = materials

        await session.flush()
        return PracticaResponse.model_validate(lesson)


async def _add_lesson_materials(
    lesson_slug: str,
    teacher_user_id: UUID,
    materials_data: List[dict[str, Any]],
    session: AsyncSession,
) -> Union[LectureResponse, VideoResponse, PracticaResponse, TestResponse]:
    """
    Добавляет/заменяет материалы для урока (lecture/video/practica).
    """
    if not materials_data:
        raise ValueError("Материалы не переданы")

    logger.info(f"Добавление материалов для урока '{lesson_slug}' учителем {teacher_user_id}")
    async with session.begin():
        lesson_dal = LessonDAL(session)
        lesson = await lesson_dal.get_lesson_by_slug_for_teacher(lesson_slug, teacher_user_id)
        if lesson is None:
            raise ValueError(f"Урок с slug '{lesson_slug}' не найден или нет доступа")

        materials = [
            LessonMaterial(
                lesson_id=lesson.id,
                title=item["title"],
                file_url=item["file_url"],
                file_type=item["file_type"],
                display_order=item["display_order"],
            )
            for item in materials_data
        ]
        lesson.materials = materials

        response_class = LESSON_RESPONSE_MAP.get(LessonType(lesson.lesson_type))
        if response_class is None:
            raise ValueError(f"Неизвестный тип урока: {lesson.lesson_type}")

        await session.flush()
        return response_class.model_validate(lesson)


async def _update_lesson(
    lesson_id: int,
    teacher_user_id: UUID,
    updated_params: dict[str, Any],
    session: AsyncSession,
) -> Union[LectureResponse, VideoResponse, PracticaResponse, TestResponse]:
    """
    Обновляет lecture/video/practica, в первую очередь для lecture/video (JSON PATCH).
    Материалы обновляются отдельным endpoint'ом.
    """
    logger.info(f"Обновление урока {lesson_id} пользователем {teacher_user_id}")
    async with session.begin():
        lesson_dal = LessonDAL(session)
        lesson = await lesson_dal.get_lesson_by_id(lesson_id)

        if lesson is None:
            raise ValueError(f"Урок {lesson_id} не найден")

        # Права: проверим доступ преподавателя к уроку через курс
        if LessonType(lesson.lesson_type) != LessonType.PRACTICA:
            lesson_for_teacher = await lesson_dal.get_lesson_by_slug_for_teacher(lesson.slug, teacher_user_id)
            if lesson_for_teacher is None:
                raise ValueError("Урок недоступен")

        lesson_type = LessonType(lesson.lesson_type)

        # Общие поля
        if "name" in updated_params and updated_params["name"] is not None:
            lesson.name = updated_params["name"]
        if "display_order" in updated_params and updated_params["display_order"] is not None:
            lesson.display_order = updated_params["display_order"]

        # Поля по типу
        if lesson_type == LessonType.LECTURE:
            if "content" in updated_params and updated_params["content"] is not None:
                lesson.content = updated_params["content"]
            if "images" in updated_params:
                # images ожидается как JSON-совместимое значение (список ссылок) или None
                lesson.images = updated_params["images"]
        elif lesson_type == LessonType.VIDEO:
            if "video_url" in updated_params and updated_params["video_url"] is not None:
                lesson.video_url = updated_params["video_url"]
            if "duration" in updated_params:
                lesson.duration = updated_params["duration"]
        elif lesson_type == LessonType.PRACTICA:
            # Практику обновляем другим endpoint'ом, но на всякий случай поддержим content
            if "content" in updated_params and updated_params["content"] is not None:
                lesson.content = updated_params["content"]
        elif lesson_type == LessonType.TEST:
            if "questions" in updated_params and updated_params["questions"] is not None:
                lesson.questions = _jsonable(updated_params["questions"])
        else:
            raise ValueError(f"Неизвестный тип урока: {lesson.lesson_type}")

        await session.flush()

        response_class = LESSON_RESPONSE_MAP.get(lesson_type)
        if response_class is None:
            raise ValueError(f"Неизвестный тип урока: {lesson.lesson_type}")

        return response_class.model_validate(lesson)
