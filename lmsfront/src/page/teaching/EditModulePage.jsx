import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/Header';
import { useTeacher } from '../../hooks/useTeacher';

const EditModulePage = () => {
  const { getModuleSlug, updateModule } = useTeacher(); 
  const navigate = useNavigate();
  const { slug, module_slug } = useParams(); 
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [module, setModule] = useState(null); 

  const [formData, setFormData] = useState({
    course_id: null, 
    name: '',
    slug: '',
    description: '',
    display_order: 0,
});

  
  useEffect(() => {
    const fetchModule = async () => {
      try {
        await getModuleSlug(module_slug, { setModule }); 
      } catch {
        toast.error('Не удалось загрузить модуль');
      } finally {
        setLoading(false);
      }
    };
    fetchModule();
  }, [module_slug]);

 
  useEffect(() => {
    if (!module) return;
    setFormData({
      course_id: module.course_id, 
      name: module.name ?? '',
      slug: module.slug ?? '',
      description: module.description ?? '',
      display_order: module.display_order ?? 0,
    });
  }, [module]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateModule(module.id, formData);
      navigate(`/teaching/courses/${slug}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-64 text-gray-400">
          Загрузка...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster position="top-right" />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(`/teaching/courses/${slug}`)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors mb-8"
        >
          ← Назад к курсам
        </button>

        <div className="bg-card rounded-2xl border border-border p-8">
          <h1 className="text-2xl font-bold text-foreground mb-6">Редактирование модуля</h1>

          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Название модуля *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Например: Введение в Python" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Slug *</label>
              <input type="text" name="slug" value={formData.slug} onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="intro-to-python" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Описание</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={4}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Описание модуля" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Порядок отображения *</label>
              <input type="number" name="display_order" value={formData.display_order} onChange={handleChange}
                min="0" className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate('/teaching')}
                className="flex-1 px-6 py-3 border border-border rounded-lg text-foreground hover:bg-background/80 transition-colors">
                Отмена
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                {submitting ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
};

export default EditModulePage;
