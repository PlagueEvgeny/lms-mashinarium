import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { API } from '../../services/api';
import { useAdmin } from '../../hooks/useAdmin';
import VKLogo from '../../assets/vk-logo.png';
import YandexLogo from '../../assets/yandex-logo.png';

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { fetchSettings } = useAdmin();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchSettings();
        setSettings(data || {}); // 👈 ВАЖНО
        console.log(data)
      } catch (error) {
        console.error(error);
        setSettings({});
      }
    };

    loadSettings();
  }, []);
  
  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      navigate('/', { replace: true });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await fetch(API.token, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      console.log(response)

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('access_token', data.access_token);

        toast.success('Успешный вход!', { position: 'top-center', duration: 2000 });
        setTimeout(() => navigate('/'), 800);
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Helmet>
        <title>Авторизация</title>
      </Helmet>
      <Toaster position="top-center" />
      <div className="w-full max-w-md bg-card rounded-2xl shadow-sm p-8 border border-border">
        <div className="flex flex-col items-center mb-8">
          <img src={settings?.logo_url} alt="Mashinarium IT-School" className="w-[90px] mx-auto mb-3" />
          <h1 className="text-xl font-semibold text-foreground">Вход в профиль</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Электронная почта</label>
            <input 
              name="email"
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring=2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Пароль</label>
            <input 
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring=2 focus:ring-primary"
              required
            />
          </div>
          <div className="text-left text-[13px] text-gray-500 cursor-pointer mt-1 hover:text-gray-700">
            Не помню пароль
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>

          <button 
          type="button"
          onClick={() => navigate('/register')}
          className="w-full border border-border py-3 rounded-lg font-medium hover:bg-muted transition-colors"  
          >
            Создать профиль
          </button>
        </form>
        <div className="mt-6">
          <p className="text-center text-xs text-muted-foregraund mb-4">Войти с помощью</p>
          <div className="flex justify-center gap-4">
            <button 
              className="border border-[#4a76a8] bg-white rounded-full w-[55px] h-[55px] flex justify-center items-center hover:scale-110 shadow-sm hover:shadow transition">
              <img src={VKLogo} alt="VK" className="w-[28px] h-[28px]" />
            </button>

            <button 
              className="border border-[#e53935] bg-white rounded-full w-[55px] h-[55px] flex justify-center items-center hover:scale-110 shadow-sm hover:shadow transition">
              <img src={YandexLogo} alt="Yandex" className="w-[28px] h-[28px]" />
          </button>
          </div>
        </div> 
    </div>        
    </div>

  )
}

export default LoginPage
