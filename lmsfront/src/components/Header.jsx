import { useState, useCallback } from 'react';
import { MessageCircle, BookOpen, GraduationCap, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { useAuthUser } from '../hooks/useAuthUser';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo-gor.png';
import avatar from '../assets/default-avatar.jpg';
import { PORTAL_ROLES, roleHelpers, RoleGuard, useRole } from '../utility/roles'; 

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const userRole = user?.roles || PORTAL_ROLES.user;
  const role = useRole(userRole);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);
  
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt="Mashinarium IT-School"
            className="h-10 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate('/')}
          />

          <button
            onClick={() => navigate('/')}
            className="ml-6 text-gray-700 hover:text-green-600 transition-colors font-medium"
          >
            Каталог курсов
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
                title="Сообщения"
                onClick={() => navigate('/messages')}
                className="p-2 hover:bg-muted rounded-lg transition-colors">
            <MessageCircle className="w-5 h-5 text-muted-foregraund" />
          </button>
          <div className="relative">
             <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="{avatar}" className='w-full h-full object-cover' />
                  ) : (
                    <img src={avatar} alt="avatar" className='w-full h-full object-cover' />
                  )}
                </div>
             </button>
             {dropdownOpen && (
               <>
               <div className='fixed inset-0 z-10' onClick={() => setDropdownOpen(false)} / >
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50 py-2" >
                  {(role.isTeacherOrHigher || role.hasMinPriority(PORTAL_ROLES.moderator)) && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center w-full gap-3 p-1 px-4 text-sm hover:bg-muted transition-colors">
                    <ShieldCheck className="w-4 h-4" /> Панель администратора
                  </button>
                  )}
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center w-full gap-3 p-1 px-4 text-sm hover:bg-muted transition-colors">
                    <BookOpen className="w-4 h-4" /> Мое обучение 
                  </button>
                  {(role.isTeacherOrHigher || role.hasMinPriority(PORTAL_ROLES.teacher)) && (
                  <button
                    onClick={() => navigate('/teaching')}
                    className="flex items-center w-full gap-3 p-1 px-4 text-sm hover:bg-muted transition-colors">
                    <GraduationCap className="w-4 h-4" /> Преподавание
                  </button>
                  )}
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center w-full gap-3 p-1 px-4 text-sm hover:bg-muted transition-colors">
                    <Settings className="w-4 h-4" /> Настойки профиля
                  </button>
                  <hr className='my-2 border-border' />
                   <button
                    onClick={handleLogout}
                    className="flex items-center w-full gap-3 p-1 px-4 text-sm hover:bg-muted transition-colors">
                    <LogOut className="w-4 h-4" /> Выход
                  </button>
               </div>
               </>
             )}
        </div>
      </div>
      </div>
    </header>
  );
};

export default Header;
