import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, ClipboardCheck, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseMarkdown, LESSON_CSS } from '../../utility/markdownParser';
import { useStudents } from '../../hooks/useStudents';
import FilePicker from '../forms/FilePicker';

const PracticaLesson = ({ lesson, onPrev, onNext, hasPrev, hasNext, blockNext = false, onRequirementMetChange }) => {
  const { getMyPracticaSubmission, submitPractica } = useStudents();
  const materials = lesson?.materials || [];
  const attachments = lesson?.attachments || [];
  const [textAnswer, setTextAnswer] = useState('');
  const [files, setFiles] = useState([]);
  const [mySubmission, setMySubmission] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSubmission, setLoadingSubmission] = useState(false);

  const hasMaterials = (materials && materials.length > 0) || (attachments && attachments.length > 0);

  const getAttachmentUrl = (item) => {
    if (!item) return null;
    if (typeof item === 'string') return item;
    if (item.file_url) return item.file_url;
    if (item.url) return item.url;
    return null;
  };

  useEffect(() => {
    if (!lesson?.slug) return;
    const load = async () => {
      setLoadingSubmission(true);
      try {
        const data = await getMyPracticaSubmission(lesson.slug);
        setMySubmission(data);
        setTextAnswer(data?.text_answer || '');
      } finally {
        setLoadingSubmission(false);
      }
    };
    load();
  }, [lesson?.slug]);

  useEffect(() => {
    onRequirementMetChange?.(!!mySubmission);
  }, [mySubmission, onRequirementMetChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!textAnswer || textAnswer.trim() === '') && files.length === 0) {
      toast.error('Добавьте текст или прикрепите файл');
      return;
    }

    setSubmitting(true);
    try {
      const submission = await submitPractica(lesson.slug, {
        textAnswer,
        files,
      });
      setMySubmission(submission);
      setFiles([]);
      toast.success('Решение отправлено');
    } catch (err) {
      toast.error(err.message || 'Ошибка отправки');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{LESSON_CSS}</style>

      <div className="flex flex-col gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
              <ClipboardCheck size={17} className="text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Практика</span>
            <span className="text-muted-foreground">·</span>
            {lesson?.max_score !== undefined && lesson?.max_score !== null && (
              <span className="text-xs text-muted-foreground">
                {lesson.max_score} баллов
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">{lesson.name}</h1>

          {lesson?.deadline_days !== undefined && lesson?.deadline_days !== null && (
            <p className="text-sm text-muted-foreground mt-2">
              Срок: {lesson.deadline_days} дней
            </p>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-8">
          <div
            dangerouslySetInnerHTML={{
              __html: parseMarkdown(lesson?.content || '', 'lesson'),
            }}
          />
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-primary" />
            <h2 className="text-base font-semibold">Материалы</h2>
          </div>

          {!hasMaterials ? (
            <p className="text-sm text-muted-foreground">Материалы не прикреплены.</p>
          ) : (
            <ul className="space-y-2">
              {(materials || []).map((m, idx) => (
                <li key={m.id || idx} className="flex items-center justify-between gap-3">
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

              {(!materials || materials.length === 0) &&
                (attachments || []).map((a, idx) => {
                  const url = getAttachmentUrl(a);
                  if (!url) return null;
                  return (
                    <li key={idx} className="flex items-center justify-between gap-3">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary hover:underline truncate"
                      >
                        Файл {idx + 1}
                      </a>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-base font-semibold mb-4">Ваше решение</h2>

          {loadingSubmission ? (
            <p className="text-sm text-muted-foreground mb-4">Загрузка отправленного решения...</p>
          ) : mySubmission ? (
            <div className="mb-4 space-y-2 text-sm">
              <p className="text-muted-foreground">
                Статус: {mySubmission.is_graded ? 'проверено' : 'на проверке'}
              </p>
              {mySubmission.score !== null && mySubmission.score !== undefined && (
                <p className="text-foreground">Оценка: <b>{mySubmission.score}</b></p>
              )}
              {mySubmission.feedback && (
                <p className="text-foreground">Комментарий: {mySubmission.feedback}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">Вы еще не отправляли решение.</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Введите текст решения..."
              rows={6}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            <FilePicker
              label="Файлы решения"
              files={files}
              onChange={(selected) => setFiles(selected)}
              helperText="Можно прикрепить несколько файлов"
            />

            {mySubmission?.files?.length > 0 && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Ранее отправленные файлы:</p>
                <ul className="space-y-1">
                  {mySubmission.files.map((fileUrl, idx) => (
                    <li key={idx}>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        Файл {idx + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
            >
              <Send size={14} />
              {submitting ? 'Отправка...' : mySubmission ? 'Обновить решение' : 'Отправить решение'}
            </button>
          </form>
        </div>

        {blockNext && hasNext && (
          <p className="text-xs text-muted-foreground text-center">
            Отправьте решение по практике, чтобы перейти к следующему занятию.
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
          <button
            onClick={onNext}
            disabled={!hasNext || blockNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-30 disabled:pointer-events-none"
          >
            Следующий <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </>
  );
};

export default PracticaLesson;

