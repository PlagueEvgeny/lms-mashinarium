import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { ChevronLeft, ChevronRight, ClipboardCheck, FileText, Search, Users } from 'lucide-react';
import Header from '../../components/Header';
import { useTeacher } from '../../hooks/useTeacher';

const PAGE_SIZE = 12;

const TeachingPracticaCheckPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { teachingCourseDetail, getCoursePracticaSubmissions, gradePracticaSubmission } = useTeacher();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedLessonSlug, setSelectedLessonSlug] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [submissionsByLesson, setSubmissionsByLesson] = useState({});
  const [submissionsFetchError, setSubmissionsFetchError] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  const [grade, setGrade] = useState({ student_user_id: null, score: '', feedback: '' });
  const [grading, setGrading] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);

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

  const practicaLessons = useMemo(() => {
    const modules = course?.modules || [];
    const lessons = modules.flatMap((m) => (m.lessons || []).map((l) => ({ ...l, module: m })));
    return lessons
      .filter((l) => l.lesson_type === 'practica')
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }, [course?.modules]);

  /** Один запрос на весь курс; дальше только фильтрация на клиенте */
  const refreshAllSubmissions = useCallback(
    async ({ silent = false, lessonSlugToShow } = {}) => {
      if (!slug || !practicaLessons.length) return;
      setSubLoading(true);
      setSubmissionsFetchError(false);
      try {
        const data = await getCoursePracticaSubmissions(slug);
        const all = Array.isArray(data) ? data : [];
        const map = {};
        practicaLessons.forEach((lesson) => {
          map[lesson.slug] = all.filter((s) => s.lesson_slug === lesson.slug);
        });
        setSubmissionsByLesson(map);
        const show =
          lessonSlugToShow ??
          (selectedLessonSlugRef.current ||
            practicaLessons.find((l) => (map[l.slug] || []).length > 0)?.slug ||
            practicaLessons[0]?.slug);
        if (show) {
          setSelectedLessonSlug(show);
          setSubmissions(map[show] || []);
        }
      } catch (e) {
        setSubmissionsFetchError(true);
        if (!silent) toast.error(e.message || 'Не удалось загрузить отправки');
      } finally {
        setSubLoading(false);
      }
    },
    [slug, practicaLessons, getCoursePracticaSubmissions]
  );

  useEffect(() => {
    if (!practicaLessons.length || !slug) return;
    refreshAllSubmissions({ silent: true });
  }, [slug, practicaLessons, refreshAllSubmissions]);

  const pickPractica = (lessonSlug) => {
    setSelectedLessonSlug(lessonSlug);
    setGrade({ student_user_id: null, score: '', feedback: '' });
    setPage(0);
    setSearch('');
    setStatusFilter('all');
    const cached = submissionsByLesson[lessonSlug];
    if (Array.isArray(cached)) {
      setSubmissions(cached);
    } else {
      refreshAllSubmissions({ silent: true, lessonSlugToShow: lessonSlug });
    }
  };

  const filteredSubmissions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return submissions.filter((s) => {
      const email = (s.user_email || String(s.user_id || '')).toLowerCase();
      if (q && !email.includes(q)) return false;
      if (statusFilter === 'graded' && !s.is_graded) return false;
      if (statusFilter === 'pending' && s.is_graded) return false;
      return true;
    });
  }, [submissions, search, statusFilter]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredSubmissions.length / PAGE_SIZE) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [filteredSubmissions.length, page]);

  const pageItems = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredSubmissions.slice(start, start + PAGE_SIZE);
  }, [filteredSubmissions, page]);

  const pageCount = Math.max(1, Math.ceil(filteredSubmissions.length / PAGE_SIZE));

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
      await refreshAllSubmissions({ silent: true, lessonSlugToShow: selectedLessonSlug });
    } catch (e) {
      toast.error(e.message || 'Не удалось сохранить оценку');
    } finally {
      setGrading(false);
    }
  };

  const selectedRow = submissions.find((s) => s.user_id === grade.student_user_id);

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
      <main className="max-w-7xl mx-auto px-4 py-8">
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

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(260px,300px)_1fr] gap-6">
          <div className="bg-card rounded-2xl border border-border p-4 h-fit xl:sticky xl:top-24">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-primary" />
              <h2 className="text-sm font-semibold">Практики</h2>
            </div>
            {practicaLessons.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4">В курсе нет практик.</div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {practicaLessons.map((l) => {
                  const list = submissionsByLesson[l.slug];
                  const n = Array.isArray(list) ? list.length : null;
                  return (
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
                      <div className="text-sm font-medium text-foreground line-clamp-2">{l.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {l.module?.name}
                        {' · '}
                        {submissionsFetchError
                          ? 'ошибка загрузки'
                          : n === null
                            ? '…'
                            : `отправок: ${n}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 min-w-0">
            {!selectedLessonSlug ? (
              <div className="text-sm text-muted-foreground">Выберите практику слева.</div>
            ) : subLoading ? (
              <div className="text-sm text-muted-foreground">Загрузка отправок...</div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-primary shrink-0" />
                    <h2 className="text-sm font-semibold">Отправки</h2>
                    <span className="text-xs text-muted-foreground">
                      {filteredSubmissions.length}
                      {filteredSubmissions.length !== submissions.length ? ` из ${submissions.length}` : ''}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col sm:flex-row gap-2 min-w-0">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="search"
                        placeholder="Поиск по email…"
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setPage(0);
                        }}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(0);
                      }}
                      className="w-full sm:w-auto px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    >
                      <option value="all">Все</option>
                      <option value="pending">Без оценки</option>
                      <option value="graded">Оценено</option>
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        refreshAllSubmissions({ silent: false, lessonSlugToShow: selectedLessonSlug })
                      }
                      disabled={subLoading}
                      className="px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/30 transition disabled:opacity-50 shrink-0"
                    >
                      Обновить
                    </button>
                  </div>
                </div>

                {submissions.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">Отправок пока нет.</div>
                ) : filteredSubmissions.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">
                    Нет отправок по текущим фильтрам.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/40 border-b border-border text-left">
                            <th className="px-3 py-2.5 font-semibold text-foreground">Студент</th>
                            <th className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">Статус</th>
                            <th className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">Балл</th>
                            <th className="px-3 py-2.5 font-semibold text-foreground w-24">Действие</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageItems.map((s) => {
                            const active = grade.student_user_id === s.user_id;
                            return (
                              <tr
                                key={s.user_id}
                                className={`border-b border-border last:border-b-0 transition ${
                                  active ? 'bg-primary/8' : 'hover:bg-muted/20'
                                }`}
                              >
                                <td className="px-3 py-2.5">
                                  <div className="font-medium text-foreground truncate max-w-[220px] sm:max-w-xs">
                                    {s.user_email || `ID ${s.user_id}`}
                                  </div>
                                  {(s.text_answer || (s.files && s.files.length > 0)) && (
                                    <div className="text-xs text-muted-foreground truncate max-w-[280px] sm:max-w-md mt-0.5">
                                      {s.text_answer
                                        ? s.text_answer.slice(0, 80) + (s.text_answer.length > 80 ? '…' : '')
                                        : `${s.files?.length || 0} файл(ов)`}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  {s.is_graded ? (
                                    <span className="text-emerald-600 dark:text-emerald-400">Оценено</span>
                                  ) : (
                                    <span className="text-amber-600 dark:text-amber-400">Ждёт</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                                  {s.is_graded ? (s.score ?? '—') : '—'}
                                </td>
                                <td className="px-3 py-2.5">
                                  <button
                                    type="button"
                                    onClick={() => startGrade(s)}
                                    className="text-primary hover:underline text-left"
                                  >
                                    Оценить
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {pageCount > 1 && (
                      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                        <span>
                          Стр. {page + 1} из {pageCount}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={page <= 0}
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            className="p-2 rounded-lg border border-border hover:bg-muted/30 disabled:opacity-30 disabled:pointer-events-none"
                            aria-label="Предыдущая страница"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button
                            type="button"
                            disabled={page >= pageCount - 1}
                            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                            className="p-2 rounded-lg border border-border hover:bg-muted/30 disabled:opacity-30 disabled:pointer-events-none"
                            aria-label="Следующая страница"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 border-t border-border pt-4">
                      <div className="min-w-0 order-2 lg:order-1">
                        <div className="text-sm font-semibold mb-2">Полный ответ</div>
                        {!grade.student_user_id ? (
                          <p className="text-sm text-muted-foreground">Выберите студента в таблице.</p>
                        ) : selectedRow ? (
                          <div className="rounded-xl border border-border p-4 bg-muted/10 space-y-3 text-sm">
                            <p className="font-medium text-foreground">
                              {selectedRow.user_email || `ID ${selectedRow.user_id}`}
                            </p>
                            {selectedRow.text_answer ? (
                              <div className="text-foreground whitespace-pre-wrap break-words">
                                {selectedRow.text_answer}
                              </div>
                            ) : (
                              <p className="text-muted-foreground">Текста нет.</p>
                            )}
                            {Array.isArray(selectedRow.files) && selectedRow.files.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-xs font-medium text-muted-foreground">Файлы</div>
                                {selectedRow.files.map((url, idx) => (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary hover:underline block truncate"
                                  >
                                    Файл {idx + 1}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>

                      <div className="border border-border rounded-2xl p-4 h-fit order-1 lg:order-2 lg:sticky lg:top-24">
                        <div className="text-sm font-semibold mb-3">Оценивание</div>
                        {!grade.student_user_id ? (
                          <div className="text-sm text-muted-foreground">Выберите отправку в таблице.</div>
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
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeachingPracticaCheckPage;
