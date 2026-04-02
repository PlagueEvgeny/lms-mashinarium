import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/Header';
import LessonSidebar from '../../components/lesson/LessonSidebar';
import LectureLesson from '../../components/lesson/LectureLesson';
import VideoLesson   from '../../components/lesson/VideoLesson';
import PracticaLesson from '../../components/lesson/PracticaLesson';
import TestLesson from '../../components/lesson/TestLesson';
import { useStudents } from '../../hooks/useStudents';
import { useSequentialLessonGates } from '../../hooks/useSequentialLessonGates';

const LESSON_COMPONENTS = {
  lecture: LectureLesson,
  video:   VideoLesson,
  practica: PracticaLesson,
  test:    TestLesson,
};

const UserLesson = () => {
  const { slug, module_slug, lesson_slug } = useParams();
  const navigate = useNavigate();
  const {
    getCourseBySlug,
    getLessonBySlug,
    completeLesson,
    checkTest,
    getMyTestResult,
  } = useStudents();

  const [course, setCourse]               = useState(null);
  const [lesson, setLesson]               = useState(null);
  const [loading, setLoading]             = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [error, setError]                 = useState(null);

  const {
    allLessons,
    completedIds,
    setCompletedIds,
    sequentialGateById,
    patchLessonGate,
    canAccessLessonAtIndex,
    sidebarCompletedSlugs,
    lockedSlugsForLesson,
  } = useSequentialLessonGates(slug, course);

  const currentIndex = allLessons.findIndex((l) => l.slug === lesson_slug);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allLessons.length - 1;
  const isLast = !hasNext;

  const onRequirementMetChange = useCallback(
    (ok) => {
      if (!lesson) return;
      if (lesson.lesson_type !== 'practica' && lesson.lesson_type !== 'test') return;
      patchLessonGate(lesson.id, ok);
    },
    [lesson, patchLessonGate]
  );

 const fetchMyTestResult = useCallback(
 (signal) => getMyTestResult(lesson_slug, { signal }),
 [lesson_slug, getMyTestResult]
 );

 const runCheckTest = useCallback(
 (answers) => checkTest(lesson_slug, answers),
 [lesson_slug, checkTest]
 );

 const blockNextForCurrent =
    lesson &&
    (lesson.lesson_type === 'practica' || lesson.lesson_type === 'test') &&
    !sequentialGateById[lesson.id];

  const lockedSlugs = lockedSlugsForLesson(lesson_slug);

  useEffect(() => {
    const load = async () => {
      try {
        await getCourseBySlug(slug, { setCourse, setLoading, navigate });
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    load();
  }, [slug, getCourseBySlug, navigate]);

  useEffect(() => {
    if (!lesson_slug) return;
    getLessonBySlug(lesson_slug, { setLesson, setLoading: setLessonLoading, navigate });
  }, [lesson_slug, getLessonBySlug, navigate]);

  const handleSelect = (newLessonSlug) => {
    const idx = allLessons.findIndex((l) => l.slug === newLessonSlug);
    if (idx === -1) return;
    if (!canAccessLessonAtIndex(idx, currentIndex)) {
      toast.error('Сначала завершите предыдущие занятия: отправьте практику или пройдите тест.');
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    navigate(`/user/courses/${slug}/modules/${module_slug}/lessons/${newLessonSlug}`);
  };

  const handlePrev = () => {
    if (hasPrev) handleSelect(allLessons[currentIndex - 1].slug);
  };

  const handleNext = async () => {
    if (!lesson) return;
    if (
      (lesson.lesson_type === 'practica' || lesson.lesson_type === 'test') &&
      !sequentialGateById[lesson.id]
    ) {
      toast.error(
        lesson.lesson_type === 'practica'
          ? 'Сначала отправьте решение по практике'
          : 'Сначала отправьте ответы в тесте'
      );
      return;
    }
    if (!completedIds.some((x) => x == lesson.id)) {
      try {
        await completeLesson(lesson_slug);
        setCompletedIds((prev) => [...prev, lesson.id]);
        patchLessonGate(lesson.id, true);
      } catch (err) {
        toast.error('Не удалось сохранить прогресс');
        console.error(err);
        return;
      }
    }
    if (hasNext) {
      const nextSlug = allLessons[currentIndex + 1].slug;
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      navigate(`/user/courses/${slug}/modules/${module_slug}/lessons/${nextSlug}`);
    }
  };

  const handleFinish = async () => {
    if (!lesson) return;
    if (blockNextForCurrent) {
      toast.error(
        lesson.lesson_type === 'practica'
          ? 'Сначала отправьте решение по практике'
          : 'Сначала отправьте ответы в тесте'
      );
      return;
    }
    if (!completedIds.some((x) => x == lesson.id)) {
      try {
        await completeLesson(lesson_slug);
        setCompletedIds((prev) => [...prev, lesson.id]);
        patchLessonGate(lesson.id, true);
      } catch (err) {
        toast.error('Не удалось сохранить прогресс');
        return;
      }
    }
    toast.success('Курс завершён!');
    navigate(`/user/courses/${slug}`);
  };

  const LessonComponent = lesson ? LESSON_COMPONENTS[lesson.lesson_type] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle size={40} className="text-red-500" />
          <p className="text-foreground font-medium">{error}</p>
          <button onClick={() => navigate(-1)} className="text-sm text-primary hover:underline">
            Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster position="top-center" />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition">
            Мои курсы
          </button>
          <span>/</span>
          <button onClick={() => navigate(`/user/courses/${slug}`)} className="hover:text-primary transition">
            {course?.name}
          </button>
          {lesson && (
            <>
              <span>/</span>
              <span className="text-foreground truncate max-w-xs">{lesson.name}</span>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div>
            {lessonLoading ? (
              <div className="bg-card rounded-2xl border border-border flex items-center justify-center" style={{ minHeight: 400 }}>
                <Loader2 size={28} className="animate-spin text-primary" />
              </div>
            ) : !lesson ? (
              <div className="bg-card rounded-2xl border border-border flex flex-col items-center justify-center gap-3 text-center p-12" style={{ minHeight: 400 }}>
                <p className="text-muted-foreground">Выберите урок из списка</p>
              </div>
            ) : !LessonComponent ? (
              <div className="bg-card rounded-2xl border border-border flex items-center justify-center p-12">
                <p className="text-muted-foreground">Тип урока «{lesson.lesson_type}» пока не поддерживается</p>
              </div>
            ) : (
              <LessonComponent
                lesson={lesson}
                onPrev={handlePrev}
                onNext={handleNext}
                hasPrev={hasPrev}
                hasNext={hasNext}
                blockNext={!!blockNextForCurrent}
                isLast={isLast}
                onFinish={handleFinish}
                onCheckTest={lesson?.lesson_type === 'test' ? runCheckTest : null}
                onGetMyTestResult={lesson?.lesson_type === 'test' ? fetchMyTestResult : null}
                onRequirementMetChange={
                  lesson?.lesson_type === 'practica' || lesson?.lesson_type === 'test'
                    ? onRequirementMetChange
                    : undefined
                }
              />
            )}
          </div>

          {course?.modules && (
            <LessonSidebar
              modules={course.modules}
              currentSlug={lesson_slug}
              onSelect={handleSelect}
              completedSlugs={sidebarCompletedSlugs}
              lockedSlugs={lockedSlugs}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default UserLesson;
