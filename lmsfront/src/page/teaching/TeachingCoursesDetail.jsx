import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/Header';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useTeacher } from '../../hooks/useTeacher';
import { Edit, FileText, GripVertical, MoreVertical, Plus, Trash2 } from 'lucide-react';

const TeachingCoursesDetail = () => {
  const { user } = useAuthUser();
  const navigate = useNavigate();
  const { teachingCourseDetail, createModule, deleteModule } = useTeacher();
  const { slug } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModule, setShowAddModule] = useState(false)
  const [menuOpen, setMenuOpen] = useState(null)
  const [newModule, setNewModule] = useState({
    name: '',
    slug: '',
    description: '',
    display_order: ''
  })

  useEffect(() => {
    teachingCourseDetail(slug, { setCourse, setLoading, navigate, toast });
  }, [slug, setCourse, setLoading, navigate, toast]);

  const handleChangeModule = (e) => {
    const { name, value } = e.target;
    setNewModule((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddModule = async (e) => {
    e.preventDefault()
    setLoading(true)
    try{
      await createModule(course.id, newModule)
      await teachingCourseDetail(slug, { setCourse, setLoading, navigate, toast })
      setNewModule({
        name: '',
        slug: '',
        description: '',
        display_order: ''
      })
      setShowAddModule(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = async (id) => {
    if (confirm("Удалить этот модуль")){
      await deleteModule(id)
      await teachingCourseDetail(slug, { setCourse, setLoading, navigate, toast })
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!course) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster position="top-right" />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/teaching')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors mb-8"
        >
          ← Назад к курсам
        </button>
        <div className='bg-card rounded-2xl border border-border p-6 mb-6'>
          <div className='flex items-center gap-4'>
            <div className='w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0'>
              <img
                src={course.image}
                alt={course.name}
                className="w-10 h-10 rounded-xl"
                />
            </div>
            <div className='flex-1'>
              <h1 className='text-2xl font-bold text-foreground'>{course.name}</h1>
              <p className='text-muted-foreground mt-1'>{course.short_description}</p>
            </div>
            <button title="Редактировать"
                    onClick={() => navigate(`/teaching/courses/${course.slug}/edit`)}
                    className='bg-muted text-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors flex items-center gap-2'>
                    <Edit className='w-4 h-4'  /> Редактировать 
            </button> 
          </div>
        </div>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-semibold'>Модули и уроки</h2>
          <button 
              onClick={() => setShowAddModule(true)}
              className='bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-4'
          >
            <Plus className='w-4 h-4' / >
            Добавить модуль
          </button>
        </div>
        {showAddModule && (
          <div className='bg-card rounded-xl border border-border p-4 mb-4'>
            <form onSubmit={handleAddModule} className='flex items-center gap-3'>
              <input 
                type="number"
                name="display_order"
                value={newModule.display_order}
                onChange={handleChangeModule}
                className='flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary' 
                placeholder='Номер модуля'
                autoFocus
               / >
              <input 
                type="text"
                name="name"
                value={newModule.name} 
                onChange={handleChangeModule}
                className='flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary' 
                placeholder='Название модуля'
                autoFocus
               / >
              <input 
                type="text"
                name="slug"
                value={newModule.slug}
                onChange={handleChangeModule}
                className='flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary' 
                placeholder='Slug модуля'
                autoFocus
               / >
              <input 
                type="text"
                name="description"
                value={newModule.description} 
                onChange={handleChangeModule}
                className='flex-2 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary' 
                placeholder='Краткое описание модуля'
                autoFocus
               / >
              <button 
                type="submit"
                className='bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors'  
              >
                Добавить
              </button>
              <button 
                type="button" 
                onClick={() => {setShowAddModule(false)}}
                className='px-4 py-2 text-muted-foreground hover:text-foreground transition-colors'
              >
                Отмена
              </button>
            </form>
          </div>
        )}
        {course.modules?.length === 0 ? (
          <div className='bg-card rounded-xl border border-border p-12 text-center'>
            <div className='w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4'>
              <FileText className='w-6 h-6 text-muted-foreground' / >
            </div>
            <h3 className='text-lg font-medium mb-2'>Нет модулей</h3>
          </div>
        ) : (
          <div className='space-y-4'>
            {course.modules?.map((module) => (
              <div key={module.id} className='bg-card rounded-xl border border-border overflow-hidden'>
                <div
                   className='flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors'
                   onClick=""     
                >
                  <GripVertical className='w-5 h-5 text-muted-foreground' / >
                  <div className='w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium'>
                    {module.display_order}
                  </div>
                  <span className='flex-1 font-medium'>{module.name}</span>
                  <div className='relative'>
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen == module.id ? null : module.id) }}
                            className='p-1 hover:bg-muted rounded transition-colors'
                    >
                      <MoreVertical className='w-4 h-4 text-muted-foreground' / >
                    </button>
                    {menuOpen === module.id && (
                      <>
                        <div className='fixed inset-0 z-10' onClick={() => setMenuOpen(null)} />
                        <div className='absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-lg shadow-lg z-20 py-1'>
                          <button 
                            onClick={() => { handleDeleteModule(module.id); setMenuOpen(null)}}
                            className='flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors w-full text-left text-destructive'
                          >
                            <Trash2 className='w-4 h-4' />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))} 
          </div>
        )}
      </main>
    </div>
  );
};

export default TeachingCoursesDetail;
