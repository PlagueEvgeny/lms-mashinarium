import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, NotebookPen, LogOut, User, Brain } from 'lucide-react';
import logo from '../images/logo.jpg';
import { useAuthUser } from '../hooks/useAuthUser';
import { getAvatarUrl } from '../utils/helpers';

const Header = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { user, loading, logout } = useAuthUser();

  // Закрытие меню при клике вне
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Закрытие меню при навигации
  useEffect(() => {
    setMenuOpen(false);
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    setMenuOpen(false);
    await logout();
  }, [logout]);

  const handleNavigation = useCallback((path) => {
    setMenuOpen(false);
    navigate(path);
  }, [navigate]);

  const getRoleText = (role) => {
    const roles = {
      't': 'Преподаватель',
      's': 'Ученик',
      'a': 'Администратор'
    };
    return roles[role] || '';
  };

  if (loading && !user) {
    return (
      <header className="w-full bg-white border-b-4 shadow-sm sticky top-0 z-50">
        <div className="flex justify-center w-full">
          <div className="max-w-6xl w-full px-6 h-[65px] flex flex-row justify-between items-center">
            {/* Скелетон загрузки */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex flex-col gap-1">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="w-24 h-8 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full bg-white border-b-4 border-green-100 shadow-sm sticky top-0 z-50">
      <div className="flex justify-center w-full">
        <div className="max-w-6xl w-full px-6 h-[65px] flex flex-row justify-between items-center">
          {/* Левая часть */}
          <div className="flex flex-row items-center gap-4">
            <img
              src={logo}
              alt="Mashinarium IT-School"
              className="w-10 h-10 rounded-full object-cover cursor-pointer hover:scale-105 transition-transform"
              onClick={() => navigate('/')}
            />

            <div 
              className="flex flex-col cursor-pointer" 
              onClick={() => navigate('/')}
            >
              <span className="text-green-700 font-semibold leading-none">
                МАШИНАРИУМ
              </span>
              <span className="text-xs text-gray-600 leading-none">
                IT-SCHOOL
              </span>
            </div>

            <button
              onClick={() => navigate('/')}
              className="ml-6 text-gray-700 hover:text-green-600 transition-colors font-medium"
            >
              Каталог курсов
            </button>
          </div>

          {/* Правая часть */}
          <div className="flex flex-row items-center gap-4 relative" ref={menuRef}>
            {user ? (
              <>
                {/* Иконка сообщений */}
                <button
                  title="Сообщения"
                  onClick={() => navigate('/messages')}
                  className="text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
                >
                  <MessageCircle size={22} />
                </button>

                {/* Аватар и меню */}
                <div className="relative">
                  <img
                    src={getAvatarUrl(user?.avatar)}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="w-9 h-9 rounded-full object-cover border border-gray-300 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setMenuOpen(prev => !prev)}
                  />

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                      {/* Информация о пользователе */}
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {`${user.first_name} ${user.last_name}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {getRoleText(user?.role)}
                        </p>
                      </div>

                      {/* Пункты меню */}
                      <div className="py-1">
                        <button
                          onClick={() => handleNavigation('/my/course')}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Brain size={16} className="mr-3" />
                          Мое обучение
                        </button>
                        {user?.role === "t" && (
                          <button
                            onClick={() => handleNavigation('/teacher')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <NotebookPen size={16} className="mr-3" />
                            Преподавание
                          </button>
                        )}
                        <button
                          onClick={() => handleNavigation('/my')}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <User size={16} className="mr-3" />
                          Настройки профиля
                        </button>
                        
                        <div className="border-t border-gray-100 my-1" />
                        
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} className="mr-3" />
                          Выйти
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-green-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-600 transition-all shadow-sm hover:shadow-md"
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;