import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import MainLayout from '../components/MainLayout';

  // Функция для получения корректного URL аватара
const getAvatarUrl = (avatarPath) => {
  // Если путь уже содержит полный URL, возвращаем как есть
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  // Если это относительный путь, добавляем базовый URL
  return `http://127.0.0.1:5000${avatarPath}`;
};

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const API_URL = 'http://127.0.0.1:5000/auth/users/me/';

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) {
      toast.error('Вы не авторизованы');
      return;
    }

    fetch(API_URL, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Ошибка авторизации');
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => toast.error('Не удалось загрузить данные пользователя'));
  }, []);

  if (!user) return <div>Загрузка профиля...</div>;

  return (
<MainLayout>
  <div className="profile-page min-h-screen flex flex-col items-center py-10 space-y-[30px]">
    <div className="w-full max-w-3xl p-6 bg-white rounded-[20px] shadow-sm">
      <div className="flex items-center gap-4 p-4 bg-white">
        <img
          src={getAvatarUrl(user?.avatar)}
          alt="Аватар"
          className="w-28 h-28 rounded-full"
        />
        <div>
          <h3 className="text-xl font-bold">{user.last_name} {user.first_name}</h3>
          <p className="text-gray-500">{user.email}</p>
        </div>
      </div>
    </div>


    <div className="w-full max-w-3xl p-6 bg-white rounded-[20px] shadow-sm">
      <h4 className="text-xl font-semibold mb-2">Личная информация</h4>
      <p></p>
    </div>

    <div className="w-full max-w-3xl p-6 bg-white rounded-[20px] shadow-sm">
      <h4 className="text-xl font-semibold mb-2">Удаление профиля</h4>
      <p></p>
    </div>
  </div>
</MainLayout>



  );
};

export default ProfilePage;
