import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { HelpCircle, Users } from 'lucide-react';
import Header from '../../components/Header';
import { useTeacher } from '../../hooks/useTeacher';

const TeachingTestResultsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { teachingCourseDetail, getCourseTestSubmissions } = useTeacher();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLessonSlug, setSelectedLessonSlug] = useState('');
  const [submissionsByLesson, setSubmissionsByLesson] = useState({});
  const [submissionsFetchError, setSubmissionsFetchError] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [subLoading, setSubLoading] = useState(false);

  const selectedLessonSlugRef = useRef('');
  useEffect(() => {
    selectedLessonSlugRef.current = selectedLessonSlug;
  }, [selectedLessonSlug]);

  useEffect(() => {
    teachingCourseDetail(slug, { setCourse, setLoading, navigate, toast });
  }, [slug]);

  useEffect(() => {
    setSelectedLessonSlug('');
    setSubmissions([]);
    setSubmissionsByLesson({});
    setSubmissionsFetchError(false);
  }, [slug]);

  const testLessons = useMemo(() => {
    const modules = course?.modules || [];
    const lessons = modules.flatMap((m) => (m.lessons || []).map((l) => ({ ...l, module: m })));
    return lessons
      .filter((l) => l.lesson_type === 'test')
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }, [course?.modules]);

  const refreshAllSubmissions = useCallback(
    async ({ silent = false, lessonSlugToShow } = {}) => {
      if (!slug || !testLessons.length) return;
      setSubLoading(true);
      setSubmissionsFetchError(false);
      try {
        const data = await getCourseTestSubmissions(slug);
        const all = Array.isArray(data) ? data : [];
        const map = {};
        testLessons.forEach((lesson) => {
          map[lesson.slug] = all.filter((s) => s.lesson_slug === lesson.slug);
        });
        setSubmissionsByLesson(map);
        const show =
          lessonSlugToShow ??
          (selectedLessonSlugRef.current ||
            testLessons.find((l) => (map[l.slug] || []).length > 0)?.slug ||
            testLessons[0]?.slug);
        if (show) {
          setSelectedLessonSlug(show);
          setSubmissions(map[show] || []);
        }
      } catch (e) {
        setSubmissionsFetchError(true);
        if (!silent) toast.error(e.message || 'Не удалось загрузить результаты');
      } finally {
        setSubLoading(false);
      }
    },
    [slug, testLessons, getCourseTestSubmissions]
  );

  useEffect(() => {
    if (!testLessons.length || !slug) return;
    refreshAllSubmissions({ silent: true });
  }, [slug, testLessons, refreshAllSubmissions]);

  const pickTest = (lessonSlug) => {
    setSelectedLessonSlug(lessonSlug);
    const cached = submissionsByLesson[lessonSlug];
    if (Array.isArray(cached)) {
      setSubmissions(cached);
    } else {
      refreshAllSubmissions({ silent: true, lessonSlugToShow: lessonSlug });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster position="top-right" />
      <main className="max-w-7xl mx-auto px-4 py-10">
        <button
          onClick={() => navigate(`/teaching/courses/${slug}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          ← Назад к курсу
        </button>

        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <HelpCircle size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Результаты тестов</h1>
              <p className="text-sm text-muted-foreground">{course.name}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="text-sm font-semibold mb-3">Тесты</div>
            {testLessons.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4">В курсе нет тестов.</div>
            ) : (
              <div className="space-y-2">
                {testLessons.map((l) => {
                  const list = submissionsByLesson[l.slug];
                  const n = Array.isArray(list) ? list.length : null;
                  return (
                    <button
                      key={l.slug}
                      type="button"
                      onClick={() => pickTest(l.slug)}
                      className={`w-full text-left px-3 py-2 rounded-xl border transition ${
                        selectedLessonSlug === l.slug ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/30'
                      }`}
                    >
                      <div className="text-sm font-medium text-foreground">{l.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {l.module?.name}
                        {' · '}
                        {submissionsFetchError
                          ? 'ошибка загрузки'
                          : n === null
                            ? '…'
                            : `попыток: ${n}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            {!selectedLessonSlug ? (
              <div className="text-sm text-muted-foreground">Выберите тест слева.</div>
            ) : subLoading ? (
              <div className="text-sm text-muted-foreground">Загрузка результатов...</div>
            ) : submissions.length === 0 ? (
              <div className="text-sm text-muted-foreground">Попыток пока нет.</div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Users size={16} className="text-primary" />
                  <h2 className="text-sm font-semibold">Попытки студентов</h2>
                  <span className="text-xs text-muted-foreground">({submissions.length})</span>
                </div>
                <div className="space-y-3">
                  {submissions.map((s) => (
                    <div key={s.user_id} className="border border-border rounded-xl p-4 bg-muted/10">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">
                            {s.user_last_name || s.user_first_name ? (
                              <>
                                {s.user_last_name} {s.user_first_name}
                                <span className="text-muted-foreground ml-2 text-xs">
                                  ({s.user_email || s.user_id})
                                </span>
                              </>
                            ) : (
                              s.user_email || s.user_id
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Отправлено: {new Date(s.submitted_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-foreground">
                          {s.total_score} / {s.total_questions}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeachingTestResultsPage;
