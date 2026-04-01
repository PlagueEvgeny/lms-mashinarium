import { API } from '../../services/api';
import { authFetch } from '../../services/authFetch';
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/Header';
import { useAuthUser } from '../../hooks/useAuthUser';
import { Plus, FileText, Users, MoreVertical, Edit, Trash2, CheckCircle } from 'lucide-react';

const TeachingPage = () => {
  const { user } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null)
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await authFetch(API.teaching);       
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
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-foreground'>Мои курсы</h1>
            <p className='text-muted-foreground mt-1'>Управление курсами и материалами</p>
          </div>
          <button ttitle="Создать курс"
                  onClick={() => navigate('/teaching/courses/new')}
                  className='bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary transition-colors flex items-center gap-2'>
            <Plus className='w-5 h-5'  /> Создать курс 
          </button>
        </div>
        <div className='grid gap-4'>
          {courses.map(course => {
            const modulesCount = course.modules?.length || 0
            const usersCount = course.students?.length || 0
            return (
              <div key={course.id} className='bg-card rounded-xl border border-border p-6'>
                <div className='flex items-start gap-4'>
                  <div className='w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0'>
                    {course.image ? (
                      <img src={course.image} alt={course.name} className='w-8 h-8 rounded-lg' />
                    ) : (
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between gap-4'>
                      <div>
                        <h3 className='text-lg font-semibold text-foreground'>{course.name}</h3>
                        <p className='text-sm text-muted-foreground mt-1 lime-clamp-2'>{course.short_description}</p>
                      </div>
                      <div className='relative'>
                        <button
                          onClick={() => setMenuOpen(menuOpen === course.id ? null : course.id)}
                          className='p-2 hover:bg-muted rounded-lg transition-colors'
                        >
                           <MoreVertical className='w-5 h-5 text-muted-foreground' / >
                        </button>
                        {menuOpen === course.id && (
                          <>
                            <div className='fixed inset-0 z-10' onClick={() => setMenuOpen(null)} />
                            <div className='absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-20 py-1'>
                              <button title="Редактировать"
                                onClick={() => navigate(`/teaching/courses/${course.slug}/edit`)}
                                className='flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors'>
                                <Edit className='w-5 h-5'  /> Редактировать 
                              </button> 
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className='flex items-center gap-6 mt-4 text-sm text-muted-foreground'>
                      <div className='flex items-center gap-2'>
                        <FileText className='w-4 h-4' />
                        <span>{modulesCount} модулей</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Users className='w-4 h-4' />
                        <span>{usersCount} студентов</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        {course.status.map(status => {
                          return (
                            <div key={status} className='flex items-center gap-2'>
                              {status === 'PUBLISHED' ? (
                                <CheckCircle className='w-4 h-4 text-green-500' />
                              ) : status === 'DRAFT' ? (
                                <Edit className='w-4 h-4 text-yellow-500' />
                              ) : (
                                <Trash2 className='w-4 h-4 text-red-500' />
                              )}
                              <span className={
                                status === 'PUBLISHED' ? 'text-green-600' : 
                                status === 'DRAFT' ? 'text-yellow-600' : 
                                'text-red-600'
                              }>
                                {status === 'PUBLISHED' ? 'Опубликован' : 
                                status === 'DRAFT' ? 'Черновик' : 
                                'В корзине'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <div className='flex items-center gap-3 mt-4'>
                      <button
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                        onClick={() => navigate(`/teaching/courses/${course.slug}`)}
                      >
                        Управление курсом
                      </button>
                    </div>  
                  </div>  
                </div>  
              </div>
            )
          })}
        </div>
      </main>
    </div>
  );
};

export default TeachingPage;
