import { API } from '../services/api.js';
import toast from 'react-hot-toast';
import { authFetch } from '../services/authFetch';

export const useStudents = () => {

  const getCourseBySlug = async (slug, { setCourse, setLoading, navigate }) => {
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
  };

  const getLessonBySlug = async (slug, { setLesson, setLoading, navigate }) => {
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
  };

  const completeLesson = async (lesson_slug) => {
    await authFetch(API.complete_lesson(lesson_slug), { method: 'POST' });
  };

  const getCourseProgress = async (slug) => {
    const response = await authFetch(API.course_progress(slug));
    if (!response.ok) return [];
    const data = await response.json();
    return data.completed_lesson_ids;
  };

  return {
    getCourseBySlug,
    getLessonBySlug,
    completeLesson,
    getCourseProgress
  };
};
