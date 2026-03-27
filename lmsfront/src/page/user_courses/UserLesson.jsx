import { useState, useEffect, useMemo } from 'react';
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

const LESSON_COMPONENTS = {
  lecture: LectureLesson,
  video:   VideoLesson,
  practica: PracticaLesson,
  test:    TestLesson,
};

const UserLesson = () => {
  const { slug, module_slug, lesson_slug } = useParams();
  const navigate = useNavigate();
  const { getCourseBySlug, getLessonBySlug, completeLesson, getCourseProgress, checkTest } = useStudents();

  const [course, setCourse]               = useState(null);
  const [lesson, setLesson]               = useState(null);
  const [loading, setLoading]             = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [error, setError]                 = useState(null);
  const [completedIds, setCompletedIds]   = useState([]); // lesson.id с бэкенда

  const allLessons = useMemo(() => {
    if (!course?.modules) return [];
    return course.modules
      .slice()
      .sort((a, b) => a.display_order - b.display_order)
      .flatMap(m => m.lessons.slice().sort((a, b) => a.display_order - b.display_order));
  }, [course]);

  const currentIndex = allLessons.findIndex(l => l.slug === lesson_slug);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allLessons.length - 1;

  // Загрузка курса + прогресса
  useEffect(() => {
    const load = async () => {
      try {
        await getCourseBySlug(slug, { setCourse, setLoading, navigate });
        const ids = await getCourseProgress(slug);
        setCompletedIds(ids);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  // Загрузка урока
  useEffect(() => {
    if (!lesson_slug) return;
    getLessonBySlug(lesson_slug, { setLesson, setLoading: setLessonLoading, navigate });
  }, [lesson_slug]);

  const handleSelect = (newLessonSlug) => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    navigate(`/user/courses/${slug}/modules/${module_slug}/lessons/${newLessonSlug}`);
  };

  const handlePrev = () => {
    if (hasPrev) handleSelect(allLessons[currentIndex - 1].slug);
  };

  const handleNext = async () => {
    if (lesson && !completedIds.includes(lesson.id)) {
      try {
        await completeLesson(lesson_slug);
        setCompletedIds(prev => [...prev, lesson.id]);
      } catch (err) {
        toast.error('Не удалось сохранить прогресс');
        console.error(err);
      }
    }
    if (hasNext) handleSelect(allLessons[currentIndex + 1].slug);
  };

  // completedIds (lesson.id) → completedSlugs для сайдбара
  const completedSlugs = useMemo(() => {
    return allLessons
      .filter(l => completedIds.includes(l.id))
      .map(l => l.slug);
  }, [allLessons, completedIds]);

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
      <Toaster position="top-right" />
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
                onCheckTest={lesson?.lesson_type === 'test' ? (answers) => checkTest(lesson_slug, answers) : null}
              />
            )}
          </div>

          {course?.modules && (
            <LessonSidebar
              modules={course.modules}
              currentSlug={lesson_slug}
              onSelect={handleSelect}
              completedSlugs={completedSlugs}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default UserLesson;
