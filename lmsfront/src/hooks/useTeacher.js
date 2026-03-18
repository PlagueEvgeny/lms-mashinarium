import { useState, useEffect, useRef } from 'react';
import { API } from '../services/api.js';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const useTeacher = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshTimerRef = useRef(null);
  
  const createCourse = async (formData) => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API.user, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Ошибка создания');
    }  
    toast.success('Курс создан');
  };

  return {
    createCourse
    },
};
