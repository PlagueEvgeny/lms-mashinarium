import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { ClipboardCheck, FileText, Users } from 'lucide-react';
import Header from '../../components/Header';
import { useTeacher } from '../../hooks/useTeacher';

const TeachingPracticaCheckPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { teachingCourseDetail, getPracticaSubmissions, gradePracticaSubmission } = useTeacher();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedLessonSlug, setSelectedLessonSlug] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [subLoading, setSubLoading] = useState(false);

  const [grade, setGrade] = useState({ student_user_id: null, score: '', feedback: '' });
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    teachingCourseDetail(slug, { setCourse, setLoading, navigate, toast });
  }, [slug]);

  const practicaLessons = useMemo(() => {
    const modules = course?.modules || [];
    const lessons = modules.flatMap((m) => (m.lessons || []).map((l) => ({ ...l, module: m })));
    return lessons
      .filter((l) => l.lesson_type === 'practica')
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }, [course?.modules]);

  const loadSubmissions = async (lessonSlug) => {
    if (!lessonSlug) return;
    setSubLoading(true);
    try {
      const data = await getPracticaSubmissions(lessonSlug);
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e.message || 'Не удалось загрузить отправки');
    } finally {
      setSubLoading(false);
    }
  };

  const pickPractica = async (lessonSlug) => {
    setSelectedLessonSlug(lessonSlug);
    setGrade({ student_user_id: null, score: '', feedback: '' });
    await loadSubmissions(lessonSlug);
  };

  const startGrade = (s) => {
    setGrade({
      student_user_id: s.user_id,
      score: s.score ?? '',
      feedback: s.feedback ?? '',
    });
  };

  const submitGrade = async () => {
    if (!selectedLessonSlug || !grade.student_user_id) return;
    const scoreNum = grade.score === '' ? null : Number(grade.score);
    if (scoreNum === null || Number.isNaN(scoreNum)) return toast.error('Укажите балл');

    setGrading(true);
    try {
      await gradePracticaSubmission(selectedLessonSlug, grade.student_user_id, {
        score: scoreNum,
        feedback: grade.feedback || null,
      });
      toast.success('Оценка сохранена');
      await loadSubmissions(selectedLessonSlug);
    } catch (e) {
      toast.error(e.message || 'Не удалось сохранить оценку');
    } finally {
      setGrading(false);
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
      <main className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(`/teaching/courses/${slug}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          ← Назад к курсу
        </button>

        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <ClipboardCheck size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Проверка практик</h1>
              <p className="text-sm text-muted-foreground">{course.name}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-primary" />
              <h2 className="text-sm font-semibold">Практики</h2>
            </div>
            {practicaLessons.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4">В курсе нет практик.</div>
            ) : (
              <div className="space-y-2">
                {practicaLessons.map((l) => (
                  <button
                    key={l.slug}
                    type="button"
                    onClick={() => pickPractica(l.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl border transition ${
                      selectedLessonSlug === l.slug
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted/30'
                    }`}
                  >
                    <div className="text-sm font-medium text-foreground">{l.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{l.module?.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            {!selectedLessonSlug ? (
              <div className="text-sm text-muted-foreground">Выберите практику слева.</div>
            ) : subLoading ? (
              <div className="text-sm text-muted-foreground">Загрузка отправок...</div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Users size={16} className="text-primary" />
                  <h2 className="text-sm font-semibold">Отправки студентов</h2>
                  <span className="text-xs text-muted-foreground">
                    ({submissions.length})
                  </span>
                </div>

                {submissions.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Отправок пока нет.</div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
                    <div className="space-y-3">
                      {submissions.map((s) => (
                        <div key={s.user_id} className="border border-border rounded-xl p-4 bg-muted/10">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">
                                {s.user_email || s.user_id}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {s.is_graded ? `Оценено: ${s.score ?? '-'}` : 'Не оценено'}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => startGrade(s)}
                              className="px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/30 transition"
                            >
                              Оценить
                            </button>
                          </div>

                          {s.text_answer && (
                            <div className="mt-3 text-sm text-foreground whitespace-pre-wrap">
                              {s.text_answer}
                            </div>
                          )}

                          {Array.isArray(s.files) && s.files.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {s.files.map((url, idx) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm text-primary hover:underline block truncate"
                                >
                                  Файл {idx + 1}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="border border-border rounded-2xl p-4">
                      <div className="text-sm font-semibold mb-3">Оценивание</div>
                      {!grade.student_user_id ? (
                        <div className="text-sm text-muted-foreground">Выберите отправку.</div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Балл</label>
                            <input
                              type="number"
                              value={grade.score}
                              onChange={(e) => setGrade((p) => ({ ...p, score: e.target.value }))}
                              min={0}
                              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Комментарий</label>
                            <textarea
                              value={grade.feedback}
                              onChange={(e) => setGrade((p) => ({ ...p, feedback: e.target.value }))}
                              rows={4}
                              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={submitGrade}
                            disabled={grading}
                            className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
                          >
                            {grading ? 'Сохранение...' : 'Сохранить оценку'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeachingPracticaCheckPage;

