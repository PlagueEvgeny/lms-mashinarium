import { useState, useEffect } from 'react';
import { API } from '../config/api.js';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const useAuthUser = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = async (token) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(API.user, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          throw new Error('Сессия истекла');
        }
        throw new Error('Ошибка загрузки данных пользователя');
      }

      const userData = await response.json();
      setUser(userData);
      return userData;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access');
    
    if (!token) {
      setLoading(false);
      return;
    }

    fetchUser(token).catch((err) => {
      console.error('Auth error:', err);
      toast.error(err.message);
    });
  }, []);

  const logout = async () => {
    const refresh = localStorage.getItem('refresh');
    
    if (refresh) {
      try {
        await fetch(API.logout, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh }),
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }

    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setUser(null);
    toast.success('Вы успешно вышли из системы');
    navigate('/login');
  };

  return { 
    user, 
    loading, 
    error, 
    setUser,
    refetch: () => {
      const token = localStorage.getItem('access');
      return token ? fetchUser(token) : Promise.reject('No token');
    },
    logout 
  };
};