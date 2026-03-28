// Лучшее решение — агрегированный API

// Сделай 1 эндпоинт:

// GET /courses/:slug/progress-full

// который вернет:

// {
//   "completedLessons": [1,2,3],
//   "practica": {
//     "lesson-slug-1": true,
//     "lesson-slug-2": false
//   },
//   "tests": {
//     "lesson-slug-3": true
//   }
// }
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStudents } from './useStudents';

function flattenLessons(course) {
  if (!course?.modules) return [];
  return course.modules
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .flatMap((m) => m.lessons.slice().sort((a, b) => a.display_order - b.display_order));
}

export function useSequentialLessonGates(courseSlug, course) {
  const { getCourseProgress, getMyPracticaSubmission, getMyTestResult } = useStudents();

  const allLessons = useMemo(() => flattenLessons(course), [course]);

  const [completedIds, setCompletedIds]         = useState([]);
  const [sequentialGateById, setSequentialGateById] = useState({});
  const [gatesLoading, setGatesLoading]         = useState(false);

  // [~] Один эффект вместо двух: сначала прогресс, потом гейты — без race condition
  useEffect(() => {
    if (!courseSlug || !allLessons.length) return;
    let cancelled = false;

    (async () => {
      setGatesLoading(true);
      try {
        // 1. Загружаем завершённые уроки из БД
        const ids = await getCourseProgress(courseSlug);
        if (cancelled) return;
        const completed = Array.isArray(ids) ? ids : [];
        setCompletedIds(completed);

        // 2. Локальная функция — не зависит от state, берёт свежие данные
        const isCompleted = (lessonId) => completed.some((x) => x == lessonId);

        // 3. Вычисляем гейты
        const gate = {};
        const pending = [];

        for (const l of allLessons) {
          if (l.lesson_type === 'lecture' || l.lesson_type === 'video') {
            gate[l.id] = isCompleted(l.id);
          } else if (l.lesson_type === 'practica' || l.lesson_type === 'test') {
            if (isCompleted(l.id)) {
              gate[l.id] = true;
            } else {
              pending.push(l); // нужна проверка submission
            }
          } else {
            gate[l.id] = true;
          }
        }

        // 4. Параллельно проверяем незавершённые practica/test по API
        await Promise.all(
          pending.map(async (l) => {
            if (cancelled) return;
            if (l.lesson_type === 'practica') {
              const sub = await getMyPracticaSubmission(l.slug);
              gate[l.id] = !!sub;
            } else {
              const r = await getMyTestResult(l.slug);
              gate[l.id] = !!r;
            }
          })
        );

        if (!cancelled) setSequentialGateById(gate);
      } finally {
        if (!cancelled) setGatesLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [courseSlug, allLessons, getCourseProgress, getMyPracticaSubmission, getMyTestResult]);

  // [~] refreshSequentialGates больше не нужен — удалён

  const patchLessonGate = useCallback((lessonId, ok) => {
    if (lessonId == null) return;
    setSequentialGateById((prev) => ({ ...prev, [lessonId]: ok }));
  }, []);

  const canAccessLessonAtIndex = useCallback(
    (idx, currentLessonIndex = 0) => {
      if (idx <= 0) return true;
      if (gatesLoading) return idx <= Math.max(0, currentLessonIndex);
      for (let i = 0; i < idx; i++) {
        const id = allLessons[i]?.id;
        if (id == null || !sequentialGateById[id]) return false;
      }
      return true;
    },
    [gatesLoading, allLessons, sequentialGateById]
  );

  const canAccessLessonOnOverview = useCallback(
    (idx) => {
      if (gatesLoading) return true;
      return canAccessLessonAtIndex(idx, 0);
    },
    [gatesLoading, canAccessLessonAtIndex]
  );

  const sidebarCompletedSlugs = useMemo(() => {
    return allLessons
      .filter((l) => {
        if (completedIds.some((x) => x == l.id)) return true;
        if (l.lesson_type === 'practica' || l.lesson_type === 'test') {
          return !!sequentialGateById[l.id];
        }
        return false;
      })
      .map((l) => l.slug);
  }, [allLessons, completedIds, sequentialGateById]);

  const lockedSlugsForLesson = useCallback(
    (currentLessonSlug) => {
      if (!currentLessonSlug) return [];
      const currentIndex = allLessons.findIndex((l) => l.slug === currentLessonSlug);
      if (currentIndex < 0) return [];
      return allLessons
        .filter((l, idx) => idx !== currentIndex && !canAccessLessonAtIndex(idx, currentIndex))
        .map((l) => l.slug);
    },
    [allLessons, canAccessLessonAtIndex]
  );

  return {
    allLessons,
    completedIds,
    setCompletedIds,
    sequentialGateById,
    patchLessonGate,
    gatesLoading,
    canAccessLessonAtIndex,
    canAccessLessonOnOverview,
    sidebarCompletedSlugs,
    lockedSlugsForLesson,
  };
}