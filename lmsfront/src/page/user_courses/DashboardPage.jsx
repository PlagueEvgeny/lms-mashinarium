import { API } from '../../services/api';
import { authFetch } from '../../services/authFetch';
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/Header';
import { useAuthUser } from '../../hooks/useAuthUser';

const DashboardPage = () => {
  const { user } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]); 
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await authFetch(API.dashboard);       
        if (!response.ok) throw new Error('Ошибка загрузки курсов');
        const data = await response.json();
        setCourses(data);
      } catch (err) {
        setError(err);
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
      <Toaster position="top-center" />
      <main className="max-w-7xl mx-auto px-4 py-10">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{ user?.first_name }, добрый день</h1>
          <p className="text-muted-foreground mt-1">Сегодня отличный день, что бы узнать новое или закрепить знание на практике</p>
        </div>
{!loading && !error && courses.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg"></p>
          </div>
        )}

        {!loading && !error && (
          <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Ваши курсы</h2>
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {courses.map((course) => (
              <div
                key={course.slug}
                className="group flex items-center gap-5 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-primary transition-all duration-300 p-5 cursor-pointer"
                onClick={() => navigate(`/user/courses/${course.slug}`)}
              >
                <img
                  src={course.image}
                  alt={course.name}
                  className="w-24 h-24 object-cover rounded-xl flex-shrink-0 bg-muted"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-foreground leading-snug mb-1 group-hover:text-primary transition-colors">
                    {course.name}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {course.short_description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
