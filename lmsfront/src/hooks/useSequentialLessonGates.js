import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { API } from '../services/api.js';
import { authFetch } from '../services/authFetch';

function flattenLessons(course) {
  if (!course?.modules) return [];
  return course.modules
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .flatMap((m) => m.lessons.slice().sort((a, b) => a.display_order - b.display_order));
}

/** Стабильный ключ по составу уроков (без лишних перезапросов при новом ref того же курса). */
function lessonsProgressKey(course) {
  if (!course?.modules?.length) return '';
  return course.modules
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((m) =>
      [
        m.id,
        m.lessons
          .slice()
          .sort((a, b) => a.display_order - b.display_order)
          .map((l) => [l.id, l.slug, l.lesson_type].join(':'))
          .join(','),
      ].join('|')
    )
    .join('||');
}

export function useSequentialLessonGates(courseSlug, course) {
  const allLessons = useMemo(() => flattenLessons(course), [course]);
  const progressKey = useMemo(() => lessonsProgressKey(course), [course]);
  const courseRef = useRef(course);
  courseRef.current = course;
  const slugRef = useRef(courseSlug);
  slugRef.current = courseSlug;
  const progressKeyRef = useRef(progressKey);
  progressKeyRef.current = progressKey;

  const [completedIds, setCompletedIds] = useState([]);
  const [sequentialGateById, setSequentialGateById] = useState({});
  const [gatesLoading, setGatesLoading] = useState(false);

  useEffect(() => {
    if (!courseSlug || !progressKey) return;
    let cancelled = false;
    const slugAtStart = courseSlug;
    const keyAtStart = progressKey;

    (async () => {
      setGatesLoading(true);
      try {
        const response = await authFetch(API.course_progress_full(slugAtStart));
        if (!response.ok) {
          if (!cancelled && slugRef.current === slugAtStart && progressKeyRef.current === keyAtStart) {
            setCompletedIds([]);
            setSequentialGateById({});
          }
          return;
        }
        const data = await response.json();
        if (
          cancelled ||
          slugRef.current !== slugAtStart ||
          progressKeyRef.current !== keyAtStart
        ) {
          return;
        }

        const completed = Array.isArray(data.completed_lesson_ids) ? data.completed_lesson_ids : [];
        const practicaGate = data.practica && typeof data.practica === 'object' ? data.practica : {};
        const testsGate = data.tests && typeof data.tests === 'object' ? data.tests : {};

        setCompletedIds(completed);
        const isCompleted = (lessonId) => completed.some((x) => x == lessonId);

        const gate = {};
        for (const l of flattenLessons(courseRef.current)) {
          if (l.lesson_type === 'lecture' || l.lesson_type === 'video') {
            gate[l.id] = isCompleted(l.id);
          } else if (l.lesson_type === 'practica' || l.lesson_type === 'test') {
            if (isCompleted(l.id)) {
              gate[l.id] = true;
            } else if (l.lesson_type === 'practica') {
              gate[l.id] = !!practicaGate[l.slug];
            } else {
              gate[l.id] = !!testsGate[l.slug];
            }
          } else {
            gate[l.id] = true;
          }
        }
        setSequentialGateById(gate);
      } finally {
        if (!cancelled) setGatesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseSlug, progressKey]);

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
