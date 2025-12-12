import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import logo from '../images/logo.jpg';
import VKLogo from '../images/vk-logo.png';
import YandexLogo from '../images/yandex-logo.png';
import { API } from '../config/api';  // импортируем конфиг

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    try {
      const response = await fetch(API.token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      console.log(response)

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('access_token', data.access_token);

        toast.success('Успешный вход!', { position: 'top-center', duration: 2000 });
        setTimeout(() => navigate('/my'), 800);
      } else if (response.status === 401) {
        toast.error(data.detail || 'Неверный логин или пароль!', {
          position: 'top-center',
          duration: 2500,
        });
      } else if (response.status === 422){
          console.log(data.detail);
      }
    } catch (err) {
      console.error('Ошибка сети:', err);
      toast.error('Ошибка соединения с сервером', { position: 'top-center' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f6f6f6] relative">
      <Toaster />

      <div className="bg-white rounded-lg shadow-md p-[40px] w-[420px] max-w-[90%] text-center">
        <img src={logo} alt="Mashinarium IT-School" className="w-[90px] mx-auto mb-3" />

        <h2 className="font-semibold text-lg mb-6">Вход в профиль</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="relative w-full block">
            <input
              name="email"
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=" "
              required
              className="peer w-full h-[55px] border border-gray-300 rounded-lg px-3 pt-5 pb-2 text-[16px] outline-none transition-colors duration-200 focus:border-green-500"
            />
            <span
              className={`absolute left-3 px-1 bg-white text-gray-600 transition-all duration-200 ease-in-out pointer-events-none
                ${
                  username
                    ? 'top-[-10px] text-[14px] text-green-600'
                    : 'top-[16px] text-[16px]'
                } peer-focus:top-[-10px] peer-focus:text-[14px] peer-focus:text-green-600`}
            >
              Электронная почта
            </span>
          </label>

          <label className="relative w-full block">
            <input
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              required
              className="peer w-full h-[55px] border border-gray-300 rounded-lg px-3 pt-5 pb-2 text-[16px] outline-none transition-colors duration-200 focus:border-green-500"
            />
            <span
              className={`absolute left-3 px-1 bg-white text-gray-600 transition-all duration-200 ease-in-out pointer-events-none
                ${
                  password
                    ? 'top-[-10px] text-[14px] text-green-600'
                    : 'top-[16px] text-[16px]'
                } peer-focus:top-[-10px] peer-focus:text-[14px] peer-focus:text-green-600`}
            >
              Пароль
            </span>
          </label>

          <div className="text-left text-[13px] text-gray-500 cursor-pointer mt-1 hover:text-gray-700">
            Не помню пароль
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[55px] bg-[#39b54a] text-white rounded-lg text-[16px] font-medium hover:bg-[#32a043] transition-all duration-200 disabled:opacity-70"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <button
          onClick={() => navigate('/register')}
          className="w-full h-[55px] mt-3 border border-gray-300 bg-white rounded-lg text-[16px] font-medium text-gray-700 hover:border-[#39b54a] hover:text-[#39b54a] transition-all duration-200"
        >
          Создать профиль
        </button>

        <div className="mt-4 flex justify-center gap-6">
          <button className="border border-[#4a76a8] bg-white rounded-full w-[55px] h-[55px] flex justify-center items-center hover:scale-110 shadow-sm hover:shadow transition">
            <img src={VKLogo} alt="VK" className="w-[28px] h-[28px]" />
          </button>

          <button className="border border-[#e53935] bg-white rounded-full w-[55px] h-[55px] flex justify-center items-center hover:scale-110 shadow-sm hover:shadow transition">
            <img src={YandexLogo} alt="Yandex" className="w-[28px] h-[28px]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
