import { useCallback } from 'react';
import { API } from '../services/api.js';
import toast from 'react-hot-toast';
import { authFetch } from '../services/authFetch';

export const useAdmin = () => {
  const getToken = () => localStorage.getItem('access_token');

  const fetchListUser = useCallback(async () => {
    try {
      const response = await authFetch(API.list_user); // или свой endpoint

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Ошибка загрузки пользователей');
      }

      const data = await response.json();
      return data;

    } catch (err) {
      toast.error(err.message || 'Не удалось загрузить пользователей');
      throw err;
    }
  }, []);

  return {
    fetchListUser,
  };
};
