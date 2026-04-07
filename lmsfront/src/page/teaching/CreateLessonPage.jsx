import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/Header';
import { useTeacher } from '../../hooks/useTeacher';
import LessonTypeSelector from '../../components/forms/LessonTypeSelector';
import LessonBaseFields from '../../components/forms/LessonBaseFields';
import LectureFormFields from '../../components/forms/LectureFormFields';
import VideoFormFields from '../../components/forms/VideoFormFields';
import PracticaFormFields from '../../components/forms/PraticaFormFields';
import FilePicker from '../../components/forms/FilePicker';
import TestFormFields from '../../components/forms/TestFormFields';

const INITIAL_FORM = {
  name: '',
  slug: '',
  display_order: 1,
  content: '',
  images: [],
  video_url: '',
  duration: '',
  max_score: 100,
  deadline_days: null,
  materials: [],
  questions: [],
  is_visibility: true,
};

const CreateLessonPage = () => {
  const { createLesson, createPracticaLesson, uploadLessonMaterials, getModuleSlug } = useTeacher();
  const navigate = useNavigate();
  const { slug, module_slug } = useParams();
  const [moduleData, setModuleData] = useState(null);
  const [lessonType, setLessonType] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchModule = async () => {
      if (!module_slug) return;
      
      try {
        await getModuleSlug(module_slug, {
          setModule: setModuleData
        });
      } catch (err) {
        toast.error(err?.message || 'Модуль не найден');
        navigate(`/teaching/courses/${slug}`);
      }
    };
    
    fetchModule();
  }, [module_slug, slug, navigate]);

  const onChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSelectType = (type) => {
    setLessonType(type);
    setForm(INITIAL_FORM);
  };

  const buildPayload = () => {
    const base = {
      module_id: moduleData?.id,
      name: form.name,
      slug: form.slug,
      display_order: form.display_order,
      lesson_type: lessonType,
    };
    if (lessonType === 'lecture') {
      return { ...base, content: form.content, images: form.images?.filter(url => url && url.trim() !== '') || [] };
    }
    if (lessonType === 'video') {
      return { ...base, video_url: form.video_url, ...(form.duration ? { duration: form.duration } : {}) };
    }
    if (lessonType === 'test') {
      return {
        ...base,
        is_visibility: form.is_visibility,
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
      };
    }
    return base;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!moduleData?.id) return toast.error('Модуль еще не загружен, попробуйте через секунду');
    if (!form.name || !form.slug) return toast.error('Заполните обязательные поля');
    if (lessonType === 'lecture' && !form.content) return toast.error('Добавьте содержание лекции');
    if (lessonType === 'video' && !form.video_url) return toast.error('Укажите ссылку на видео');
    if (lessonType === 'test' && (!form.questions || form.questions.length === 0)) return toast.error('Добавьте вопросы теста');

    setLoading(true);
    try {
      if (lessonType === 'practica') {
        if (!form.content) return toast.error('Добавьте условие практики');

        const fd = new FormData();
        fd.append('module_id', moduleData?.id);
        fd.append('name', form.name);
        fd.append('slug', form.slug);
        fd.append('display_order', form.display_order);
        fd.append('content', form.content);
        fd.append('max_score', form.max_score ?? 100);
        if (form.deadline_days !== null && form.deadline_days !== '') {
          fd.append('deadline_days', form.deadline_days);
        }
        (form.materials || []).forEach((f) => fd.append('materials', f));

        await createPracticaLesson(fd);
      } else {
        const created = await createLesson(buildPayload());
        const files = form.materials || [];
        if (files.length > 0) {
          const lessonSlug = created?.slug || form.slug;
          await uploadLessonMaterials(lessonSlug, files);
        }
      }
      navigate(`/teaching/courses/${slug}`);
    } catch (err) {
      toast.error(err.message || 'Ошибка создания урока');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">  
      <Helmet>
        <title>Создание урока</title>
      </Helmet>
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
          <h1 className="text-2xl font-bold text-foreground mb-2">Новый урок</h1>
          <p className="text-sm text-muted-foreground mb-8">Выберите тип и заполните информацию</p>

          <LessonTypeSelector 
            selectedType={lessonType} 
            onSelectType={handleSelectType} 
          />

          {lessonType && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="h-px bg-border" />
              
              <LessonBaseFields form={form} onChange={onChange} />
              
              <div className="h-px bg-border" />

              {lessonType === 'lecture' && <LectureFormFields form={form} onChange={onChange} />}
              {lessonType === 'video' && <VideoFormFields form={form} onChange={onChange} />}
              {lessonType === 'practica' && <PracticaFormFields form={form} onChange={onChange} />}
              {lessonType === 'test' && <TestFormFields form={form} onChange={onChange} />}
              {(lessonType === 'lecture' || lessonType === 'video' || lessonType === 'test') && (
                <FilePicker
                  label="Материалы (файлы)"
                  files={form.materials || []}
                  onChange={(selected) => onChange('materials', selected)}
                  helperText="Прикрепите файлы, которые будут доступны студентам"
                />
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(`/teaching/courses/${slug}`)}
                  className="px-5 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-muted/30 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={loading || !moduleData?.id}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {loading ? 'Создание...' : 'Создать урок'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default CreateLessonPage;
