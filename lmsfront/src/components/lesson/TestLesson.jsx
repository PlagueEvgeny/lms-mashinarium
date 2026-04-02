import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, HelpCircle, FileText, CheckCircle, XCircle } from 'lucide-react';
import { LESSON_CSS } from '../../utility/markdownParser';

const TestLesson = ({
  lesson,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onCheckTest,
  onGetMyTestResult,
  blockNext = false,
  onRequirementMetChange,
  isLast = false,
  onFinish
}) => {
  const questions = useMemo(() => lesson?.questions || [], [lesson?.questions]);
  const materials = lesson?.materials || [];

  const buildInitialAnswers = () =>
    questions.map((q) => {
      const t = q?.question_type || 'single';
      if (t === 'multiple') return [];
      if (t === 'text') return '';
      return null;
    });

  const [answers, setAnswers] = useState(buildInitialAnswers);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [loadingResult, setLoadingResult] = useState(false);

  useEffect(() => {
    const init = buildInitialAnswers();
    setAnswers((prev) => {
      if (!Array.isArray(prev)) return init;
      if (prev.length === init.length) return prev;
      return init.map((v, idx) => (idx < prev.length ? prev[idx] : v));
    });
    setCheckResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.slug, questions.length]);

  useEffect(() => {
    if (!onGetMyTestResult || !lesson?.slug) return;
    const ac = new AbortController();
    let active = true;
    const loadResult = async () => {
      setLoadingResult(true);
      try {
        const result = await onGetMyTestResult(ac.signal);
        if (!active) return;
        if (result) setCheckResult(result);
      } catch (e) {
        if (e?.name === 'AbortError') return;
        throw e;
      } finally {
        if (active) setLoadingResult(false);
      }
    };
    loadResult();
    return () => { active = false; ac.abort(); };
  }, [onGetMyTestResult, lesson?.slug]);

  useEffect(() => {
    if (!checkResult?.results?.length) return;
    const restored = questions.map((q, idx) => {
      const r = checkResult.results[idx];
      if (!r) return buildInitialAnswers()[idx];
      const t = q?.question_type || 'single';
      if (t === 'text') return r.text_answer ?? '';
      if (t === 'multiple') return r.selected_options ?? [];
      return r.selected_option ?? null;
    });
    setAnswers(restored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkResult]);

  useEffect(() => {
    onRequirementMetChange?.(!!checkResult);
  }, [checkResult, onRequirementMetChange]);

  const setSingleAnswer = (qIdx, optIdx) =>
    setAnswers((prev) => prev.map((a, i) => (i === qIdx ? optIdx : a)));

  const toggleMultiAnswer = (qIdx, optIdx) =>
    setAnswers((prev) =>
      prev.map((a, i) => {
        if (i !== qIdx) return a;
        const arr = Array.isArray(a) ? a : [];
        return arr.includes(optIdx) ? arr.filter((x) => x !== optIdx) : [...arr, optIdx];
      })
    );

  const setTextAnswer = (qIdx, value) =>
    setAnswers((prev) => prev.map((a, i) => (i === qIdx ? value : a)));

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

  // Полный разбор с подсветкой (is_visibility = true)
  const renderResults = () => {
    const results = checkResult?.results || [];
    return (
      <div className="space-y-4">
        {results.map((r, idx) => {
          const options = r.options || [];
          const isCorrect = r.is_correct;
          return (
            <div
              key={idx}
              className={`border rounded-xl p-4 ${
                isCorrect
                  ? 'border-green-500/40 bg-green-500/5'
                  : 'border-red-400/40 bg-red-400/5'
              }`}
            >
              <div className="flex items-start gap-2 mb-3">
                {isCorrect
                  ? <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                  : <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                }
                <p className="font-medium text-foreground text-sm">
                  {idx + 1}. {r.prompt || `Вопрос ${idx + 1}`}
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    {r.score} балл(ов)
                  </span>
                </p>
              </div>

              {r.question_type === 'text' ? (
                <div className="ml-6 text-sm text-foreground bg-background border border-border rounded-lg px-3 py-2">
                  {r.text_answer || <span className="text-muted-foreground">Ответ не введён</span>}
                </div>
              ) : (
                <div className="ml-6 space-y-1.5">
                  {options.map((opt, optIdx) => {
                    const isSelected =
                      r.question_type === 'multiple'
                        ? (r.selected_options || []).includes(optIdx)
                        : r.selected_option === optIdx;
                    return (
                      <div
                        key={optIdx}
                        className={`text-sm px-3 py-1.5 rounded-lg border ${
                          isSelected
                            ? isCorrect
                              ? 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'
                              : 'border-red-400/50 bg-red-400/10 text-red-700 dark:text-red-400'
                            : 'border-transparent text-muted-foreground'
                        }`}
                      >
                        {opt}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-2 text-sm text-muted-foreground border-t border-border">
          Итого:{' '}
          <span className="text-foreground font-medium">{checkResult.total_score}</span>
          {' / '}
          <span className="text-foreground font-medium">{checkResult.total_questions}</span>
          {' '}баллов
        </div>
      </div>
    );
  };

  const renderDisabledAnswers = () => (
    <>
      {questions.map((q, idx) => (
        <div key={idx} className="space-y-3 border border-border rounded-xl p-4 bg-muted/10">
          <p className="font-medium text-foreground">
            {idx + 1}. {q.prompt}
          </p>

          {(q.question_type || 'single') === 'text' ? (
            <textarea
              value={typeof answers[idx] === 'string' ? answers[idx] : ''}
              rows={4}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none transition"
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
                  <label key={optIdx} className="flex items-center gap-2 text-sm cursor-not-allowed opacity-70">
                    <input
                      type={t === 'multiple' ? 'checkbox' : 'radio'}
                      name={`q_${idx}`}
                      checked={checked}
                      disabled
                      readOnly
                    />
                    <span className="text-foreground">{opt}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <div className="pt-2 text-sm text-muted-foreground">
        Тест отправлен. Баллы:{' '}
        <span className="text-foreground font-medium">{checkResult.total_score}</span>
        {' / '}
        <span className="text-foreground font-medium">{checkResult.total_questions}</span>
      </div>
    </>
  );

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
          {questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">В тесте нет вопросов.</p>
          ) : checkResult ? (
            // [~] is_visibility определяет режим отображения результатов
            lesson.is_visibility ? renderResults() : renderDisabledAnswers()
          ) : (
            <>
              {questions.map((q, idx) => (
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
              ))}

              {onCheckTest && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={runCheck}
                    disabled={checking || loadingResult}
                    className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
                  >
                    {checking ? 'Проверка...' : 'Проверить тест'}
                  </button>
                </div>
              )}
            </>
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
                <li key={m.id}>
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

        {blockNext && hasNext && (
          <p className="text-xs text-muted-foreground text-center">
            Отправьте ответы и нажмите «Проверить тест», чтобы перейти к следующему занятию.
          </p>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-muted/40 transition disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft size={16} /> Предыдущий
          </button>
          {isLast ? (
            <button
              onClick={onFinish}
              disabled={blockNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-600/90 transition disabled:opacity-30 disabled:pointer-events-none"
            >
              Завершить курс ✓
            </button>
          ) : (
            <button
              onClick={onNext}
              disabled={!hasNext || blockNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-30 disabled:pointer-events-none"
            >
              Следующий <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default TestLesson;
