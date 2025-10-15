import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import logo from '../images/logo.jpg';
import { API } from "../config/api.js";




const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const setChecking = useState(false);
  const [emailError, setEmailError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    patronymic: '',
    date_birth: '',
    phone_number: '',
    telegram: '',
    avatar: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({ ...formData, [name]: files ? files[0] : value });
    setEmailError('');
  };

  const checkEmail = async() => {
    if (!formData.email) return;
    setChecking(true);

    try {
        const results = await fetch(
            `${API.check_email}?email=${formData.email}`
        );
        const data = await results.json();

        if (data.exists){
            setEmailError("Пользователь с такой почтой уже существует");
            toast.error("Эта почта уже зарегистрирована");
        }
    } catch (err) {
        toast.error("Ошибка при проверке почты");
    } finally {
        setChecking(false)
    }
  };
  const nextStep = () => {
    // простая валидация
    if (step === 1 && formData.password !== formData.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) form.append(key, value);
    });

    try {
      const response = await fetch(API.register, {
        method: 'POST',
        body: form,
      });

      if (response.ok) {
        toast.success('Профиль успешно создан!');
        navigate('/login');
      } else {
        toast.error('Ошибка при регистрации');
      }
    } catch (err) {
      toast.error('Сервер недоступен');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h2 className="font-semibold text-lg mb-6">Создание профиля — шаг 1</h2>

            {/* Email */}
            <label className="relative w-full block">
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={checkEmail}
                placeholder=" "
                required
                className="peer w-full h-[55px] border border-gray-300 rounded-lg px-3 pt-5 pb-2 text-[16px] outline-none focus:border-green-500"
              />
              <span className={`absolute left-3 px-1 bg-white text-gray-600 transition-all duration-200 ease-in-out pointer-events-none
                ${formData.email ? 'top-[-10px] text-[14px] text-green-600' : 'top-[16px] text-[16px]'} 
                peer-focus:top-[-10px] peer-focus:text-[14px] peer-focus:text-green-600`}>
                Электронная почта
              </span>
            </label>
            {emailError && <p className="left-3 text-red-500 text-[16px]">{emailError}</p>}
            {/* Пароль */}
            <label className="relative w-full block">
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder=" "
                required
                className="peer w-full h-[55px] border border-gray-300 rounded-lg px-3 pt-5 pb-2 text-[16px] outline-none focus:border-green-500"
              />
              <span className={`absolute left-3 px-1 bg-white text-gray-600 transition-all duration-200 ease-in-out pointer-events-none
                ${formData.password ? 'top-[-10px] text-[14px] text-green-600' : 'top-[16px] text-[16px]'} 
                peer-focus:top-[-10px] peer-focus:text-[14px] peer-focus:text-green-600`}>
                Пароль
              </span>
            </label>

            {/* Подтверждение */}
            <label className="relative w-full block">
              <input
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder=" "
                required
                className="peer w-full h-[55px] border border-gray-300 rounded-lg px-3 pt-5 pb-2 text-[16px] outline-none focus:border-green-500"
              />
              <span className={`absolute left-3 px-1 bg-white text-gray-600 transition-all duration-200 ease-in-out pointer-events-none
                ${formData.confirmPassword ? 'top-[-10px] text-[14px] text-green-600' : 'top-[16px] text-[16px]'} 
                peer-focus:top-[-10px] peer-focus:text-[14px] peer-focus:text-green-600`}>
                Подтверждение пароля
              </span>
            </label>

            <button
              type="button"
              onClick={nextStep}
              className="w-full h-[55px] bg-[#39b54a] text-white rounded-lg font-medium hover:bg-[#32a043] transition-all duration-200"
            >
              Продолжить
            </button>
          </>
        );

      case 2:
        return (
          <>
            <h2 className="font-semibold text-lg mb-6">Шаг 2 — Личная информация</h2>

            {['last_name', 'first_name', 'patronymic', 'date_birth'].map((field, i) => (
                <label key={i} className="relative w-full block">
                    <input
                    name={field}
                    type={field === 'date_birth' ? 'date' : 'text'}
                    value={formData[field]}
                    onChange={handleChange}
                    placeholder=" "
                    required
                    className={`peer w-full h-[55px] border border-gray-300 rounded-lg px-3 pt-5 pb-2 text-[16px] outline-none focus:border-green-500 ${
                        field === 'date_birth' ? 'appearance-none' : ''
                    }`}
                    />
                    <span
                    className={`absolute left-3 px-1 bg-white text-gray-600 transition-all duration-200 ease-in-out pointer-events-none
                    ${
                        field === 'date_birth'
                        ? 'text-gray-600 top-[-10px] text-[14px] peer-focus:text-green-600' // для даты — всегда плавающее
                        : formData[field]
                        ? 'top-[-10px] text-[14px] text-green-600'
                        : 'top-[16px] text-[16px]'
                    } peer-focus:top-[-10px] peer-focus:text-[14px] peer-focus:text-green-600`}
                    >
                    {{
                        last_name: 'Фамилия',
                        first_name: 'Имя',
                        patronymic: 'Отчество',
                        date_birth: 'Дата рождения',
                    }[field]}
                    </span>
                </label>
                ))}


            <div className="flex gap-3">
              <button
                type="button"
                onClick={prevStep}
                className="w-1/2 h-[55px] border border-gray-400 rounded-lg text-gray-600 hover:bg-gray-100 transition"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="w-1/2 h-[55px] bg-[#39b54a] text-white rounded-lg hover:bg-[#32a043] transition"
              >
                Продолжить
              </button>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <h2 className="font-semibold text-lg mb-6">Шаг 3 — Контакты</h2>

            {['phone_number', 'telegram'].map((field, i) => (
              <label key={i} className="relative w-full block">
                <input
                  name={field}
                  type="text"
                  value={formData[field]}
                  onChange={handleChange}
                  placeholder=" "
                  required
                  className="peer w-full h-[55px] border border-gray-300 rounded-lg px-3 pt-5 pb-2 text-[16px] outline-none focus:border-green-500"
                />
                <span className={`absolute left-3 px-1 bg-white text-gray-600 transition-all duration-200 ease-in-out pointer-events-none
                ${formData[field] ? 'top-[-10px] text-[14px] text-green-600' : 'top-[16px] text-[16px]'} 
                peer-focus:top-[-10px] peer-focus:text-[14px] peer-focus:text-green-600`}>
                {field === 'phone_number' ? 'Номер телефона' : 'Telegram'}
                </span>
              </label>
            ))}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={prevStep}
                className="w-1/2 h-[55px] border border-gray-400 rounded-lg text-gray-600 hover:bg-gray-100 transition"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="w-1/2 h-[55px] bg-[#39b54a] text-white rounded-lg hover:bg-[#32a043] transition"
              >
                Продолжить
              </button>
            </div>
          </>
        );

      case 4:
        return (
          <>
            <h2 className="font-semibold text-lg mb-6">Шаг 4 — Аватар</h2>

            <label className="block text-left text-gray-600 text-sm mb-2">
              Загрузите фото профиля
            </label>
            <input
              type="file"
              accept="image/*"
              name="avatar"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3"
            />

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={prevStep}
                className="w-1/2 h-[55px] border border-gray-400 rounded-lg text-gray-600 hover:bg-gray-100 transition"
              >
                Назад
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 h-[55px] bg-[#39b54a] text-white rounded-lg hover:bg-[#32a043] transition disabled:opacity-70"
              >
                {loading ? 'Отправка...' : 'Создать профиль'}
              </button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f6f6f6] relative">
      <Toaster />
      <div className="bg-white rounded-lg shadow-md p-[40px] w-[420px] max-w-[90%] text-center">
        <img src={logo} alt="Mashinarium IT-School" className="w-[90px] mx-auto mb-3" />
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {renderStep()}
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
