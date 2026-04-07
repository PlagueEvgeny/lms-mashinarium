import { useState, useEffect, useCallback } from 'react';
import { Users, BookOpen, ChevronLeft, Settings, LogOut, LayoutDashboard, BarChart3, Menu } from 'lucide-react';
import { useAuthUser } from '../hooks/useAuthUser';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { PORTAL_ROLES, useRole } from '../utility/roles'; 

const navigation = [
  { id_key: 1, name: 'Обзор', href: '/admin', icon: LayoutDashboard },
  { id_key: 2, name: 'Пользователи', href: '/admin/users', icon: Users },
  { id_key: 3, name: 'Курсы', href: '/admin/courses', icon: BookOpen },
  { id_key: 4, name: 'Журнал событий', href: '/admin/logs', icon: BarChart3 },
  { id_key: 5, name: 'Настройки', href: '/admin/settings', icon: Settings },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthUser();
  const [isOpen, setIsOpen] = useState(false);
  const { fetchSettings } = useAdmin();
  const [settings, setSettings] = useState(null);
  const userRole = user?.roles || PORTAL_ROLES.user;
  const role = useRole(userRole);
  
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchSettings();
        setSettings(data || {}); 
        console.log(data)
      } catch (error) {
        console.error(error);
        setSettings({});
      }
    };

    loadSettings();
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return (
    <>
      {/* 🔘 Burger button (visible on small screens) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border md:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* 🌑 Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 📌 Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 bg-card border-r border-border flex flex-col z-50
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <a href="/admin" className="flex items-center gap-3">
            <img src={settings?.logo_url} alt="logo" className="h-10 w-10" />
            <div>
              <div className="font-bold text-foreground">Админ панель</div>
              <div className="text-xs text-muted-foreground">МАШИНАРИУМ</div>
            </div>
          </a>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.id_key}>
                <button
                  onClick={() => {
                    navigate(item.href);
                    setIsOpen(false); // закрывать на мобиле
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted hover:text-foreground transition-colors w-full"
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
          >
            <ChevronLeft className="w-5 h-5" />
            Назад к платформе
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            Выйти
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
