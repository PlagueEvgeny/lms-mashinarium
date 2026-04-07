import { API } from '../../services/api';
import { Helmet } from 'react-helmet-async';
import { authFetch } from '../../services/authFetch';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // [+] useParams
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/Header';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useTeacher } from '../../hooks/useTeacher';
import { Upload, X } from 'lucide-react';

const STATUSES = [
  { value: 'DRAFT', label: 'Черновик' },
  { value: 'PUBLISHED', label: 'Опубликован' },
  { value: 'TRASH', label: 'Корзина' },
];

const EditCoursesPage = () => {
  const { user } = useAuthUser();
  const { updateCourse } = useTeacher(); 
  const navigate = useNavigate();
  const { slug } = useParams(); 
  const [courseId, setCourseId] = useState(null); 
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true); 

  const [formData, setFormData] = useState({
    name: '',
    short_description: '',
    description: '',
    image: '',
    price: '',
    status: ['DRAFT'],
    display_order: 0,
    category_ids: [],
    teacher_ids: [],
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await authFetch(API.category_all);
        const data = await res.json();
        setCategories(data);
      } catch {
        toast.error('Не удалось загрузить категории');
      }
    };
    fetchCategories();
  }, []);

  // [~] Вместо подстановки себя как преподавателя — загружаем данные курса
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await authFetch(API.teaching_course(slug));
        if (!res.ok) throw new Error();
        const course = await res.json();

        setCourseId(course.id);

        setFormData({
          name:              course.name              ?? '',
          short_description: course.short_description ?? '',
          description:       course.description       ?? '',
          image:             course.image             ?? '',
          price:             course.price             ?? '',
          status:            course.status            ?? ['DRAFT'],
          display_order:     course.display_order     ?? 0,
          teacher_ids:       course.teacher_ids       ?? [],
          category_ids: (course.category_ids ?? course.categories ?? []).map((c) =>
    typeof c === 'object' ? c.id : c
  ),
        });

        if (course.image) setImagePreview(course.image);
      } catch {
        toast.error('Не удалось загрузить курс');
      } finally {
        setLoading(false); // [+]
      }
    };
    fetchCourse();
  }, [slug]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNameChange = (e) => {
    setFormData((prev) => ({ ...prev, name: e.target.value }));
  };

  const handleCategoryToggle = (id) => {
    setFormData((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(id)
        ? prev.category_ids.filter((c) => c !== id)
        : [...prev.category_ids, id],
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image: '' }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);
  try {
    await updateCourse(courseId, formData, imageFile); 
    navigate('/teaching');
  } catch (err) {
    toast.error(err.message);
  } finally {
    setSubmitting(false);
  }
};

  // [+] Пока данные курса не пришли с сервера — не рендерим форму
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
      <Helmet>
        <title>Изменение курса</title>
      </Helmet>
      <Header />
      <Toaster position="top" />
      <main className="max-w-7xl mx-auto px-4 py-10">
        <button
          onClick={() => navigate('/teaching')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors mb-8"
        >
          ← Назад к курсам
        </button>

        <div className="bg-card rounded-2xl border border-border p-8">
          {/* [~] Заголовок */}
          <h1 className="text-2xl font-bold text-foreground mb-6">Редактирование курса</h1>

          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Название курса *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleNameChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Например: Программирование на Python"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Краткое описание
              </label>
              <input
                type="text"
                name="short_description"
                value={formData.short_description}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Пару слов о курсе"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Описание
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Подробное описание курса"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Обложка курса
              </label>
              {imagePreview ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <Upload size={24} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-400">Нажмите для загрузки</span>
                  <span className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP · до 5MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Цена *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Порядок отображения *
                </label>
                <input
                  type="number"
                  name="display_order"
                  value={formData.display_order}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Статус *</label>
              <select
                name="status"
                value={formData.status[0]}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: [e.target.value] }))}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Категории *</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const selected = formData.category_ids.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryToggle(cat.id)}
                      className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                        selected
                          ? 'bg-primary text-white border-primary'
                          : 'bg-background text-foreground border-border hover:border-primary'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {user && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Преподаватель
                </label>
                <div className="flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                    {user.name?.[0] ?? user.email?.[0]}
                  </div>
                  <span className="text-sm text-foreground">{user.name ?? user.email}</span>
                  <span className="ml-auto text-xs text-gray-400">Вы</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/teaching')}
                className="flex-1 px-6 py-3 border border-border rounded-lg text-foreground hover:bg-background/80 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {/* [~] Текст кнопки */}
                {submitting ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
};

export default EditCoursesPage; 
