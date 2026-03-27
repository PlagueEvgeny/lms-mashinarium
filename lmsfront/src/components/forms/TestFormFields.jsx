import { useMemo } from 'react';

const normalizeOptions = (raw) => {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const TestFormFields = ({ form, onChange }) => {
  const questions = useMemo(() => {
    const q = form.questions || [];
    return Array.isArray(q) ? q : [];
  }, [form.questions]);

  const setQuestions = (next) => onChange('questions', next);

  const addQuestion = () => {
    setQuestions([...(questions || []), { prompt: '', options: [''] }]);
  };

  const updateQuestion = (idx, patch) => {
    setQuestions(
      questions.map((q, i) => {
        if (i !== idx) return q;
        return { ...q, ...patch };
      })
    );
  };

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Вопросы теста</p>
        <button
          type="button"
          onClick={addQuestion}
          className="px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-muted/30 transition"
        >
          + Добавить вопрос
        </button>
      </div>

      {(questions || []).map((q, idx) => {
        const optionsRaw = (q.options || []).join(', ');
        return (
          <div key={idx} className="space-y-3 bg-muted/20 border border-border rounded-xl p-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Вопрос #{idx + 1}
              </label>
              <input
                type="text"
                value={q.prompt || ''}
                onChange={(e) => updateQuestion(idx, { prompt: e.target.value })}
                placeholder="Например: Что такое Python?"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Варианты ответа (через запятую)
              </label>
              <input
                type="text"
                value={optionsRaw}
                onChange={(e) => updateQuestion(idx, { options: normalizeOptions(e.target.value) })}
                placeholder="Например: язык, компилятор, ... "
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition font-mono text-sm"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => removeQuestion(idx)}
                className="text-sm text-destructive hover:underline"
              >
                Удалить
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TestFormFields;

