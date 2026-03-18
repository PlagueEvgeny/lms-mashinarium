import { useState, useEffect } from 'react'
import toast from 'react-hot-toast';

function PersonalInfoTab({ user, updateUser, deleteUser }) {
  const [formData, setFormData] = useState({
    last_name: user?.last_name || "",
    first_name: user?.first_name || "",
    patronymic: user?.patronymic || "",
    avatar: user?.avatar || "",
    telegram: user?.telegram || "",
    phone: user?.phone || "",
    gender: user?.gender?.[0] || user?.gender || "",
    date_of_birth: user?.date_of_birth || ""
  });

  useEffect(() => {
    setFormData({
      last_name: user?.last_name || "",
      first_name: user?.first_name || "",
      patronymic: user?.patronymic || "",
      avatar: user?.avatar || "",
      telegram: user?.telegram || "",
      phone: user?.phone || "",
      gender: user?.gender?.[0] || user?.gender || "",
      date_of_birth: user?.date_of_birth || ""
    });
  }, [user]);
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUser({
        ...formData,
        gender: formData.gender ? [formData.gender] : [], 
      });
    } catch (err) {
      toast.error(err.message);
    }
  };
  return (
    <div>
      <div className='flex items-center gap-4 mb-8'>
        <div className='w-16 h-16 rounded-full bg-muted overflow-hidden'>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.first_name}
            className='w-full h-full object-cover'
           / >
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-xl font-medium">
              {user?.first_name?.[0]}
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold">{user?.first_name} {user?.last_name}</h2>
          <p className='text-sm text-muted-foreground'>{user?.email}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className='bg-card rounded-xl p-6 mb-6'>
        <h3 className='text-lg font-semibold mb-6'>Личная информация</h3>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <div>
            <label className='block text-xs text-muted-foreground mb-1'>Фамилия</label>
            <input type="text" 
                   name="last_name" 
                   value={formData.last_name}
                   onChange={(e) => handleChange('last_name', e.target.value)}
                   className='w-full px-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary'
            / >
          </div>
          <div>
            <label className='block text-xs text-muted-foreground mb-1'>Имя</label>
            <input type="text" 
                   name="first_name" 
                   value={formData.first_name}
                   onChange={(e) => handleChange('first_name', e.target.value)}
                   className='w-full px-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary'
            / >
          </div>
          <div>
            <label className='block text-xs text-muted-foreground mb-1'>Отчество</label>
            <input type="text" 
                   name="patronymic" 
                   value={formData.patronymic}
                   onChange={(e) => handleChange('patronymic', e.target.value)}
                   className='w-full px-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary'
            / >
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <div>
            <label className='block text-xs text-muted-foreground mb-1'>Дата рождения</label>
            <input type="text" 
                   name="date_of_birth" 
                   value={formData.date_of_birth}
                   onChange={(e) => handleChange('date_of_birth', e.target.value)}
                   className='w-full px-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary'
            / >
          </div>
          <div>
            <label className='block text-xs text-muted-foreground mb-1'>Номер телефона</label>
            <input type="text" 
                   name="phone" 
                   value={formData.phone}
                   onChange={(e) => handleChange('phone', e.target.value)}
                   className='w-full px-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary'
            / >
          </div>
          <div>
            <label className='block text-xs text-muted-foreground mb-1'>Пол</label>
            <select 
                   name="gender" 
                   value={formData.gender}
                   onChange={(e) => handleChange('gender', e.target.value)}
                   className='w-full px-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary'
            >
              <option value="">Выберите</option>
              <option value="MALE">Мужской</option>
              <option value="FEMALE">Женский</option>
            </select> 
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <div>
            <label className='block text-xs text-muted-foreground mb-1'>Telegram</label>
            <input type="text" 
                   name="telegram" 
                   value={formData.telegram}
                   onChange={(e) => handleChange('telegram', e.target.value)}
                   className='w-full px-4 py-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary'
            / >
          </div>
        </div>
        <button type="submit" className='bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors'>
          Сохранить
        </button>
      </form>
      <div className='bg-card rounded-xl p-6'>
        <h3 className='text-lg font-semibold mb-4'>Удаление профиля</h3>
        <p className='text-sm text-muted-foreground mb-4'>
        После запроса на удаление, ваш профиль и персональные данные будут полностью удалены через 30 дней.
        В течение этого времени вы можете написать в поддержку для отмены удаления.
        </p>
        <button 
          onClick={async () => {
            if (confirm('Удалить аккаунт?')) deleteUser();
          }}
          className='border border-destructive text-destructive px-6 py-3 rounded-lg font-medium hover:bg-destructive/10 transition-colors'>
          Удалить профиль
        </button>
      </div>
    </div>
  );
};

export default PersonalInfoTab;

