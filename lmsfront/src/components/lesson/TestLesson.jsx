import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, HelpCircle, FileText } from 'lucide-react';
import { LESSON_CSS } from '../../utility/markdownParser';

const TestLesson = ({ lesson, onPrev, onNext, hasPrev, hasNext, onCheckTest }) => {
  const questions = useMemo(() => lesson?.questions || [], [lesson?.questions]);
  const storageKey = useMemo(() => (lesson?.slug ? `test_answers_${lesson.slug}` : null), [lesson?.slug]);

  const buildInitialAnswers = () =>
    (questions || []).map((q) => {
      const t = q?.question_type || 'single';
      if (t === 'multiple') return [];
      if (t === 'text') return '';
      return null;
    });

  const [answers, setAnswers] = useState(() => {
    if (!storageKey) return buildInitialAnswers();
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return buildInitialAnswers();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : buildInitialAnswers();
    } catch {
      return buildInitialAnswers();
    }
  });
  const materials = lesson?.materials || [];
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);

  useEffect(() => {
    // если поменялся урок/вопросы — нормализуем длину ответов
    const init = buildInitialAnswers();
    setAnswers((prev) => {
      if (!Array.isArray(prev)) return init;
      if (prev.length === init.length) return prev;
      return init.map((v, idx) => (idx < prev.length ? prev[idx] : v));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.slug, questions.length]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(answers));
    } catch {
      // ignore
    }
  }, [storageKey, answers]);

  const setSingleAnswer = (qIdx, optIdx) => {
    setAnswers((prev) => prev.map((a, i) => (i === qIdx ? optIdx : a)));
  };

  const toggleMultiAnswer = (qIdx, optIdx) => {
    setAnswers((prev) =>
      prev.map((a, i) => {
        if (i !== qIdx) return a;
        const arr = Array.isArray(a) ? a : [];
        return arr.includes(optIdx) ? arr.filter((x) => x !== optIdx) : [...arr, optIdx];
      })
    );
  };

  const setTextAnswer = (qIdx, value) => {
    setAnswers((prev) => prev.map((a, i) => (i === qIdx ? value : a)));
  };

  const runCheck = async () => {
    if (!onCheckTest) return;
    setChecking(true);
    try {
      const res = await onCheckTest(answers);
      setCheckResult(res);
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <style>{LESSON_CSS}</style>

      <div className="flex flex-col gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
              <HelpCircle size={17} className="text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Тест</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{lesson.name}</h1>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          {(questions || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">В тесте нет вопросов.</p>
          ) : (
            questions.map((q, idx) => (
              <div key={idx} className="space-y-3 border border-border rounded-xl p-4 bg-muted/10">
                <p className="font-medium text-foreground">
                  {idx + 1}. {q.prompt}
                </p>

                {(q.question_type || 'single') === 'text' ? (
                  <textarea
                    value={typeof answers[idx] === 'string' ? answers[idx] : ''}
                    onChange={(e) => setTextAnswer(idx, e.target.value)}
                    placeholder="Введите ответ..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                ) : (
                  <div className="space-y-2">
                    {(q.options || []).map((opt, optIdx) => {
                      const t = q.question_type || 'single';
                      const checked =
                        t === 'multiple'
                          ? (Array.isArray(answers[idx]) ? answers[idx] : []).includes(optIdx)
                          : answers[idx] === optIdx;
                      return (
                        <label key={optIdx} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type={t === 'multiple' ? 'checkbox' : 'radio'}
                            name={`q_${idx}`}
                            checked={checked}
                            onChange={() => {
                              if (t === 'multiple') toggleMultiAnswer(idx, optIdx);
                              else setSingleAnswer(idx, optIdx);
                            }}
                          />
                          <span className="text-foreground">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}

          {onCheckTest && (
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={runCheck}
                disabled={checking}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
              >
                {checking ? 'Проверка...' : 'Проверить тест'}
              </button>

              {checkResult && (
                <div className="text-sm text-muted-foreground">
                  Баллы: <span className="text-foreground font-medium">{checkResult.total_score}</span> /{' '}
                  <span className="text-foreground font-medium">{checkResult.total_questions}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-primary" />
            <h2 className="text-base font-semibold">Материалы</h2>
          </div>

          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground">Материалы не прикреплены.</p>
          ) : (
            <ul className="space-y-2">
              {materials.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3">
                  <a
                    href={m.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline truncate"
                    title={m.title}
                  >
                    {m.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-muted/40 transition disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft size={16} /> Предыдущий
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-30 disabled:pointer-events-none"
          >
            Следующий <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </>
  );
};

export default TestLesson;

