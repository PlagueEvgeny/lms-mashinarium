import { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import toast, { Toaster } from 'react-hot-toast';
import { BookOpen, Users, Search, Trash2, RefreshCw, GraduationCap, Badge } from 'lucide-react';
import CourseStudentsModal from '../../components/CourseStudentsModal';
import CourseTeachersModal from '../../components/CourseTeachersModal';
import { useAdmin } from '../../hooks/useAdmin';
import Sidebar from '../../components/Sidebar';

const STATUS_MAP = {
  PUBLISHED: { cls: 'bg-green-500/10 text-green-600 dark:text-green-400', label: 'Опубликован' },
  DRAFT:     { cls: 'bg-yellow-500/10 text-yellow-600',                   label: 'Черновик'    },
  ARCHIVED:  { cls: 'bg-muted text-muted-foreground',                     label: 'Архив'       },
  TRASH:     { cls: 'bg-red-500/10 text-red-500',                         label: 'Корзина'     },
  INACTIVE:  { cls: 'bg-muted text-muted-foreground',                     label: 'Удален'      },
};

const StatusBadge = ({ status }) => {
  // [~] status приходит как массив — берём первый элемент
  const key = Array.isArray(status) ? status[0] : status;
  const { cls, label } = STATUS_MAP[key] || { cls: '', label: key };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
};

const CourseAdminPage = () => {
  const { fetchListCourse, deleteCourse, restoreCourse } = useAdmin();
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courses, setCourses]         = useState([]);
  const [managingCourse, setManagingCourse] = useState(null);
  const [managingTeachersCourse, setManagingTeachersCourse] = useState(null);

  const loadCourses = useCallback(async () => {
    try {
      const data = await fetchListCourse();
      setCourses(data);
    } catch (e) {
      console.error(e);
    }
  }, [fetchListCourse]);

  useEffect(() => { loadCourses(); }, []);

  const getActualStatus = (course) => {
    if (!course.is_active) return 'INACTIVE';
    return Array.isArray(course.status) ? course.status[0] : course.status;
  };

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return courses.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(query);
      const actualStatus = getActualStatus(c);
      const matchStatus = statusFilter === 'all' || actualStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [courses, search, statusFilter]);

  const handleDeleteCourse = async (course_id) => {
    if (confirm("Деактивировать этот курс")) {
      await deleteCourse(course_id);
      await loadCourses();
    }
  };

  const handleRestoreCourse = async (course_id) => {
    if (confirm("Активировать этот курс")) {
      await restoreCourse(course_id);
      await loadCourses();
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Helmet>
        <title>Управление курсами системы</title>
      </Helmet>
      <Sidebar />
      <Toaster position="top-center" />
      <main className="md:ml-64 flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Курсы</h1>
            <p className="text-muted-foreground mt-1">Управление курсами платформы</p>
          </div>

          {/* Фильтры */}
          <div className="bg-card rounded-xl border shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Поиск по названию"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              >
                <option value="all">Все статусы</option>
                <option value="PUBLISHED">Опубликованные</option>
                <option value="DRAFT">Черновики</option>
                <option value="ARCHIVED">Архив</option>
                <option value="TRASH">Корзина</option>
                <option value="INACTIVE">Удален</option>
              </select>
            </div>
          </div>

          {/* Карточки */}
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Курсы не найдены</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((c) => (
                <div key={c.id} className="bg-card rounded-2xl border border-border p-5 hover:border-primary/30 transition">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    {/* Картинка */}
                    {c.image && (
                      <img
                        src={c.image}
                        alt={c.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.short_description}</p>
                    </div>
                    <StatusBadge status={c.is_active ? c.status : 'INACTIVE'} />
                  </div>

                  <div className="flex flex-col gap-3 text-xs sm:flex-row sm:items-center">

                    {/* ACTIONS */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setManagingTeachersCourse(c)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border 
                                   text-xs font-medium hover:bg-muted/40 transition"
                      >
                        <GraduationCap size={12} />
                        <span>Преподаватели</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-muted text-[10px]">
                          {c.teachers?.length}
                        </span>
                      </button>

                      <button
                        onClick={() => setManagingCourse(c)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border 
                                   text-xs font-medium hover:bg-muted/40 transition"
                      >
                        <Users size={12} />
                        <span>Студенты</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-muted text-[10px]">
                          {c.students?.length}
                        </span>
                      </button>
                    </div>

                    {/* META + PRICE */}
                    <div className="flex items-center justify-between sm:ml-auto w-full sm:w-auto">
                      
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <BookOpen size={12} />
                        {c.modules?.length || 0}
                      </span>

                      {c.price !== undefined && (
                        <span className="ml-3 px-3 py-1 rounded-lg bg-primary/10 text-primary font-semibold">
                          {parseFloat(c.price) === 0
                            ? 'Бесплатно'
                            : `${parseFloat(c.price).toLocaleString('ru-RU')} ₽`}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Преподаватели */}
                  {c.teachers?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2 truncate">
                      Преподаватель: {c.teachers.map(t => `${t.last_name} ${t.first_name}`).join(', ')}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                    <button className="flex-1 py-1.5 rounded-xl border border-border text-xs font-medium text-foreground hover:bg-muted/40 transition">
                      Редактировать
                    </button>
                    {c.is_active ?
                    <button onClick={() => handleDeleteCourse(c.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition">
                      <Trash2 size={14} /> 
                    </button> :
                    <button onClick={() => handleRestoreCourse(c.id)}
                            className="p-1.5 rounded-lg hover:bg-primary-500/10 text-muted-foreground hover:text-primary-500 transition">
                      <RefreshCw size={14} />
                    </button>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 text-xs text-muted-foreground">
            Показано {filtered.length} из {courses.length}
          </div>
        </div>
      </main>
      {managingCourse && (
        <CourseStudentsModal
          course={managingCourse}
          onClose={() => setManagingCourse(null)}
        />
      )}
      {managingTeachersCourse && (
        <CourseTeachersModal
          course={managingTeachersCourse}
          onClose={() => setManagingTeachersCourse(null)}
        />
      )}
    </div>
  );
};

export default CourseAdminPage;
