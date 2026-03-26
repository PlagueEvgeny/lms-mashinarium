import { API } from '../../services/api';
import { authFetch } from '../../services/authFetch';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/Header';
import { useTeacher } from '../../hooks/useTeacher';
import LessonTypeSelector from '../../components/forms/LessonTypeSelector';
import LessonBaseFields from '../../components/forms/LessonBaseFields';
import LectureFormFields from '../../components/forms/LectureFormFields';
import VideoFormFields from '../../components/forms/VideoFormFields';

const INITIAL_FORM = {
  name: '',
  slug: '',
  display_order: 1,
  content: '',
  images: [],
  video_url: '',
  duration: '',
};

const CreateLessonPage = () => {
  const { createLesson, getModuleSlug } = useTeacher();
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
      } catch (error) {
        toast.error('Модуль не найден');
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
    return base;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.slug) return toast.error('Заполните обязательные поля');
    if (lessonType === 'lecture' && !form.content) return toast.error('Добавьте содержание лекции');
    if (lessonType === 'video' && !form.video_url) return toast.error('Укажите ссылку на видео');

    setLoading(true);
    try {
      await createLesson(moduleData.id, buildPayload());
      navigate(`/teaching/courses/${slug}`);
    } catch (err) {
      toast.error(err.message || 'Ошибка создания урока');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster position="top-right" />
      <main className="max-w-3xl mx-auto px-4 py-8">
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
                  disabled={loading}
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
