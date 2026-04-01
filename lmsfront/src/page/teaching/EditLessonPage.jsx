import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/Header';
import { API } from '../../services/api';
import { authFetch } from '../../services/authFetch';
import { useTeacher } from '../../hooks/useTeacher';
import MarkdownEditor from '../../components/MarkdownEditor';
import FilePicker from '../../components/forms/FilePicker';
import TestFormFields from '../../components/forms/TestFormFields';

const EditLessonPage = () => {
  const navigate = useNavigate();
  const { slug, lesson_slug } = useParams();

  const { updateLesson, updatePracticaLesson, uploadLessonMaterials, uploadLessonImage } = useTeacher();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(null);

  const [form, setForm] = useState({
    name: '',
    content: '',
    display_order: 1,
    video_url: '',
    duration: '',
    max_score: 100,
    deadline_days: null,
    newMaterials: [],
    questions: [],
  });

  useEffect(() => {
    const load = async () => {
      try {
        const response = await authFetch(API.get_lesson_slug(lesson_slug));
        if (!response.ok) throw new Error('Занятие не найдено');
        const data = await response.json();
        setLesson(data);
        setForm({
          name: data.name || '',
          content: data.content || '',
          display_order: data.display_order ?? 1,
          video_url: data.video_url || '',
          duration: data.duration ?? '',
          max_score: data.max_score ?? 100,
          deadline_days: data.deadline_days ?? null,
          newMaterials: [],
          questions: data.questions ?? [],
        });
      } catch (e) {
        toast.error(e.message || 'Не удалось загрузить занятие');
        navigate(`/teaching/courses/${slug}`);
      } finally {
        setLoading(false);
      }
    };
    if (lesson_slug) load();
  }, [lesson_slug, slug, navigate]);

  const handleImageUpload = async (file) => {
    try {
      const url = await uploadLessonImage(file);
      return url;
    } catch (e) {
      toast.error(e.message || 'Ошибка загрузки изображения');
      return null;
    }
  };

  const uploadMaterialsIfNeeded = async () => {
    if (!lesson?.slug) return;
    if (form.newMaterials && form.newMaterials.length > 0) {
      await uploadLessonMaterials(lesson.slug, form.newMaterials);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lesson) return;

    try {
      if (lesson.lesson_type === 'lecture') {
        await updateLesson(lesson.id, {
          name: form.name,
          display_order: form.display_order,
          content: form.content,
        });
        await uploadMaterialsIfNeeded();
      } else if (lesson.lesson_type === 'video') {
        await updateLesson(lesson.id, {
          name: form.name,
          display_order: form.display_order,
          video_url: form.video_url,
          duration: form.duration === '' ? null : Number(form.duration),
        });
        await uploadMaterialsIfNeeded();
      } else if (lesson.lesson_type === 'test') {
        await updateLesson(lesson.id, {
          name: form.name,
          display_order: form.display_order,
          questions: (form.questions || []).map((q) => {
            const t = q?.question_type || 'single';
            if (t === 'text') {
              return {
                prompt: q?.prompt || '',
                question_type: 'text',
                options: null,
                correct_text: (q?.correct_text ?? '').trim() || null,
              };
            }
            const opts = Array.isArray(q?.options) ? q.options : [];
            const mapping = new Map(); // oldIdx -> newIdx
            const cleanOpts = [];
            opts.forEach((s, oldIdx) => {
              const v = typeof s === 'string' ? s.trim() : '';
              if (!v) return;
              mapping.set(oldIdx, cleanOpts.length);
              cleanOpts.push(v);
            });

            const remap = (idx) => {
              if (!Number.isFinite(idx)) return null;
              return mapping.has(idx) ? mapping.get(idx) : null;
            };
            return {
              prompt: q?.prompt || '',
              question_type: t,
              options: cleanOpts,
              ...(t === 'single'
                ? { correct_option: remap(q?.correct_option) }
                : { correct_options: (Array.isArray(q?.correct_options) ? q.correct_options : []).map(remap).filter((x) => x !== null) }),
            };
          }),
        });
        await uploadMaterialsIfNeeded();
      } else if (lesson.lesson_type === 'practica') {
        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('content', form.content);
        fd.append('display_order', form.display_order);
        fd.append('max_score', form.max_score);
        if (form.deadline_days !== null && form.deadline_days !== '') {
          fd.append('deadline_days', form.deadline_days);
        }
        if (form.newMaterials && form.newMaterials.length > 0) {
          form.newMaterials.forEach((f) => fd.append('materials', f));
        }
        await updatePracticaLesson(lesson_slug, fd);
      } else {
        throw new Error(`Тип урока "${lesson.lesson_type}" пока не поддерживается`);
      }
      navigate(`/teaching/courses/${slug}`);
    } catch (err) {
      toast.error(err.message || 'Ошибка обновления');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-64 text-gray-400">Загрузка...</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Не удалось загрузить занятие
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster position="top-center" />
      <main className="max-w-7xl mx-auto px-4 py-10">
        <button
          onClick={() => navigate(`/teaching/courses/${slug}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          ← Назад к курсу
        </button>

        <div className="bg-card rounded-2xl border border-border p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Редактирование урока ({lesson.lesson_type})
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Измените содержание и при необходимости прикрепите новые материалы
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Название урока
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Порядок отображения
                </label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm((prev) => ({ ...prev, display_order: parseInt(e.target.value || '0', 10) }))}
                  min={0}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {lesson.lesson_type === 'practica' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Максимальный балл
                  </label>
                  <input
                    type="number"
                    value={form.max_score}
                    onChange={(e) => setForm((prev) => ({ ...prev, max_score: parseInt(e.target.value || '0', 10) }))}
                    min={0}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>

            {lesson.lesson_type === 'practica' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Срок (дни)
                </label>
                <input
                  type="number"
                  value={form.deadline_days ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      deadline_days: e.target.value === '' ? null : parseInt(e.target.value, 10),
                    }))
                  }
                  min={0}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {(lesson.lesson_type === 'lecture' || lesson.lesson_type === 'practica') && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {lesson.lesson_type === 'lecture' ? 'Содержание лекции' : 'Условие практики'}
                </label>
                <MarkdownEditor
                  value={form.content}
                  onChange={(val) => setForm((prev) => ({ ...prev, content: val }))}
                  onImageUpload={handleImageUpload}
                />
              </div>
            )}

            {lesson.lesson_type === 'video' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Ссылка на видео</label>
                  <input
                    type="text"
                    value={form.video_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, video_url: e.target.value }))}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Длительность (сек)</label>
                  <input
                    type="number"
                    value={form.duration ?? ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))}
                    min={0}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {lesson.lesson_type === 'test' && (
              <div>
                <TestFormFields form={form} onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))} />
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Материалы (для замены прикрепите новые файлы)
              </label>

              {(lesson.materials && lesson.materials.length > 0) ? (
                <ul className="space-y-1 text-sm text-primary">
                  {lesson.materials.map((m) => (
                    <li key={m.id} className="flex items-center gap-2">
                      <a href={m.file_url} target="_blank" rel="noreferrer" className="hover:underline truncate">
                        {m.title}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                lesson.attachments && Array.isArray(lesson.attachments) && lesson.attachments.length > 0 && (
                  <ul className="space-y-1 text-sm text-primary">
                    {lesson.attachments.map((url, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <a href={url} target="_blank" rel="noreferrer" className="hover:underline truncate">
                          Файл {idx + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                )
              )}

              <FilePicker
                label=""
                files={form.newMaterials || []}
                onChange={(selected) => setForm((prev) => ({ ...prev, newMaterials: selected }))}
                helperText="Прикрепите файлы для замены/обновления материалов"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(`/teaching/courses/${slug}`)}
                className="flex-1 px-6 py-3 border border-border rounded-xl text-foreground hover:bg-muted/30 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
              >
                Сохранить
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditLessonPage;

