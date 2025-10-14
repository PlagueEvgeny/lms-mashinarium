import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../components/MainLayout';
import defaultAvatar from '../images/default-avatar.jpg';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = 'http://127.0.0.1:5000/';

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) {
      toast.error('Вы не авторизованы');
      setLoading(false);
      navigate('/login');
      return;
    }

    fetch(`${API_URL}/auth/users/me/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Ошибка авторизации');
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error:', error);
        toast.error('Не удалось загрузить данные пользователя');
        setLoading(false);
        navigate('/login');
      });
  }, [navigate]);

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return defaultAvatar;
    if (avatarPath.startsWith('http')) return avatarPath;
    return API_URL + `${avatarPath}`;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Загрузка...</div>
        </div>
      </MainLayout>
    );
  }

  if (!user) return null;

  return (
    <MainLayout>
      <div className="min-h-screen flex flex-col items-center py-10 space-y-8">
        {/* Навигационная панель */}
        <div className="w-full max-w-6xl border-b border-gray-300 flex justify-start space-x-8 pb-2 px-2">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-2 text-lg font-semibold transition ${
              activeTab === 'info'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-green-500'
            }`}
          >
            Личная информация
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`pb-2 text-lg font-semibold transition ${
              activeTab === 'auth'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-green-500'
            }`}
          >
            Данные авторизации
          </button>
        </div>

        {/* Вкладка: личная информация */}
        {activeTab === 'info' && (
          <form className="w-full max-w-6xl flex flex-col space-y-8">
            <div className="p-6 bg-white rounded-[20px] shadow-sm flex items-center gap-6">
              <img
                src={getAvatarUrl(user?.avatar)}
                alt="Аватар"
                className="w-28 h-28 rounded-full object-cover"
                onError={(e) => {
                  e.target.src = defaultAvatar;
                }}
              />
              <div>
                <h3 className="text-xl font-bold">
                  {user.last_name} {user.first_name}
                </h3>
                <p className="text-gray-500">{user.email}</p>
              </div>
            </div>

            <div className="p-8 bg-white rounded-[20px] shadow-sm">
              <h4 className="text-xl font-semibold mb-6">Личная информация</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Поля профиля */}
                <InputField label="Фамилия" value={user.last_name} />
                <InputField label="Имя" value={user.first_name} />
                <InputField label="Отчество" value={user.patronymic} />
                <InputField label="Дата рождения" value={user.date_birth} />
                <InputField label="Номер телефона" value={user.phone_number} />
                <SelectField label="Пол" value={user.gender} />
                <InputField label="Telegram" value={user.telegram} />
                <SelectField label="Роль" value={user.role}  />
                <InputField label="Почта" value={user.email}  />
              </div>
              <button className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition">
                Сохранить
              </button>
            </div>
          </form>
        )}

        {/* Вкладка: данные авторизации */}
        {activeTab === 'auth' && (
          <div className="w-full max-w-6xl flex flex-col space-y-8">
            <div className="p-8 bg-white rounded-[20px] shadow-sm">
              <h4 className="text-xl font-semibold mb-6">Смена пароля</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <InputField label="Текущий пароль" type="password" />
                <InputField label="Новый пароль" type="password" />
                <InputField label="Повторите пароль" type="password" />
              </div>
              <button className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition">
                Сменить пароль
              </button>
            </div>
              <div className="p-6 bg-white rounded-[20px] shadow-sm">
                <h4 className="text-xl font-semibold mb-3">Почта</h4>
                <p className="text-gray-500">{user.email}</p>
                <p className="mb-6 text-xm">
                  Для смены почты, пожалуйста, обратитесь в поддержку
                </p>
                <hr className="mb-4 mt-4" />
                <h4 className="text-xl font-semibold mb-6">Удаление профиля</h4>
                <p className="text-gray-700 mb-6">
                  После запроса на удаление ваш профиль и персональные данные будут полностью удалены через 30 дней.
                  В течение этого времени вы можете написать в поддержку для отмены удаления.
                </p>
                <button className="bg-red-500 text-white px-8 py-3 rounded-lg hover:bg-red-600 transition">
                  Удалить профиль
                </button>
              </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

/* Подкомпоненты для полей */
const InputField = ({ label, value, type = 'text' }) => (
  <div className="relative">
    <input
      type={type}
      defaultValue={value || ''}
      placeholder=" "
      className="peer w-full border border-gray-300 rounded-lg p-3 pt-5 focus:outline-none focus:ring-2 focus:ring-green-500"
    />
    <label
      className="absolute left-3 top-1 text-gray-500 text-xs transition-all 
        peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 
        peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs 
        peer-focus:text-green-600"
    >
      {label}
    </label>
  </div>
);

const SelectField = ({ label, value }) => (
  <div className="relative">
    <select
      defaultValue={value || ''}
      className="peer w-full bg-white border border-gray-300 rounded-lg p-3 pt-5 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500"
    >
      <option value="Мужской">Мужской</option>
      <option value="Женский">Женский</option>
    </select>
    <label
      className="absolute left-3 top-1 text-xs text-gray-500 bg-white px-1 peer-focus:text-green-600"
    >
      {label}
    </label>
  </div>
);

export default ProfilePage;
