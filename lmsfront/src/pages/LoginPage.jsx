import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import '../css/LoginPage.css';

import logo from '../images/logo.jpg';
import VKLogo from '../images/vk-logo.png';
import YandexLogo from '../images/yandex-logo.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://127.0.0.1:5000/api/token/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('access', data.access);
        localStorage.setItem('refresh', data.refresh);

        toast.success('Успешный вход!', {
          position: 'top-center',
          duration: 2000,
        });

        setTimeout(() => {
          navigate('/profile'); 
        }, 800);
      } else {
        console.error('Ошибка входа:', data);
        toast.error(data.detail || 'Неверный логин или пароль!', {
          position: 'top-center',
          duration: 2500,
        });
      }
    } catch (err) {
      console.error('Ошибка сети:', err);
      toast.error('Ошибка соединения с сервером', {
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Toaster />

      <div className="auth-card">
        <img src={logo} alt="Mashinarium IT-School" className="auth-logo" />
        <h2 className="auth-title">Вход в профиль</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-container">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              className={`auth-input ${email ? 'filled' : ''}`}
              required
            />
            <label className="floating-label">Электронная почта</label>
          </div>

          <div className="input-container">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`auth-input ${password ? 'filled' : ''}`}
              required
            />
            <label className="floating-label">Пароль</label>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <button
          className="auth-create"
          onClick={() => navigate('/register')}
        >
          Создать профиль
        </button>

        <div className="auth-social">
          <button className="social-btn vk" title="Войти через ВКонтакте">
            <img src={VKLogo} alt="VK" className="social-icon" />
          </button>
          <button className="social-btn yandex" title="Войти через Яндекс">
            <img src={YandexLogo} alt="Yandex" className="social-icon" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
