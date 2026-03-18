import { API } from '../../services/api';
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/Header';

const CourseDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(API.detail_course(slug));
        if (!res.ok) throw new Error('Курс не найден');
        const data = await res.json();
        setCourse(data);
      } catch (err) {
        toast.error('Не удалось загрузить курс');
        console.log(err.message);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!course) return null;

return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster position="top" />
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Назад */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors mb-8"
        >
          ← Назад к курсам
        </button>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-foreground mb-2'>{course.name}</h1>
          <p className='text-sm text-muted-foreground'>{course.short_description}</p>
        </div>
        <section className='bg-card rounded-xl p-6 mb-8'>
          <h2 className='text-lg font-semibold mb-4'>О курсе</h2>
          <p className='text-sm text-muted-foreground leading-relaxed whitespace-pre-line'>{course.description}</p>
        </section>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='bg-card mb-8 p-6 rounded-xl lg:col-span-2'>
            <h2 className='text-lg font-semibold mb-4'>Краткий план курса или с чем вам предстоит познакомится</h2>
            <div className='space-y-3'>
              {course.modules.map((module, index) => (
                <div key={index} className='flex gap-4'>
                  <div className='w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-medium'>
                    {index + 1}
                  </div>
                <p className='text-sm text-muted-foreground pt-1'>{module.name}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className='bg-card p-6 mb-2 rounded-xl'>
              <h2 className='text-lg font-semibold'>Преподаватели</h2>
            </div>
            <div className='space-y-4 bg-card p-6 rounded-xl'>
              {course.teachers.map((teacher) => (
                <div key={teacher.user_id} className='flex items-start gap-3'>
                  <div className='w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0'>
                    <span className='text-sm font-medium'>{teacher.first_name[0]}</span>
                  </div>
                  <div>
                    <p className='text-sm font-medium text-primary'>{teacher.first_name} {teacher.last_name} {teacher.patronymic}</p>
                    <p className='text-xs text-muted-foreground'>О себе надо добавить</p>
                  </div>  
                </div>
              ))}
            </div>
          </div>
        </div>  
      </main>
    </div>
  );
};

export default CourseDetailPage;
