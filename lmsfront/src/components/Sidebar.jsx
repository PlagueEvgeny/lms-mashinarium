import { useState, useCallback } from 'react';
import { Users, BookOpen, ChevronLeft, Settings, LogOut, LayoutDashboard, BarChart3 } from 'lucide-react';
import { useAuthUser } from '../hooks/useAuthUser';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';
import avatar from '../assets/default-avatar.jpg';
import { PORTAL_ROLES, roleHelpers, RoleGuard, useRole } from '../utility/roles'; 

const navigation = [
  { name: 'Обзор', href: '/admin', icon: LayoutDashboard },
  { name: 'Пользователи', href: '/admin/users', icon: Users },
  { name: 'Курсы', href: '/admin/courses', icon: BookOpen },
  { name: 'Статистика', href: '/admin/stats', icon: BarChart3 },
  { name: 'Настройки', href: '/admin/settings', icon: Settings },
]

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const userRole = user?.roles || PORTAL_ROLES.user;
  const role = useRole(userRole);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);
  
  return (
    
    <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <a href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <img
                src={logo}
                alt="Mashinarium IT-School"
                className="h-10 w-10 cursor-pointer hover:scale-105 transition-transform"
              />
            </div>
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
              <>
              <li key={item.name}>
                <button
                  onClick={() => navigate(item.href)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted hover:text-foreground transition-colors w-full"
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </button>
              </li>
              </>
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
    );
};

export default Sidebar;
