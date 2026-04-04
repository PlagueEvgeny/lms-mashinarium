import { useState, useEffect, useCallback, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { BookOpen, Users, Clock, AlertCircle, RefreshCw, Search, Eye, Edit3, Trash2 } from 'lucide-react';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useAdmin } from '../../hooks/useAdmin';
import Sidebar from '../../components/Sidebar';

const RoleBadge = ({ role }) => {
  const map = {
    ROLE_PORTAL_USER: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    ROLE_PORTAL_TEACHER: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    ROLE_PORTAL_MODERATOR:   'bg-primary/10 text-primary',
    ROLE_PORTAL_ADMIN:   'bg-primary/10 text-primary',
  };
  const labels = { ROLE_PORTAL_USER: 'Студент', ROLE_PORTAL_TEACHER: 'Преподаватель', ROLE_PORTAL_MODERATOR: "Модератор", ROLE_PORTAL_ADMIN: 'Админ' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[role] || ''}`}>
      {labels[role] || role}
    </span>
  );
};

const FormattedDate = ({ rawDate }) => {
  const formattedDate = new Date(rawDate).toLocaleDateString('ru-RU');
  
  return formattedDate
}

const UserAdminPage = () => {
  const { user } = useAuthUser();
  const { fetchListUser, fetchListCourse, fetchLogs } = useAdmin();
  const [ search, setSearch ] = useState('');
  const [ users, setUsers ] = useState([]);
  
  const filtered = useMemo(() => users.filter(u => {
    const matchSearch = u.last_name.toLowerCase().includes(search.toLowerCase()) ||
                        u.first_name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  }), [search]);
  
  useEffect(() => { fetchListUser().then(setUsers).catch(console.error); }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <Toaster position="top-center" />
      <main className="md:ml-64 flex-1 overflow-auto">
        <div className='p-8'>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className='text-3xl font-bold text-foreground'>Пользователи</h1>
              <p className='text-muted-foreground mt-1'>Управление пользователями системы</p>
            </div>
          </div>
          <div className='bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm mb-6'>
            <div className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" 
                         name="search"
                         placeholder="Поиск по имени или email..."
                         value={search}
                         onChange={e => setSearch(e.target.value)}
                         className="w-full pl-9 pr-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>
                <select
                      className="px-4 py-2.5 pr-10 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition appearance-none bg-no-repeat"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1rem',
                      }}
                  >
                  <option value="all">Все роли</option>
                  <option value="ROLE_PORTAL_USER">Студенты</option>
                  <option value="ROLE_PORTAL_TEACHER">Преподаватели</option>
                  <option value="ROLE_PORTAL_MODERATOR">Модераторы</option>
                  <option value="ROLE_PORTAL_ADMIN">Администраторы</option>
                </select>              
             </div> 
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className='w-full'>
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Пользователи</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Роль</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Купленные курсы</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Преподаваемые курсы</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Статус</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Дата рождения</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user_filter, index) => (
                    <tr key={user_filter.user_id} className="border-b border-border last:border-0 hover:bg-muted/20 transition ">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                             {user_filter.last_name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{user_filter.last_name} {user_filter.first_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user_filter.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center px-5 py-3.5"><RoleBadge role={user_filter.roles} /> </td>
                      <td className="text-center px-5 py-3.5">{user_filter.student_courses?.length || 0}</td>
                      <td className="text-center px-5 py-3.5">{user_filter.teacher_courses?.length || 0}</td>
                      <td className="text-center text-xs px-2 py-0.5 rounded-full font-medium">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          user_filter.is_active 
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {user_filter.is_active ? 'Активен' : 'Заблокирован'}
                        </span>
                      </td>                      
                      <td className="text-center px-5 py-3.5 text-xs text-muted-foreground"><FormattedDate rawDate={user_filter.date_of_birth} /> </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          <button className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition">
                            <Eye size={14} />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition">
                            <Edit3 size={14} />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition">
                            <Trash2 size={14} />
                          </button>                        
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserAdminPage;
