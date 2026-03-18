import { useState, useEffect, useRef } from 'react';
import { API } from '../services/api.js';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const useAuthUser = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshTimerRef = useRef(null);

  // ─── Обновление access token ───────────────────────────────────────────────
  const refreshAccessToken = async () => {
    const response = await fetch(API.refresh, {
      method: 'POST',
      credentials: 'include', // автоматически отправляет cookie с refresh token
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      clearTokens();
      throw new Error('Сессия истекла, войдите снова');
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Неверный ответ сервера');
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    return data.access_token;
  };

  // ─── Автообновление токена каждые 4 минуты ─────────────────────────────────
  const scheduleRefresh = () => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);

    refreshTimerRef.current = setInterval(async () => {
      try {
        await refreshAccessToken();
      } catch (err) {
        toast.error(err.message);
        navigate('/login');
      }
    }, 4 * 60 * 1000);
  };

  // ─── Загрузка пользователя ─────────────────────────────────────────────────
  const fetchUser = async (token) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API.user, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Токен протух — обновляем через cookie и повторяем
      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        return await fetchUser(newToken);
      }

      if (!response.ok) throw new Error('Ошибка загрузки пользователя');

      const userData = await response.json();
      setUser(userData);
      scheduleRefresh();
      return userData;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ─── Очистка ───────────────────────────────────────────────────────────────
  const clearTokens = () => {
    localStorage.removeItem('access_token');
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    setUser(null);
  };

  // ─── Инициализация ─────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      // access token нет — пробуем обновить через cookie
      refreshAccessToken()
        .then((newToken) => fetchUser(newToken))
        .catch(() => {
          setLoading(false);
          navigate('/login');
        });
      return;
    }

    fetchUser(token).catch((err) => {
      console.error('Auth error:', err);
      toast.error(err.message);
      navigate('/login');
    });

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, []);

  // ─── Выход ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await fetch(API.logout, {
        method: 'POST',
        credentials: 'include', // сервер сам очистит httpOnly cookie
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Logout error:', err);
    }

    clearTokens();
    toast.success('Вы успешно вышли из системы');
    navigate('/login');
  };

const updateUser = async (formData) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(API.user, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });
  if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  throw new Error(errorData.detail || 'Ошибка сохранения');
  }  
  setUser(prev => ({ ...prev, ...formData })); // ← мержим вместо замены
  toast.success('Данные сохранены');
};

const changePassword = async (current_password, new_password) => {
  const token = localStorage.getItem('access_token');
  
  const url = `${API.user_change_password}?current_password=${encodeURIComponent(current_password)}&new_password=${encodeURIComponent(new_password)}`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Ошибка сохранения');
  }
  
  toast.success('Пароль изменен');
};

const deleteUser = async () => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(API.user, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Ошибка удаления');
  clearTokens();
  toast.success('Аккаунт удалён');
  navigate('/login');
};

  return {
    user,
    loading,
    error,
    setUser,
    logout,
    updateUser,
    deleteUser,
    changePassword,
    refetch: () => {
      const token = localStorage.getItem('access_token');
      return token ? fetchUser(token) : Promise.reject('Нет токена');
    },
  };
};
