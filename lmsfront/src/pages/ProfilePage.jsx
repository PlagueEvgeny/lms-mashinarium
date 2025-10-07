import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import MainLayout from '../components/MainLayout';


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
      <div className="profile-page">
        <h2>Профиль пользователя</h2>
        <div className="profile-card">
          <img
            src={`http://127.0.0.1:5000/media/${user.avatar}`}
            alt="Аватар"
            style={{ width: '120px', borderRadius: '50%' }}
          />
          <h3>{user.last_name} {user.first_name}</h3>
          <p>Роль: {user.role === 't' ? 'Преподаватель' : 'Ученик'}</p>
          <p>Email: {user.email}</p>
          <p>Телефон: {user.phone_number}</p>
          <p>Баланс: {user.balance} ₽</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
