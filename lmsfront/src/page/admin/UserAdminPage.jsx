import { useState, useEffect, useCallback, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { BookOpen, Users, Clock, AlertCircle, RefreshCw, Search, Eye, Edit3, Trash2 } from 'lucide-react';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useAdmin } from '../../hooks/useAdmin';
import Sidebar from '../../components/Sidebar';
import { PORTAL_ROLES } from '../../utility/roles';

const ROLE_OPTIONS = [
  { value: 'all',                        label: 'Все роли' },
  { value: PORTAL_ROLES.user,            label: 'Студенты' },
  { value: PORTAL_ROLES.teacher,         label: 'Преподаватели' },
  { value: PORTAL_ROLES.moderator,       label: 'Модераторы' },
  { value: PORTAL_ROLES.admin,           label: 'Администраторы' },
];

const ROLE_STYLE = {
  [PORTAL_ROLES.user]:      'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  [PORTAL_ROLES.teacher]:   'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  [PORTAL_ROLES.moderator]: 'bg-primary/10 text-primary',
  [PORTAL_ROLES.admin]:     'bg-primary/10 text-primary',
};

const ROLE_LABEL = {
  [PORTAL_ROLES.user]:      'Студент',
  [PORTAL_ROLES.teacher]:   'Преподаватель',
  [PORTAL_ROLES.moderator]: 'Модератор',
  [PORTAL_ROLES.admin]:     'Админ',
};

const RoleBadge = ({ roles }) => {
  const priority = [PORTAL_ROLES.admin, PORTAL_ROLES.moderator, PORTAL_ROLES.teacher, PORTAL_ROLES.user];
  const role = priority.find(r => Array.isArray(roles) && roles.includes(r)) || roles?.[0];
  return (
  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_STYLE[role] || ''}`}>
    {ROLE_LABEL[role] || role}
  </span>
  );
};

const FormattedDate = ({ rawDate }) => {
  const formattedDate = new Date(rawDate).toLocaleDateString('ru-RU');
  
  return formattedDate
}

const SELECT_STYLE = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundPosition: 'right 0.75rem center',
  backgroundSize: '1rem',
};

const UserAdminPage = () => {
  const { user } = useAuthUser();
  const { fetchListUser, deleteUser, restoreUser, fetchListCourse, fetchLogs } = useAdmin();
  const [ search, setSearch ] = useState('');
  const [ roleFilter, setRoleFilter ] = useState('all')
  const [ users, setUsers ] = useState([]);
  
    const loadUsers = useCallback(async () => {
    try {
      const data = await fetchListUser();
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
  }, [fetchListUser]);
 
  useEffect(() => { loadUsers(); }, []);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return users.filter(u => {
      if (u.user_id === user?.user_id) return false;
      const matchSearch = u.last_name.toLowerCase().includes(query) ||
                          u.first_name.toLowerCase().includes(query)  ||
                          u.email.toLowerCase().includes(query);
      const matchRole = roleFilter === 'all' || (Array.isArray(u.roles) && u.roles.includes(roleFilter));
      return matchSearch && matchRole;
    }); 
  },  [users, search, roleFilter, user?.user_id]);

  const handleDeleteUser = async (user_id) => {
    if (confirm("Деактивировать этого пользователя")) {
      await deleteUser(user_id);
      await loadUsers();
    }
  };

  const handleRestoreUser = async (user_id) => {
    if (confirm("Активировать этого пользователя")) {
      await restoreUser(user_id);
      await loadUsers();
    }
  };

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
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="px-4 py-2.5 pr-10 bg-muted border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition appearance-none bg-no-repeat"
                    style={SELECT_STYLE}
                  >
                    {ROLE_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
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
                  {filtered.map((user_filter) => (
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
                      <td className="text-center px-5 py-3.5"><RoleBadge roles={user_filter.roles} /> </td>
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
                            {user_filter.is_active ?
                            <button onClick={() => handleDeleteUser(user_filter.user_id)}
                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition">
                              <Trash2 size={14} /> 
                            </button> :
                            <button onClick={() => handleRestoreUser(user_filter.user_id)}
                                    className="p-1.5 rounded-lg hover:bg-primary-500/10 text-muted-foreground hover:text-primary-500 transition">
                              <RefreshCw size={14} />
                            </button>
                            }
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
