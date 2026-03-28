import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/Header';
import LessonCard from '../../components/LessonCard';
import { authFetch } from '../../services/authFetch';
import { API } from '../../services/api';
import { useSequentialLessonGates } from '../../hooks/useSequentialLessonGates';

const UserCourse = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  const { allLessons, canAccessLessonOnOverview } = useSequentialLessonGates(slug, course);

  const lessonIndexBySlug = useMemo(() => {
    const m = {};
    allLessons.forEach((l, i) => {
      m[l.slug] = i;
    });
    return m;
  }, [allLessons]);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await authFetch(API.user_course(slug));
        if (!response.ok) throw new Error('Курс не найден');
        const data = await response.json();
        setCourse(data);
      } catch (err) {
        toast.error('Не удалось загрузить курс');
        console.log(err.message);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster position="top" />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors mb-8"
        >
          ← Назад к курсам
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl p-6 flex flex-col items-center text-center">
              <img src={course.image} alt={course.name} className="w-16 h-16 mb-4 rounded-full" />
              <h1 className="text-sm font-medium font-foreground">{course.name}</h1>
            </div>
          </div>

          <div className="lg:col-span-3">
            {course.modules.map((module, index) => (
              <div key={module.id} className="mb-8">
                <div className="flex item-baseline gap-4 mb-3 border-b border-border pb-2">
                  <span className="text-sm text-muted-foreground">{index + 1}</span>
                  <h2 className="text-lg font-semibold text-foreground">{module.name}</h2>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 mb:grid-cols-5 gap-4">
                  {module.lessons.map((lesson) => {
                    const idx = lessonIndexBySlug[lesson.slug];
                    const locked = idx !== undefined && !canAccessLessonOnOverview(idx);
                    return (
                      <LessonCard
                        key={`${module.slug}-${lesson.slug}`}
                        navigate={navigate}
                        courseSlug={course.slug}
                        moduleSlug={module.slug}
                        lesson={lesson}
                        locked={locked}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserCourse;
