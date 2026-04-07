from typing import Union, Optional, List, Any
from loguru import logger
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from services.lesson_service import LessonDAL
from services.course_service import CourseDAL
from db.models.lesson import LessonType, LessonMaterial
from api.v1.schemas.lesson_schema import (
    LectureCreate, LectureResponse,
    VideoCreate, VideoResponse,
    PracticaCreate, PracticaResponse,
    TestCreate, TestResponse,
    TestStudentResponse,
    TestCheckResponse,
    TestQuestionCheckResult,
    TestSubmissionTeacherResponse,
    TestSubmissionAnswerTeacherResponse,
    TestStudentSingleAnswer,
    TestStudentMultipleAnswer,
    TestStudentTextAnswer,
)
from db.models.user import User
from sqlalchemy import select

LESSON_TYPE_FIELDS = {
    LessonType.LECTURE: ["content", "images"],
    LessonType.VIDEO:   ["video_url", "duration"],
    LessonType.PRACTICA: ["content", "attachments", "max_score", "deadline_days"],
    LessonType.TEST:    ["questions", "is_visibility"],
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


def _normalize_student_answer(raw_answer: Any, q_type: str) -> Any:
    """
    Приводит ответ студента к единому виду для проверки.
    Поддерживает и новый структурированный формат, и legacy-формат.
    """
    if isinstance(raw_answer, TestStudentSingleAnswer):
        return raw_answer.selected_option if q_type == "single" else None
    if isinstance(raw_answer, TestStudentMultipleAnswer):
        return raw_answer.selected_options if q_type == "multiple" else None
    if isinstance(raw_answer, TestStudentTextAnswer):
        return raw_answer.text if q_type == "text" else None

    if isinstance(raw_answer, dict):
        answer_type = raw_answer.get("answer_type")
        if q_type == "single":
            if answer_type == "single":
                return raw_answer.get("selected_option")
            return raw_answer.get("selected_option", raw_answer.get("answer"))
        if q_type == "multiple":
            if answer_type == "multiple":
                return raw_answer.get("selected_options", [])
            return raw_answer.get("selected_options", raw_answer.get("answer", []))
        if q_type == "text":
            if answer_type == "text":
                return raw_answer.get("text")
            return raw_answer.get("text", raw_answer.get("answer"))
        return None

    return raw_answer


def _split_test_questions_and_correct_answers(questions: list[Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    public_questions: list[dict[str, Any]] = []
    correct_answers: list[dict[str, Any]] = []

    for idx, raw in enumerate(questions or []):
        if not isinstance(raw, dict):
            continue

        question = dict(raw)
        q_type = question.get("question_type") or "single"
        correct_answers.append(
            {
                "question_index": idx,
                "question_type": q_type,
                "correct_option": question.get("correct_option"),
                "correct_options": question.get("correct_options"),
                "correct_text": question.get("correct_text"),
            }
        )

        question.pop("correct_option", None)
        question.pop("correct_options", None)
        question.pop("correct_text", None)
        public_questions.append(question)

    return public_questions, correct_answers


def _merge_questions_with_correct_answers(
    questions: list[Any],
    correct_answers_map: dict[int, Any],
) -> list[Any]:
    merged: list[Any] = []
    for idx, raw in enumerate(questions or []):
        if not isinstance(raw, dict):
            merged.append(raw)
            continue
        question = dict(raw)
        correct_row = correct_answers_map.get(idx)
        if correct_row is not None:
            question["correct_option"] = correct_row.correct_option
            question["correct_options"] = correct_row.correct_options
            question["correct_text"] = correct_row.correct_text
        merged.append(question)
    return merged

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

        test_correct_answers: list[dict[str, Any]] = []
        if body.lesson_type == LessonType.TEST:
            raw_questions = _jsonable(getattr(body, "questions", []) or [])
            public_questions, test_correct_answers = _split_test_questions_and_correct_answers(raw_questions)
            extra_fields["questions"] = public_questions

        lesson = await lesson_dal.create_lesson(
            module_id=body.module_id,
            name=body.name,
            slug=body.slug,
            display_order=body.display_order,
            lesson_type=body.lesson_type,
            **extra_fields,
        )

        if body.lesson_type == LessonType.TEST:
            normalized_questions = [
                {
                    "question_type": item["question_type"],
                    "correct_option": item.get("correct_option"),
                    "correct_options": item.get("correct_options"),
                    "correct_text": item.get("correct_text"),
                }
                for item in sorted(test_correct_answers, key=lambda x: x["question_index"])
            ]
            await lesson_dal.replace_test_correct_answers(lesson.id, normalized_questions)

        response_class = LESSON_RESPONSE_MAP[body.lesson_type]
        return response_class.model_validate(lesson)


async def _get_lesson(
        lesson_id: int,
        session: AsyncSession,
) -> Union[LectureResponse, VideoResponse, PracticaResponse, TestResponse]:
    async with session.begin():
        lesson_dal = LessonDAL(session)
        lesson = await lesson_dal.get_lesson_by_id(lesson_id)

        if lesson is None:
            raise ValueError(f"Урок {lesson_id} не найден")

        response_class = LESSON_RESPONSE_MAP.get(LessonType(lesson.lesson_type))
        if response_class is None:
            raise ValueError(f"Неизвестный тип урока: {lesson.lesson_type}")

        if LessonType(lesson.lesson_type) == LessonType.TEST:
            correct_map = await lesson_dal.get_test_correct_answers_map(test_lesson_id=lesson.id)
            lesson.questions = _merge_questions_with_correct_answers(lesson.questions or [], correct_map)

        return response_class.model_validate(lesson)


async def _get_lesson_by_slug(
        slug: str,
        session: AsyncSession,
) -> Union[LectureResponse, VideoResponse, PracticaResponse, TestResponse]:
    async with session.begin():
        lesson_dal = LessonDAL(session)
        lesson = await lesson_dal.get_lesson_by_slug(slug)

        if lesson is None:
            raise ValueError(f"Урок с slug '{slug}' не найден")

        response_class = LESSON_RESPONSE_MAP.get(LessonType(lesson.lesson_type))
        if response_class is None:
            raise ValueError(f"Неизвестный тип урока: {lesson.lesson_type}")

        if LessonType(lesson.lesson_type) == LessonType.TEST:
            correct_map = await lesson_dal.get_test_correct_answers_map(test_lesson_id=lesson.id)
            lesson.questions = _merge_questions_with_correct_answers(lesson.questions or [], correct_map)

        return response_class.model_validate(lesson)


async def _get_lesson_by_slug_for_student(
        slug: str,
        user_id: UUID,
        session: AsyncSession,
) -> Union[LectureResponse, VideoResponse, PracticaResponse, TestResponse]:
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

        existing_submission = await lesson_dal.get_test_submission(test_lesson_id=lesson.id, user_id=user_id)
        if existing_submission is not None:
            raise ValueError("Тест уже отправлен. Повторная проверка запрещена")

        questions = lesson.questions or []
        if not isinstance(questions, list):
            raise ValueError("Некорректный формат questions")

        correct_answers_map = await lesson_dal.get_test_correct_answers_map(test_lesson_id=lesson.id)

        results: list[TestQuestionCheckResult] = []
        checked = 0
        total_score = 0.0
        answers_for_db: list[dict[str, Any]] = []

        for idx, q in enumerate(questions):
            if not isinstance(q, dict):
                results.append(TestQuestionCheckResult(is_correct=None, score=0.0))
                continue

            q_type = q.get("question_type") or "single"
            raw_user_answer = answers[idx] if idx < len(answers) else None
            user_answer = _normalize_student_answer(raw_user_answer, q_type)
            score = 0.0
            is_correct: Optional[bool] = None
            correct_row = correct_answers_map.get(idx)

            if q_type == "single":
                correct = correct_row.correct_option if correct_row is not None else None
                if correct is not None and isinstance(user_answer, int):
                    is_correct = (user_answer == correct)
                    checked += 1
                    score = 1.0 if is_correct else 0.0
            elif q_type == "multiple":
                correct = correct_row.correct_options if correct_row is not None else None
                if isinstance(correct, list) and all(isinstance(i, int) for i in correct) and isinstance(user_answer, list):
                    user_set = {int(i) for i in user_answer if isinstance(i, int)}
                    correct_set = set(correct)
                    is_correct = (user_set == correct_set)
                    checked += 1
                    score = 1.0 if is_correct else 0.0
            elif q_type == "text":
                correct_text = correct_row.correct_text if correct_row is not None else None
                if isinstance(correct_text, str) and isinstance(user_answer, str):
                    # простая нормализация
                    ua = user_answer.strip().lower()
                    ca = correct_text.strip().lower()
                    if ca:
                        is_correct = (ua == ca)
                        checked += 1
                        score = 1.0 if is_correct else 0.0

            total_score += score
            results.append(TestQuestionCheckResult(is_correct=is_correct, score=score))
            answers_for_db.append(
                {
                    "question_index": idx,
                    "question_type": q_type,
                    "selected_option": user_answer if isinstance(user_answer, int) else None,
                    "selected_options": user_answer if isinstance(user_answer, list) else None,
                    "text_answer": user_answer if isinstance(user_answer, str) else None,
                    "is_correct": is_correct,
                    "score": score,
                }
            )

        # Удаляем черновик, если есть
        draft = await lesson_dal.get_test_draft(test_lesson_id=lesson.id, user_id=user_id)
        if draft:
            # Удаляем черновик (ответы удалятся каскадом)
            await session.delete(draft)
            await session.flush()

        await lesson_dal.create_test_submission(
            test_lesson_id=lesson.id,
            user_id=user_id,
            total_questions=len(questions),
            checked_questions=checked,
            total_score=total_score,
            answers=answers_for_db,
        )

        return TestCheckResponse(
            total_questions=len(questions),
            checked_questions=checked,
            total_score=total_score,
            results=results,
        )


async def _get_test_result(
    lesson_slug: str,
    user_id: UUID,
    session: AsyncSession,
) -> TestCheckResponse:
    logger.info(f"Получение результата теста '{lesson_slug}' для {user_id}")
    async with session.begin():
        lesson_dal = LessonDAL(session)
        lesson = await lesson_dal.get_lesson_by_slug_for_student(lesson_slug, user_id)
        if lesson is None:
            raise ValueError(f"Урок с slug '{lesson_slug}' не найден или нет доступа к курсу")

        if LessonType(lesson.lesson_type) != LessonType.TEST:
            raise ValueError("Указанный урок не является тестом")

        submission = await lesson_dal.get_test_submission_with_answers(test_lesson_id=lesson.id, user_id=user_id)
        if submission is None:
            raise ValueError("Тест еще не отправлялся")

        sorted_answers = sorted(submission.answers or [], key=lambda x: x.question_index)
        results = [
            TestQuestionCheckResult(
                is_correct=item.is_correct,
                score=float(item.score or 0.0),
                selected_option=item.selected_option,       # [+]
                selected_options=item.selected_options,     # [+]
                text_answer=item.text_answer,               # [+]
            )
            for item in sorted_answers
        ]

        return TestCheckResponse(
            total_questions=submission.total_questions,
            checked_questions=submission.checked_questions,
            total_score=float(submission.total_score or 0.0),
            results=results,
        )


async def _get_test_submissions_for_teacher(
    lesson_slug: str,
    session: AsyncSession,
) -> list[TestSubmissionTeacherResponse]:
    logger.info(f"Получение отправок теста '{lesson_slug}' для преподавателя")
    async with session.begin():
        lesson_dal = LessonDAL(session)
        lesson = await lesson_dal.get_lesson_by_slug(lesson_slug)
        if lesson is None:
            raise ValueError(f"Урок с slug '{lesson_slug}' не найден")
        if LessonType(lesson.lesson_type) != LessonType.TEST:
            raise ValueError("Указанный урок не является тестом")
        submissions = await lesson_dal.get_test_submissions_with_answers(test_lesson_id=lesson.id)
        if not submissions:
            return []

        questions_map = {i: q for i, q in enumerate(lesson.questions or {})}

        user_ids = [s.user_id for s in submissions]
        r = await session.execute(select(User.user_id, User.email, User.first_name, User.last_name).where(User.user_id.in_(user_ids)))
        user_data: dict[UUID, dict] = {row[0]: {"email": row[1], "first_name": row[2], "last_name": row[3]} for row in r.all()}
        result: list[TestSubmissionTeacherResponse] = []
        for s in submissions:
            answers_sorted = sorted(s.answers or [], key=lambda x: x.question_index)
            answers = [
                TestSubmissionAnswerTeacherResponse(
                    question_index=a.question_index,
                    question_type=a.question_type,
                    selected_option=a.selected_option,
                    selected_options=a.selected_options,
                    text_answer=a.text_answer,
                    is_correct=a.is_correct,
                    score=float(a.score or 0.0),
                    prompt=questions_map.get(a.question_index, {}).get("prompt"),    # [+]
                    options=questions_map.get(a.question_index, {}).get("options"),  # [+]
                )
                for a in answers_sorted
            ]
            user_info = user_data.get(s.user_id, {})
            result.append(
                TestSubmissionTeacherResponse(
                    user_id=str(s.user_id),
                    user_email=user_info.get("email"),
                    user_first_name=user_info.get("first_name"),
                    user_last_name=user_info.get("last_name"),
                    total_questions=s.total_questions,
                    checked_questions=s.checked_questions,
                    total_score=float(s.total_score or 0.0),
                    submitted_at=s.submitted_at,
                    answers=answers,
                )
            )
        return result

async def _get_test_submissions_for_teacher_by_course(
    course_slug: str,
    teacher_user_id: UUID,
    session: AsyncSession,
) -> list[TestSubmissionTeacherResponse]:
    logger.info(f"Получение отправок тестов курса '{course_slug}' для преподавателя")
    async with session.begin():
        course_dal = CourseDAL(session)
        lesson_dal = LessonDAL(session)

        course = await course_dal.get_teacher_course_by_slug(user_id=teacher_user_id, slug=course_slug)
        if course is None:
            raise ValueError(f"Курс с slug '{course_slug}' не найден или нет доступа")

        test_lessons = []
        for module in (course.modules or []):
            for lesson in (module.lessons or []):
                if getattr(lesson, "lesson_type", None) == LessonType.TEST.value:
                    test_lessons.append(lesson)

        test_ids = [lesson.id for lesson in test_lessons]
        lesson_by_id = {lesson.id: lesson for lesson in test_lessons}
        submissions = await lesson_dal.get_test_submissions_with_answers_by_ids(test_ids)
        if not submissions:
            return []

        user_ids = [s.user_id for s in submissions]
        r = await session.execute(select(User.user_id, User.email, User.first_name, User.last_name).where(User.user_id.in_(user_ids)))
        user_data: dict[UUID, dict] = {row[0]: {"email": row[1], "first_name": row[2], "last_name": row[3]} for row in r.all()}

        result: list[TestSubmissionTeacherResponse] = []
        for s in submissions:
            answers_sorted = sorted(s.answers or [], key=lambda x: x.question_index)
            answers = [
                TestSubmissionAnswerTeacherResponse(
                    question_index=a.question_index,
                    question_type=a.question_type,
                    selected_option=a.selected_option,
                    selected_options=a.selected_options,
                    text_answer=a.text_answer,
                    is_correct=a.is_correct,
                    score=float(a.score or 0.0),
                )
                for a in answers_sorted
            ]
            user_info = user_data.get(s.user_id, {})
            result.append(
                TestSubmissionTeacherResponse(
                    user_id=str(s.user_id),
                    user_email=user_info.get("email"),
                    user_first_name=user_info.get("first_name"),
                    user_last_name=user_info.get("last_name"),
                    lesson_slug=getattr(lesson_by_id.get(s.test_lesson_id), "slug", None),
                    lesson_name=getattr(lesson_by_id.get(s.test_lesson_id), "name", None),
                    total_questions=s.total_questions,
                    checked_questions=s.checked_questions,
                    total_score=float(s.total_score or 0.0),
                    submitted_at=s.submitted_at,
                    answers=answers,
                )
            )
        return result


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
                raw_questions = _jsonable(updated_params["questions"])
                public_questions, correct_answers = _split_test_questions_and_correct_answers(raw_questions)
                lesson.questions = public_questions
                normalized_questions = [
                    {
                        "question_type": item["question_type"],
                        "correct_option": item.get("correct_option"),
                        "correct_options": item.get("correct_options"),
                        "correct_text": item.get("correct_text"),
                    }
                    for item in sorted(correct_answers, key=lambda x: x["question_index"])
                ]
                await lesson_dal.replace_test_correct_answers(lesson.id, normalized_questions)
            if "is_visibility" in updated_params and updated_params["is_visibility"] is not None:
                lesson.is_visibility = updated_params["is_visibility"]
        else:
            raise ValueError(f"Неизвестный тип урока: {lesson.lesson_type}")

        await session.flush()

        response_class = LESSON_RESPONSE_MAP.get(lesson_type)
        if response_class is None:
            raise ValueError(f"Неизвестный тип урока: {lesson.lesson_type}")

        if lesson_type == LessonType.TEST:
            correct_map = await lesson_dal.get_test_correct_answers_map(test_lesson_id=lesson.id)
            lesson.questions = _merge_questions_with_correct_answers(lesson.questions or [], correct_map)

        return response_class.model_validate(lesson)
