import { useCallback } from 'react';
import { API } from '../services/api.js';
import toast from 'react-hot-toast';
import { authFetch } from '../services/authFetch';

export const useStudents = () => {
  const getCourseBySlug = useCallback(async (slug, { setCourse, setLoading, navigate }) => {
    try {
      const response = await authFetch(API.user_course(slug));
      if (!response.ok) throw new Error('Курс не найден');
      const data = await response.json();
      setCourse(data);
    } catch (err) {
      toast.error('Не удалось загрузить курс');
      console.error(err.message);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const getLessonBySlug = useCallback(async (slug, { setLesson, setLoading, navigate }) => {
    try {
      const response = await authFetch(API.user_course_lesson(slug));
      if (!response.ok) throw new Error('Занятие не найдено');
      const data = await response.json();
      setLesson(data);
    } catch (err) {
      toast.error('Не удалось загрузить урок');
      console.error(err.message);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const completeLesson = useCallback(async (lesson_slug) => {
    await authFetch(API.complete_lesson(lesson_slug), { method: 'POST' });
  }, []);

  const getCourseProgress = useCallback(async (slug) => {
    const response = await authFetch(API.course_progress(slug));
    if (!response.ok) return [];
    const data = await response.json();
    return data.completed_lesson_ids;
  }, []);

  const getCourseProgressFull = useCallback(async (slug) => {
    const response = await authFetch(API.course_progress_full(slug));
    if (!response.ok) return null;
    return await response.json();
  }, []);

  const getMyPracticaSubmission = useCallback(async (lessonSlug) => {
    const response = await authFetch(API.practica_my_submission(lessonSlug));
    if (!response.ok) return null;
    return await response.json();
  }, []);

  const submitPractica = useCallback(async (lessonSlug, { textAnswer, files }) => {
    const formData = new FormData();
    if (textAnswer && textAnswer.trim() !== '') {
      formData.append('text_answer', textAnswer);
    }
    (files || []).forEach((file) => formData.append('files', file));

    const response = await authFetch(API.practica_submit(lessonSlug), {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Не удалось отправить решение');
    }

    return await response.json();
  }, []);

  const checkTest = useCallback(async (lessonSlug, answers) => {
    const payloadAnswers = (answers || []).map((answer) => {
      if (Array.isArray(answer)) {
        return { answer_type: 'multiple', selected_options: answer };
      }
      if (typeof answer === 'string') {
        return { answer_type: 'text', text: answer };
      }
      return { answer_type: 'single', selected_option: Number.isInteger(answer) ? answer : null };
    });

    const response = await authFetch(API.test_check(lessonSlug), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: payloadAnswers }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Не удалось проверить тест');
    }
    return await response.json();
  }, []);

  const getMyTestResult = useCallback(async (lessonSlug, { signal } = {}) => {
    const response = await authFetch(API.test_result(lessonSlug), { signal });
    if (!response.ok) return null;
    return await response.json();
  }, []);

  return {
    getCourseBySlug,
    getLessonBySlug,
    completeLesson,
    getCourseProgress,
    getCourseProgressFull,
    getMyPracticaSubmission,
    submitPractica,
    checkTest,
    getMyTestResult,
  };
};
