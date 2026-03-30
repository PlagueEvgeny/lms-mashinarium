import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/Header';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useTeacher } from '../../hooks/useTeacher';
import { Edit, FileText, GripVertical, MoreVertical, Plus, Trash2, ChevronUp, ChevronDown, Video, ClipboardList, HelpCircle, Edit2, Users, ClipboardCheck, BarChart3 } from 'lucide-react';

const lessonTypeIcons = {
  lecture: FileText,
  video: Video,
  practica: ClipboardList,
  test: HelpCircle
}

const lessonTypeLabels = {
  lecture: "Лекция",
  video: "Видео",
  practica: "Практика",
  test: "Тестирование"
}


const TeachingCoursesDetail = () => {
  const { user } = useAuthUser();
  const navigate = useNavigate();
  const { teachingCourseDetail, createModule, getModule, deleteModule, deleteLesson } = useTeacher();
  const { slug } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modulesData, setModulesData] = useState({});
  const [expandedModules, setExpandedModules] = useState({})
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
  
  const fetchModule = async (id, forceRefresh = false) => {
    if (!forceRefresh && modulesData[id]) return;
    
    await getModule(id, {
      setModule: (data) => setModulesData(prev => ({ ...prev, [id]: data }))
    });
  };

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
      setModulesData({})
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
      setModulesData(prev => {
        const newData = { ...prev };
        delete newData[id];
        return newData;
      })
    }
  }

  const handleDeleteLesson = async (lesson_id, module_id) => {
    if (confirm("Удалить этот урок")) {
      await deleteLesson(lesson_id);
      await fetchModule(module_id, true);
    }
  };

  const toggleModule = async (id) => {
    if (!expandedModules[id] && !modulesData[id]) {
      await fetchModule(id);
    }
    setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
      <main className="max-w-7xl mx-auto px-4 py-10">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => navigate(`/teaching/courses/${course.slug}/students`)}
            className="bg-card rounded-2xl border border-border p-4 hover:bg-muted/30 transition flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-foreground">Студенты курса</div>
              <div className="text-xs text-muted-foreground">Всего: {course?.students?.length ?? 0}</div>
            </div>
          </button>

          <button
            onClick={() => navigate(`/teaching/courses/${course.slug}/practica-check`)}
            className="bg-card rounded-2xl border border-border p-4 hover:bg-muted/30 transition flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-foreground">Проверка практик</div>
              <div className="text-xs text-muted-foreground">Отправки и оценивание</div>
            </div>
          </button>
          <button
            onClick={() => navigate(`/teaching/courses/${course.slug}/test-results`)}
            className="bg-card rounded-2xl border border-border p-4 hover:bg-muted/30 transition flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-foreground">Результаты тестов</div>
              <div className="text-xs text-muted-foreground">Попытки и баллы студентов</div>
            </div>
          </button>
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
            <form onSubmit={handleAddModule} className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
              <input 
                type="number"
                name="display_order"
                value={newModule.display_order}
                onChange={handleChangeModule}
                className='w-full sm:flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary' 
                placeholder='Номер модуля'
                autoFocus
               / >
              <input 
                type="text"
                name="name"
                value={newModule.name} 
                onChange={handleChangeModule}
                className='w-full sm:flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary' 
                placeholder='Название модуля'
                autoFocus
               / >
              <input 
                type="text"
                name="slug"
                value={newModule.slug}
                onChange={handleChangeModule}
                className='w-full sm:flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary' 
                placeholder='Slug модуля'
                autoFocus
               / >
              <input 
                type="text"
                name="description"
                value={newModule.description} 
                onChange={handleChangeModule}
                className='w-full sm:flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary' 
                placeholder='Краткое описание модуля'
                autoFocus
               / >
              <button 
                type="submit"
                className='flex-1 sm:flex-none bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors'  
              >
                Добавить
              </button>
              <button 
                type="button" 
                onClick={() => {setShowAddModule(false)}}
                className='flex-1 sm:flex-none px-4 py-2 text-muted-foreground hover:text-foreground transition-colors'
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
            {course.modules?.map((module) => {
              const moduleDetails = modulesData[module.id];
              
              return (
              <div key={module.id} className='bg-card rounded-xl border border-border '>
                <div
                   className='flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors'
                   onClick={() => toggleModule(module.id)} 
                >
                  <GripVertical className='w-5 h-5 text-muted-foreground' / >
                  <div className='w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium'>
                    {module.display_order}
                  </div>
                  <span className='flex-1 font-medium'>{module.name}</span>
                  <span className='text-sm text-muted-foreground'>
                    {moduleDetails?.lessons?.length ?? module.lessons_count ?? 0} уроков
                  </span>
                  <div className='relative' onClick={(e) => e.stopPropagation()}>{}
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
                            onClick={() => navigate(`/teaching/courses/${course.slug}/modules/${module.slug}/edit`)}
                            className='flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors w-full text-left'
                          >
                            <Edit2 className='w-4 h-4 text-muted-foreground' /> Редактировать
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id); setMenuOpen(null)}}
                            className='flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors w-full text-left text-destructive'
                          >
                            <Trash2 className='w-4 h-4' /> Удалить
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  {expandedModules[module.id] ? (
                    <ChevronUp className='w-5 h-5 text-muted-foreground' />
                  ) : (
                    <ChevronDown className='w-5 h-5 text-muted-foreground' />
                  )}
                </div>
                
                {expandedModules[module.id] && (
                    <div className='border-t border-border'>
                      {!moduleDetails ? (
                        <div className='p-4 text-center text-muted-foreground text-sm'>
                          Загрузка уроков...
                        </div>
                      ) : moduleDetails.lessons?.length === 0 ? (
                        <div className='p-4 text-center text-muted-foreground text-sm'>
                          Нет уроков в этом модуле
                        </div>
                      ) : (
                      <div className='divide-y divide-border'>
                        {moduleDetails.lessons?.map((lesson) => {
                          const LessonIcon = lessonTypeIcons[lesson.lesson_type] || FileText
                          return(
                            <div key={lesson.display_order} className='flex items-center gap-3 p-4 pl-16 hover:bg-muted/30 transition-colors'>
                              <div className='w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center'>
                                <LessonIcon className="w-4 h-4 text-accent" />
                              </div>
                              <div className='flex-1'>
                                <div className='font-medium text-sm'>{lesson.name}</div>
                                <div className='text-xs text-muted-foreground'>{lessonTypeLabels[lesson.lesson_type]}</div>
                              </div>
                              <button title="Редактировать"
                                    onClick={() => navigate(`/teaching/courses/${course.slug}/modules/${module.slug}/lessons/${lesson.slug}/edit`)}
                                    className='p-2 hover:bg-muted rounded transition-colors'>
                                    <Edit className='w-4 h-4 text-muted-foreground'  />  
                              </button>
                              <button title="Удаление"
                                      onClick={() => handleDeleteLesson(lesson.id, module.id)}
                                      className='p-2 hover:bg-muted rounded transition-colors text-destructive'
                              >
                                <Trash2 className='w-4 h-4' />
                              </button>
                            </div>
                        )})}
                      </div>
                    )
                    }
                      <div onClick={() => {navigate(`/teaching/courses/${course.slug}/modules/${module.slug}/lessons/new`);}}
                           className='flex items-center justify-center gap-3 p-4 border-t hover:bg-muted/30 transition-colors cursor-pointer' >
                        <span className='flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors'>
                          <Plus className='w-4 h-4' />
                          Добавить урок
                        </span>
                      </div>
                  </div>
                )}
              </div>
              );
            })} 
          </div>
        )}
      </main>
    </div>
  );
};

export default TeachingCoursesDetail;
