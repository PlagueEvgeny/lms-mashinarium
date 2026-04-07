import { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import toast, { Toaster } from 'react-hot-toast';
import { RefreshCw, Search, Eye, Trash2, X, Shield } from 'lucide-react';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useAdmin } from '../../hooks/useAdmin';
import Sidebar from '../../components/Sidebar';
import { PORTAL_ROLES } from '../../utility/roles';

const ROLE_OPTIONS = [
  { value: 'all',                  label: 'Все роли' },
  { value: PORTAL_ROLES.user,      label: 'Студенты' },
  { value: PORTAL_ROLES.teacher,   label: 'Преподаватели' },
  { value: PORTAL_ROLES.moderator, label: 'Модераторы' },
  { value: PORTAL_ROLES.admin,     label: 'Администраторы' },
];

const ROLE_STYLE = {
  [PORTAL_ROLES.user]:      'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  [PORTAL_ROLES.teacher]:   'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  [PORTAL_ROLES.moderator]: 'bg-orange-500/10 text-orange-600',
  [PORTAL_ROLES.admin]:     'bg-primary/10 text-primary',
};

const ROLE_LABEL = {
  [PORTAL_ROLES.user]:      'Студент',
  [PORTAL_ROLES.teacher]:   'Преподаватель',
  [PORTAL_ROLES.moderator]: 'Модератор',
  [PORTAL_ROLES.admin]:     'Админ',
};

const SELECT_STYLE = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundPosition: 'right 0.75rem center',
  backgroundSize: '1rem',
};

const getTopRole = (roles) => {
  const priority = [PORTAL_ROLES.admin, PORTAL_ROLES.moderator, PORTAL_ROLES.teacher, PORTAL_ROLES.user];
  return priority.find(r => Array.isArray(roles) && roles.includes(r)) || roles?.[0];
};

const RoleBadge = ({ roles }) => {
  const role = getTopRole(roles);
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_STYLE[role] || ''}`}>
      {ROLE_LABEL[role] || role}
    </span>
  );
};

const FormattedDate = ({ rawDate }) =>
  rawDate ? new Date(rawDate).toLocaleDateString('ru-RU') : '—';

// ─── Модалка просмотра профиля ────────────────────────────────────────────────
const UserProfileModal = ({ user, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Профиль пользователя</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition">
          <X size={16} />
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary shrink-0 overflow-hidden">
            {user.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              : user.first_name?.[0] || '?'
            }
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              {user.last_name} {user.first_name} {user.patronymic}
            </p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-1"><RoleBadge roles={user.roles} /></div>
          </div>
        </div>
        <div className="space-y-0 text-sm">
          {[
            { label: 'Telegram',         value: user.telegram ? `@${user.telegram}` : '—' },
            { label: 'Дата рождения',    value: user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString('ru-RU') : '—' },
            { label: 'Купленных курсов', value: user.student_courses?.length ?? 0 },
            { label: 'Преподаёт курсов', value: user.teacher_courses?.length ?? 0 },
            { label: 'Статус',           value: user.is_active ? 'Активен' : 'Заблокирован' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>
        {user.about && (
          <div className="bg-muted/40 rounded-xl p-3 text-sm text-foreground">{user.about}</div>
        )}
      </div>
    </div>
  </div>
);

// ─── Модалка назначения роли ──────────────────────────────────────────────────
const ROLE_LIST = [
  { value: PORTAL_ROLES.user,      label: 'Студент',       desc: 'Базовый доступ, покупка курсов' },
  { value: PORTAL_ROLES.teacher,   label: 'Преподаватель', desc: 'Создание и управление курсами' },
  { value: PORTAL_ROLES.moderator, label: 'Модератор',     desc: 'Модерация контента и пользователей' },
  { value: PORTAL_ROLES.admin,     label: 'Администратор', desc: 'Полный доступ к системе' },
];

const RoleModal = ({ user, onClose, onSave }) => {
  const topRole         = getTopRole(user.roles);
  const [selected, setSelected] = useState(topRole || PORTAL_ROLES.user);
  const [loading, setLoading]   = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(user.user_id, selected);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Назначить роль</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{user.last_name} {user.first_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {ROLE_LIST.map(({ value, label, desc }) => (
            <button
              key={value}
              onClick={() => setSelected(value)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                selected === value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                selected === value ? 'bg-primary/10' : 'bg-muted'
              }`}>
                <Shield size={14} className={selected === value ? 'text-primary' : 'text-muted-foreground'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              {selected === value && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
            </button>
          ))}
        </div>

        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-muted/40 transition"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={loading || selected === topRole}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const UserAdminPage = () => {
  const { user }                                       = useAuthUser();
  const { fetchListUser, deleteUser, restoreUser, setUserRole } = useAdmin();

  const [search, setSearch]           = useState('');
  const [roleFilter, setRoleFilter]   = useState('all');
  const [users, setUsers]             = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [roleUser, setRoleUser]       = useState(null);

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
      const matchSearch =
        u.last_name?.toLowerCase().includes(query) ||
        u.first_name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query);
      const matchRole = roleFilter === 'all' || (Array.isArray(u.roles) && u.roles.includes(roleFilter));
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter, user?.user_id]);

  const handleDeleteUser  = async (user_id) => {
    if (!confirm('Деактивировать этого пользователя?')) return;
    await deleteUser(user_id);
    await loadUsers();
  };

  const handleRestoreUser = async (user_id) => {
    if (!confirm('Активировать этого пользователя?')) return;
    await restoreUser(user_id);
    await loadUsers();
  };

  const handleSetRole = async (user_id, role) => {
    await setUserRole(user_id, [role]);
    await loadUsers();
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Helmet><title>Управление пользователями системы</title></Helmet>
      <Sidebar />
      <Toaster position="top-center" />

      {profileUser && <UserProfileModal user={profileUser} onClose={() => setProfileUser(null)} />}
      {roleUser    && <RoleModal user={roleUser} onClose={() => setRoleUser(null)} onSave={handleSetRole} />}

      <main className="md:ml-64 flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Пользователи</h1>
            <p className="text-muted-foreground mt-1">Управление пользователями системы</p>
          </div>

          <div className="bg-card rounded-xl border shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
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

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Пользователь</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Роль</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Купленные курсы</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Преподаваемые курсы</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Статус</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Дата рождения</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted-foreground">
                        Пользователи не найдены
                      </td>
                    </tr>
                  ) : filtered.map((u) => (
                    <tr key={u.user_id} className="border-b border-border last:border-0 hover:bg-muted/20 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 overflow-hidden">
                            {u.avatar
                              ? <img src={u.avatar} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                              : u.first_name?.[0] || '?'
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{u.last_name} {u.first_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center px-5 py-3.5"><RoleBadge roles={u.roles} /></td>
                      <td className="text-center px-5 py-3.5 text-sm text-foreground">{u.student_courses?.length || 0}</td>
                      <td className="text-center px-5 py-3.5 text-sm text-foreground">{u.teacher_courses?.length || 0}</td>
                      <td className="text-center px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          u.is_active
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {u.is_active ? 'Активен' : 'Заблокирован'}
                        </span>
                      </td>
                      <td className="text-center px-5 py-3.5 text-xs text-muted-foreground">
                        <FormattedDate rawDate={u.date_of_birth} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setProfileUser(u)}
                            title="Просмотр профиля"
                            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => setRoleUser(u)}
                            title="Назначить роль"
                            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition"
                          >
                            <Shield size={14} />
                          </button>
                          {u.is_active ? (
                            <button
                              onClick={() => handleDeleteUser(u.user_id)}
                              title="Деактивировать"
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestoreUser(u.user_id)}
                              title="Восстановить"
                              className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition"
                            >
                              <RefreshCw size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground">
              Показано {filtered.length} из {Math.max(0, users.length - 1)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserAdminPage;
