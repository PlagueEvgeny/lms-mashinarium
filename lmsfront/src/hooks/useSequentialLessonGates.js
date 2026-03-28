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
  const { getCourseProgressFull } = useStudents();

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
        const full = await getCourseProgressFull(courseSlug);
        if (cancelled) return;
        if (!full) {
          setCompletedIds([]);
          setSequentialGateById({});
          return;
        }

        const completed = Array.isArray(full.completed_lesson_ids) ? full.completed_lesson_ids : [];
        const practicaMap = full.practica && typeof full.practica === 'object' ? full.practica : {};
        const testsMap = full.tests && typeof full.tests === 'object' ? full.tests : {};
        setCompletedIds(completed);

        const isCompleted = (lessonId) => completed.some((x) => x == lessonId);

        const gate = {};
        for (const l of allLessons) {
          if (l.lesson_type === 'lecture' || l.lesson_type === 'video') {
            gate[l.id] = isCompleted(l.id);
          } else if (l.lesson_type === 'practica') {
            gate[l.id] = isCompleted(l.id) || !!practicaMap[l.slug];
          } else if (l.lesson_type === 'test') {
            gate[l.id] = isCompleted(l.id) || !!testsMap[l.slug];
          } else {
            gate[l.id] = true;
          }
        }

        if (!cancelled) setSequentialGateById(gate);
      } finally {
        if (!cancelled) setGatesLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [courseSlug, allLessons, getCourseProgressFull]);

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