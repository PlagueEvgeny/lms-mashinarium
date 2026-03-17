import { API } from '../../services/api';
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/Header';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(API.list_course);
        if (!response.ok) throw new Error('Ошибка загрузки курсов');
        const data = await response.json();
        setCourses(data);
      } catch (err) {
        setError(err.message);
        toast.error('Не удалось загрузить курсы');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster position="top-right" />
      <main className="max-w-7xl mx-auto px-4 py-10">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Курсы</h1>
          <p className="text-muted-foreground mt-1">Выбери курс и начни обучение</p>
        </div>

        {loading && (
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">😕 {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:opacity-90 transition"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">Курсы пока не добавлены</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {courses.map((course) => (
              <div
                key={course.slug}
                className="group flex items-center gap-5 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-primary transition-all duration-300 p-5 cursor-pointer"
                onClick={() => navigate(`/courses/${course.slug}`)}
              >
                <img
                  src={course.image}
                  alt={course.name}
                  className="w-24 h-24 object-cover rounded-xl flex-shrink-0 bg-muted"
                  onError={(e) => { e.target.src = 'https://placehold.co/96x96?text=📚' }}
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-foreground leading-snug mb-1 group-hover:text-primary transition-colors">
                    {course.name}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {course.short_description}
                  </p>
                  <span className="inline-block text-sm font-bold text-primary">
                    {Number(course.price) === 0 ? 'Бесплатно' : `${Number(course.price).toLocaleString('ru-RU')} ₽`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
};

export default CoursesPage;
