import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, HelpCircle, FileText } from 'lucide-react';
import { LESSON_CSS } from '../../utility/markdownParser';

const TestLesson = ({ lesson, onPrev, onNext, hasPrev, hasNext }) => {
  const questions = useMemo(() => lesson?.questions || [], [lesson?.questions]);
  const [answers, setAnswers] = useState(() => (questions || []).map(() => null));
  const materials = lesson?.materials || [];

  const setAnswer = (qIdx, optIdx) => {
    setAnswers((prev) => prev.map((a, i) => (i === qIdx ? optIdx : a)));
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

                <div className="space-y-2">
                  {(q.options || []).map((opt, optIdx) => (
                    <label key={optIdx} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name={`q_${idx}`}
                        checked={answers[idx] === optIdx}
                        onChange={() => setAnswer(idx, optIdx)}
                      />
                      <span className="text-foreground">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))
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

