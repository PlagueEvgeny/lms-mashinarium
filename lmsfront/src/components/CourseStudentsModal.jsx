import { useState, useEffect, useCallback } from 'react';
import { X, Search, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';

const CourseStudentsModal = ({ course, onClose }) => {
  const { fetchListUser, addStudentToCourse, removeStudentFromCourse } = useAdmin();

  const [allUsers, setAllUsers]   = useState([]);
  const [search, setSearch]       = useState('');
  const [loadingId, setLoadingId] = useState(null); // user_id который сейчас обрабатывается

  // Множество id текущих студентов курса
  const enrolledIds = new Set((course.students || []).map(s => s.user_id));

  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchListUser();
      setAllUsers(data);
    } catch (e) {
      console.error(e);
    }
  }, [fetchListUser]);

  useEffect(() => { loadUsers(); }, []);

  const filtered = allUsers.filter(u => {
    const q = search.toLowerCase();
    return (
      u.last_name?.toLowerCase().includes(q) ||
      u.first_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const handleAdd = async (user_id) => {
    setLoadingId(user_id);
    try {
      await addStudentToCourse(course.id, [user_id]);
      // Обновляем локальный список студентов курса
      const u = allUsers.find(u => u.user_id === user_id);
      if (u) course.students = [...(course.students || []), u];
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemove = async (user_id) => {
    setLoadingId(user_id);
    try {
      await removeStudentFromCourse(course.id, [user_id]);
      course.students = (course.students || []).filter(s => s.user_id !== user_id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Управление студентами</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{course.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-border shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск по имени или email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>
        </div>

        {/* Счётчик */}
        <div className="px-6 py-2 shrink-0">
          <p className="text-xs text-muted-foreground">
            Студентов на курсе: <span className="font-medium text-foreground">{course.students?.length || 0}</span>
          </p>
        </div>

        {/* Список */}
        <div className="overflow-y-auto flex-1 px-6 pb-4 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Пользователи не найдены</p>
          ) : filtered.map(u => {
            const isEnrolled = enrolledIds.has(u.user_id);
            const isLoading  = loadingId === u.user_id;
            return (
              <div
                key={u.user_id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                  isEnrolled ? 'border-primary/30 bg-primary/5' : 'border-border'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {u.last_name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {u.last_name} {u.first_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>

                {isEnrolled ? (
                  <button
                    onClick={() => handleRemove(u.user_id)}
                    disabled={isLoading}
                    title="Удалить из курса"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-red-500 border border-red-500/20 hover:bg-red-500/10 transition disabled:opacity-50"
                  >
                    {isLoading
                      ? <Loader2 size={12} className="animate-spin" />
                      : <UserMinus size={12} />
                    }
                    Удалить
                  </button>
                ) : (
                  <button
                    onClick={() => handleAdd(u.user_id)}
                    disabled={isLoading}
                    title="Добавить на курс"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-primary border border-primary/20 hover:bg-primary/10 transition disabled:opacity-50"
                  >
                    {isLoading
                      ? <Loader2 size={12} className="animate-spin" />
                      : <UserPlus size={12} />
                    }
                    Добавить
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CourseStudentsModal;
