import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import logo from '../images/logo.jpg';
import defaultAvatar from '../images/default-avatar.jpg';

const Header = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const menuRef = useRef(null);

  const API_URL = 'http://127.0.0.1:5000/';

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

  // Загрузка данных пользователя
  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) return;

    fetch(API_URL + "auth/users/me/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch((err) => console.error('Ошибка при загрузке профиля:', err));
  }, []);

  // Функция для получения корректного URL аватара
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return defaultAvatar;
    if (avatarPath.startsWith('http')) return avatarPath;
    return API_URL + avatarPath;
  };

  return (
    <header className="w-full bg-white border-b-4 shadow-sm sticky top-0 z-50">
      <div className="flex justify-center w-full">
        <div
          className="
            max-w-6xl
            w-full 
            px-6 
            h-[65px]
            flex 
            flex-row 
            justify-between 
            items-center
          "
        >
          {/* === Левая часть === */}
          <div className="flex flex-row items-center gap-4">
            <img
              src={logo}
              alt="Mashinarium IT-School"
              className="w-10 h-10 rounded-full object-cover cursor-pointer"
              onClick={() => navigate('/')}
            />

            <div className="flex flex-col cursor-pointer" onClick={() => navigate('/')}>
              <span className="text-green-700 font-semibold leading-none">
                МАШИНАРИУМ
              </span>
              <span className="text-xs text-gray-600 leading-none">IT-SCHOOL</span>
            </div>

            <button
              onClick={() => navigate('/')}
              className="ml-6 text-gray-700 hover:text-green-600 transition font-medium"
            >
              Каталог курсов
            </button>
          </div>

          {/* === Правая часть === */}
          <div className="flex flex-row items-center gap-4 relative" ref={menuRef}>
            {/* Если пользователь авторизован */}
            {user ? (
              <>
                {/* Иконка сообщений */}
                <button
                  title="Сообщения"
                  onClick={() => navigate('/messages')}
                  className="text-gray-600 hover:text-blue-600 transition"
                >
                  <MessageCircle size={22} />
                </button>

                {/* Аватар и меню */}
                <div className="relative">
                  <img
                    src={getAvatarUrl(user?.avatar)}
                    alt="User Avatar"
                    className="w-9 h-9 rounded-full object-cover border border-gray-300 cursor-pointer hover:scale-105 transition"
                    onClick={() => setMenuOpen((prev) => !prev)}
                  />

                  {menuOpen && (
                    <div className="absolute right-0 mt-3 w-52 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                      <div className="px-4 py-3 border-b">
                        <p className="text-sm font-semibold text-gray-800">
                          {user ? `${user.first_name} ${user.last_name}` : 'Загрузка...'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user?.role === 't'
                            ? 'Преподаватель'
                            : user?.role === 's'
                            ? 'Ученик'
                            : ''}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          navigate('/profile');
                          setMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        Профиль
                      </button>
                      <button
                        onClick={() => {
                          navigate('/settings');
                          setMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        Настройки
                      </button>
                      <button
                        onClick={async () => {
                          const refresh = localStorage.getItem('refresh');
                          if (refresh) {
                            try {
                              await fetch(API_URL + 'auth/api/logout/', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${localStorage.getItem('access')}`,
                                },
                                body: JSON.stringify({ refresh }),
                              });
                            } catch (err) {
                              console.error('Ошибка при выходе:', err);
                            }
                          }

                          localStorage.removeItem('access');
                          localStorage.removeItem('refresh');
                          setMenuOpen(false);
                          setUser(null);
                          navigate('/login');
                        }}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                      >
                        Выйти
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-green-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-600 transition-all"
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