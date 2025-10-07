import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import '../css/LoginPage.css';

import logo from '../images/logo.jpg';
import VKLogo from '../images/vk-logo.png';
import YandexLogo from '../images/yandex-logo.png';

const LoginPage = () => {
  const [email, setEmail] = useState('PlagueEvgeny@yandex.ru');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (email !== 'PlagueEvgeny@yandex.ru' || password !== '123456') {
      setError(true);
      toast.error('Неверный логин или пароль!', {
        duration: 2500,
        position: 'top-center',
      });
    } else {
      setError(false);
      toast.success('Успешный вход!', {
        duration: 2000,
        position: 'top-center',
      });
      console.log('Успешный вход');
      // здесь можно добавить переход на профиль, например:
      // navigate('/profile');
    }
  };

  return (
    <div className="auth-page">
      {/* Toaster нужно размещать один раз на странице */}
      <Toaster />

      <div className="auth-card">
        <img src={logo} alt="Mashinarium IT-School" className="auth-logo" />

        <h2 className="auth-title">Вход в профиль</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-container">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          <div className="auth-forgot">Не помню пароль</div>

          <button type="submit" className="auth-submit">
            Войти
          </button>
        </form>

        <button className="auth-create">Создать профиль</button>

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
