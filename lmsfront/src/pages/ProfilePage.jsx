import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { useAuthUser } from '../hooks/useAuthUser';
import { getAvatarUrl } from '../utils/helpers';
import { API } from '../config/api';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, loading, refetch } = useAuthUser();
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Инициализация формы данными пользователя
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        patronymic: user.patronymic || '',
        date_birth: user.date_birth || '',
        phone_number: user.phone_number || '',
        gender: user.gender || '',
        telegram: user.telegram || '',
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('Ошибка: ID пользователя не найден');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access');
      
      // Используем partial-update эндпоинт
      const response = await fetch(API.userPartialUpdate(user.id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = getErrorMessage(errorData);
        throw new Error(errorMessage);
      }

      await refetch(); // Обновляем данные пользователя
      setIsEditing(false);
      toast.success('Профиль успешно обновлен');
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error('Пароль должен содержать минимум 8 символов');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access');
      
      const response = await fetch(API.set_password, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = getErrorMessage(errorData);
        throw new Error(errorMessage);
      }

      setPasswordData({});
      toast.success('Пароль успешно изменен');
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) {
      toast.error('Ошибка: ID пользователя не найден');
      return;
    }

    if (!window.confirm('Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.')) {
      return;
    }

    if (!window.confirm('ВНИМАНИЕ: Все ваши данные будут безвозвратно удалены. Подтвердите удаление.')) {
      return;
    }

    try {
      const token = localStorage.getItem('access');
      
      const response = await fetch(API.userDelete(user.id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка при удалении аккаунта');
      }

      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      toast.success('Аккаунт успешно удален');
      window.location.href = '/';
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Ошибка при удалении аккаунта');
    }
  };

  const handleAvatarUpdate = async (file) => {
    if (!user?.id) {
      toast.error('Ошибка: ID пользователя не найден');
      return;
    }

    try {
      const token = localStorage.getItem('access');
      const formData = new FormData();
      formData.append('avatar', file);

      // Для обновления аватара используем partial-update
      const response = await fetch(API.userPartialUpdate(user.id), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Ошибка при обновлении аватара');
      }

      await refetch();
      toast.success('Аватар успешно обновлен');
    } catch (error) {
      console.error('Avatar update error:', error);
      toast.error(error.message || 'Ошибка при обновлении аватара');
    }
  };

  // Функция для обработки ошибок Django
  const getErrorMessage = (errorData) => {
    if (typeof errorData === 'string') {
      return errorData;
    }
    
    if (errorData.detail) {
      return errorData.detail;
    }
    
    // Обработка ошибок валидации полей
    const fieldErrors = [];
    for (const [field, errors] of Object.entries(errorData)) {
      if (Array.isArray(errors)) {
        fieldErrors.push(`${field}: ${errors.join(', ')}`);
      } else {
        fieldErrors.push(`${field}: ${errors}`);
      }
    }
    
    return fieldErrors.length > 0 ? fieldErrors.join('; ') : 'Произошла ошибка';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!user) return navigate('/login');

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Навигация */}
          <div className="bg-white rounded-2xl shadow-sm mb-6">
            <div className="border-b border-gray-200 flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-4 text-lg font-semibold transition-all border-b-2 ${
                  activeTab === 'info'
                    ? 'text-green-600 border-green-600'
                    : 'text-gray-500 border-transparent hover:text-green-500'
                }`}
              >
                Личная информация
              </button>
              <button
                onClick={() => setActiveTab('auth')}
                className={`py-4 text-lg font-semibold transition-all border-b-2 ${
                  activeTab === 'auth'
                    ? 'text-green-600 border-green-600'
                    : 'text-gray-500 border-transparent hover:text-green-500'
                }`}
              >
                Безопасность
              </button>
            </div>
          </div>

          {/* Личная информация */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Карточка профиля */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <img
                      src={getAvatarUrl(user?.avatar)}
                      alt="Аватар"
                      className="w-28 h-28 rounded-full object-cover border-4 border-green-100"
                      onError={(e) => (e.target.src = getAvatarUrl(null))}
                    />
                    <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition shadow-lg cursor-pointer">
                      <EditIcon size={16} />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error('Размер файла не должен превышать 5MB');
                              return;
                            }
                            handleAvatarUpdate(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {user.last_name} {user.first_name} {user.patronymic}
                    </h3>
                    <p className="text-gray-500 mt-1">{user.email}</p>
                    <div className="flex gap-4 mt-3">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {user.role === 't' ? 'Преподаватель' : 
                         user.role === 's' ? 'Ученик' : 
                         user.role === 'a' ? 'Администратор' : 'Пользователь'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Форма редактирования */}
              <form onSubmit={handleProfileUpdate} className="bg-white rounded-2xl shadow-sm p-8">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-semibold text-gray-900">Личная информация</h4>
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
                  >
                    {isEditing ? 'Отменить' : 'Редактировать'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <InputField 
                    label="Фамилия" 
                    value={formData.last_name}
                    onChange={(value) => handleInputChange('last_name', value)}
                    disabled={!isEditing}
                    required
                  />
                  <InputField 
                    label="Имя" 
                    value={formData.first_name}
                    onChange={(value) => handleInputChange('first_name', value)}
                    disabled={!isEditing}
                    required
                  />
                  <InputField 
                    label="Отчество" 
                    value={formData.patronymic}
                    onChange={(value) => handleInputChange('patronymic', value)}
                    disabled={!isEditing}
                  />
                  <InputField 
                    label="Дата рождения" 
                    type="date"
                    value={formData.date_birth}
                    onChange={(value) => handleInputChange('date_birth', value)}
                    disabled={!isEditing}
                  />
                  <InputField 
                    label="Номер телефона" 
                    type="tel"
                    value={formData.phone_number}
                    onChange={(value) => handleInputChange('phone_number', value)}
                    disabled={!isEditing}
                    placeholder="+7 (XXX) XXX-XX-XX"
                  />
                  <SelectField 
                    label="Пол" 
                    value={formData.gender}
                    onChange={(value) => handleInputChange('gender', value)}
                    disabled={!isEditing}
                    options={[
                      { value: '', label: 'Не указано' },
                      { value: 'm', label: 'Мужской' },
                      { value: 'f', label: 'Женский' }
                    ]}
                  />
                  <InputField 
                    label="Telegram" 
                    value={formData.telegram}
                    onChange={(value) => handleInputChange('telegram', value)}
                    disabled={!isEditing}
                    placeholder="@username"
                  />
                  <div className="relative">
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full border border-gray-300 rounded-lg p-4 pt-6 bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                    <label className="absolute left-4 top-2 text-gray-500 text-xs">
                      Email (нельзя изменить)
                    </label>
                  </div>
                </div>

                {isEditing && (
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
                  </button>
                )}
              </form>
            </div>
          )}

          {/* Безопасность */}
          {activeTab === 'auth' && (
            <div className="space-y-6">
              {/* Смена пароля */}
              <form onSubmit={handlePasswordUpdate} className="bg-white rounded-2xl shadow-sm p-8">
                <h4 className="text-xl font-semibold mb-6">Смена пароля</h4>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
                  <InputField 
                    label="Текущий пароль" 
                    type="password"
                    value={passwordData.current_password || ''}
                    onChange={(value) => handlePasswordChange('current_password', value)}
                    required
                  />
                  <InputField 
                    label="Новый пароль" 
                    type="password"
                    value={passwordData.new_password || ''}
                    onChange={(value) => handlePasswordChange('new_password', value)}
                    required
                    minLength={8}
                  />
                  <InputField 
                    label="Повторите новый пароль" 
                    type="password"
                    value={passwordData.confirm_password || ''}
                    onChange={(value) => handlePasswordChange('confirm_password', value)}
                    required
                    minLength={8}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Смена пароля...' : 'Сменить пароль'}
                </button>
              </form>

              {/* Удаление аккаунта */}
              <div className="bg-white rounded-2xl shadow-sm p-8 border border-red-100">
                <h4 className="text-xl font-semibold mb-4 text-red-600">Удаление аккаунта</h4>
                <p className="text-gray-700 mb-4">
                  После удаления аккаунта все ваши данные будут безвозвратно удалены. 
                  Это действие нельзя отменить.
                </p>
                <button 
                  onClick={handleDeleteAccount}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition font-medium"
                >
                  Удалить аккаунт
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

// Компоненты полей ввода (остаются без изменений)
const InputField = ({ label, value, type = 'text', onChange, disabled = false, ...props }) => (
  <div className="relative">
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={`peer w-full border border-gray-300 rounded-lg p-4 pt-6 focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
        disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'
      }`}
      {...props}
    />
    <label
      className={`absolute left-4 top-2 text-gray-500 text-xs transition-all 
        peer-focus:top-2 peer-focus:text-xs peer-focus:text-green-600
        ${value ? 'top-2 text-xs' : 'top-4 text-gray-400'}
        ${disabled ? 'text-gray-400' : ''}
      `}
    >
      {label}
    </label>
  </div>
);

const SelectField = ({ label, value, onChange, disabled = false, options = [] }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={`peer w-full bg-white border border-gray-300 rounded-lg p-4 pt-6 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
        disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'
      }`}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <label className={`absolute left-4 top-2 text-xs bg-white px-1 transition ${
      disabled ? 'text-gray-400' : 'text-gray-500 peer-focus:text-green-600'
    }`}>
      {label}
    </label>
    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
);

const EditIcon = ({ size = 20 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export default ProfilePage;