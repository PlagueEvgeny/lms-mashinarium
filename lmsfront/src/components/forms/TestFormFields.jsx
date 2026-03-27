import { useMemo } from 'react';

const QUESTION_TYPES = [
  { value: 'single', label: 'Один ответ' },
  { value: 'multiple', label: 'Несколько ответов' },
  { value: 'text', label: 'Письменный ответ' },
];

const TestFormFields = ({ form, onChange }) => {
  const questions = useMemo(() => {
    const q = form.questions || [];
    return Array.isArray(q) ? q : [];
  }, [form.questions]);

  const setQuestions = (next) => onChange('questions', next);

  const addQuestion = () => {
    setQuestions([...(questions || []), { prompt: '', question_type: 'single', options: [''] }]);
  };

  const updateQuestion = (idx, patch) => {
    setQuestions(
      questions.map((q, i) => {
        if (i !== idx) return q;
        return { ...q, ...patch };
      })
    );
  };

  const addOption = (qIdx) => {
    const q = questions[qIdx] || {};
    const options = Array.isArray(q.options) ? q.options : [];
    updateQuestion(qIdx, { options: [...options, ''] });
  };

  const updateOption = (qIdx, optIdx, value) => {
    const q = questions[qIdx] || {};
    const options = Array.isArray(q.options) ? q.options : [];
    updateQuestion(qIdx, { options: options.map((o, i) => (i === optIdx ? value : o)) });
  };

  const removeOption = (qIdx, optIdx) => {
    const q = questions[qIdx] || {};
    const options = Array.isArray(q.options) ? q.options : [];
    updateQuestion(qIdx, { options: options.filter((_, i) => i !== optIdx) });
  };

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground">Вопросы теста</p>
      </div>

      {(questions || []).map((q, idx) => {
        const qType = q.question_type || 'single';
        const options = Array.isArray(q.options) ? q.options : [];
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
                Тип ответа
              </label>
              <select
                value={qType}
                onChange={(e) => {
                  const nextType = e.target.value;
                  if (nextType === 'text') {
                    updateQuestion(idx, { question_type: nextType, options: null });
                  } else {
                    const nextOptions = (Array.isArray(q.options) && q.options.length > 0) ? q.options : [''];
                    updateQuestion(idx, { question_type: nextType, options: nextOptions });
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {qType !== 'text' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">
                    Варианты ответа
                  </label>
                  <button
                    type="button"
                    onClick={() => addOption(idx)}
                    className="px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-muted/30 transition"
                  >
                    + Добавить вариант
                  </button>
                </div>

                <div className="space-y-2">
                  {options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      {qType === 'single' ? (
                        <input
                          type="radio"
                          name={`correct_${idx}`}
                          checked={q.correct_option === optIdx}
                          onChange={() => updateQuestion(idx, { correct_option: optIdx, correct_options: null })}
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={Array.isArray(q.correct_options) ? q.correct_options.includes(optIdx) : false}
                          onChange={() => {
                            const current = Array.isArray(q.correct_options) ? q.correct_options : [];
                            const next = current.includes(optIdx)
                              ? current.filter((x) => x !== optIdx)
                              : [...current, optIdx];
                            updateQuestion(idx, { correct_options: next, correct_option: null });
                          }}
                        />
                      )}
                      <input
                        type="text"
                        value={opt ?? ''}
                        onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                        placeholder={`Вариант #${optIdx + 1}`}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(idx, optIdx)}
                        className="px-3 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-muted/30 transition"
                        title="Удалить вариант"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {qType === 'text' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Правильный ответ (для автопроверки, необязательно)
                </label>
                <textarea
                  value={q.correct_text ?? ''}
                  onChange={(e) => updateQuestion(idx, { correct_text: e.target.value })}
                  rows={3}
                  placeholder="Например: протокол — это набор правил..."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
            )}

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

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={addQuestion}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
        >
          + Добавить вопрос
        </button>
      </div>
    </div>
  );
};

export default TestFormFields;

